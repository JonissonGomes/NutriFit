package billing

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"nufit/backend/internal/config"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrStripeNotConfigured = errors.New("pagamentos não configurados no servidor")
	ErrInvalidPlan         = errors.New("plano inválido")
)

type CheckoutRequest struct {
	Plan string `json:"plan"` // starter | professional | business
}

func stripeConfigured() bool {
	return strings.TrimSpace(config.AppConfig.StripeSecretKey) != ""
}

func planToPriceID(plan string) (string, models.PlanType, error) {
	switch strings.ToLower(strings.TrimSpace(plan)) {
	case "starter":
		return config.AppConfig.StripePriceStarter, models.PlanStarter, nil
	case "professional":
		return config.AppConfig.StripePriceProfessional, models.PlanProfessional, nil
	case "business":
		return config.AppConfig.StripePriceBusiness, models.PlanBusiness, nil
	default:
		return "", "", ErrInvalidPlan
	}
}

func CreateCheckoutSession(ctx context.Context, userID, successURL, cancelURL, planKey string) (string, error) {
	if !stripeConfigured() {
		return "", ErrStripeNotConfigured
	}
	priceID, planType, err := planToPriceID(planKey)
	if err != nil {
		return "", err
	}
	if priceID == "" {
		return "", fmt.Errorf("%w: price id não configurado para %s", ErrStripeNotConfigured, planKey)
	}

	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return "", err
	}
	var u models.User
	if err := database.UsersCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&u); err != nil {
		return "", err
	}

	form := url.Values{}
	form.Set("mode", "subscription")
	form.Set("success_url", successURL)
	form.Set("cancel_url", cancelURL)
	form.Set("client_reference_id", userID)
	form.Set("customer_email", u.Email)
	form.Set("line_items[0][price]", priceID)
	form.Set("line_items[0][quantity]", "1")
	form.Set("metadata[userId]", userID)
	form.Set("metadata[plan]", string(planType))
	form.Set("subscription_data[metadata][userId]", userID)
	form.Set("subscription_data[metadata][plan]", string(planType))

	body, err := stripeRequest(ctx, http.MethodPost, "/v1/checkout/sessions", form)
	if err != nil {
		return "", err
	}
	var res struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(body, &res); err != nil {
		return "", err
	}
	if res.URL == "" {
		return "", errors.New("stripe não retornou URL de checkout")
	}
	return res.URL, nil
}

func CreatePortalSession(ctx context.Context, userID, returnURL string) (string, error) {
	if !stripeConfigured() {
		return "", ErrStripeNotConfigured
	}
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return "", err
	}
	var billing models.Billing
	err = database.BillingCollection.FindOne(ctx, bson.M{"userId": oid}, options.FindOne().SetSort(bson.M{"updatedAt": -1})).Decode(&billing)
	if err != nil || billing.SubscriptionID == "" {
		return "", errors.New("assinatura não encontrada")
	}

	// Busca customer via subscription
	subBody, err := stripeRequest(ctx, http.MethodGet, "/v1/subscriptions/"+billing.SubscriptionID, nil)
	if err != nil {
		return "", err
	}
	var sub struct {
		Customer string `json:"customer"`
	}
	if err := json.Unmarshal(subBody, &sub); err != nil {
		return "", err
	}

	form := url.Values{}
	form.Set("customer", sub.Customer)
	form.Set("return_url", returnURL)
	body, err := stripeRequest(ctx, http.MethodPost, "/v1/billing_portal/sessions", form)
	if err != nil {
		return "", err
	}
	var res struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(body, &res); err != nil {
		return "", err
	}
	return res.URL, nil
}

func HandleWebhook(ctx context.Context, payload []byte, signature string) error {
	if !stripeConfigured() {
		return ErrStripeNotConfigured
	}
	// Validação simplificada: em produção usar stripe webhook constructEvent
	if config.AppConfig.StripeWebhookSecret != "" && signature == "" {
		return errors.New("assinatura do webhook ausente")
	}

	var event struct {
		Type string `json:"type"`
		Data struct {
			Object json.RawMessage `json:"object"`
		} `json:"data"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return err
	}

	switch event.Type {
	case "checkout.session.completed":
		var session struct {
			ClientReferenceID string `json:"client_reference_id"`
			Subscription      string `json:"subscription"`
			Metadata          map[string]string `json:"metadata"`
		}
		if err := json.Unmarshal(event.Data.Object, &session); err != nil {
			return err
		}
		planType := models.PlanType(session.Metadata["plan"])
		if planType == "" {
			planType = models.PlanStarter
		}
		return upsertBilling(ctx, session.ClientReferenceID, session.Subscription, planType, models.BillingStatusActive)
	case "customer.subscription.updated", "customer.subscription.created":
		var sub struct {
			ID       string            `json:"id"`
			Status   string            `json:"status"`
			Metadata map[string]string `json:"metadata"`
		}
		if err := json.Unmarshal(event.Data.Object, &sub); err != nil {
			return err
		}
		userID := sub.Metadata["userId"]
		planType := models.PlanType(sub.Metadata["plan"])
		status := models.BillingStatusActive
		if sub.Status == "canceled" || sub.Status == "unpaid" {
			status = models.BillingStatusPastDue
		}
		return upsertBilling(ctx, userID, sub.ID, planType, status)
	case "customer.subscription.deleted":
		var sub struct {
			Metadata map[string]string `json:"metadata"`
		}
		if err := json.Unmarshal(event.Data.Object, &sub); err != nil {
			return err
		}
		return setUserPlan(ctx, sub.Metadata["userId"], models.PlanFree)
	}
	return nil
}

func upsertBilling(ctx context.Context, userID, subscriptionID string, planType models.PlanType, status models.BillingStatus) error {
	if userID == "" {
		return nil
	}
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = database.BillingCollection.UpdateOne(ctx,
		bson.M{"userId": oid},
		bson.M{"$set": bson.M{
			"userId":         oid,
			"plan":           planType,
			"subscriptionId": subscriptionID,
			"status":         status,
			"updatedAt":      now,
		}, "$setOnInsert": bson.M{"createdAt": now}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return err
	}
	if status == models.BillingStatusActive && planType != "" {
		return setUserPlan(ctx, userID, planType)
	}
	return nil
}

func setUserPlan(ctx context.Context, userID string, planType models.PlanType) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	_, err = database.UsersCollection.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$set": bson.M{
			"plan":         planType,
			"storageLimit": config.StorageLimitForPlan(planType),
			"updatedAt":    time.Now(),
		},
	})
	return err
}

func stripeRequest(ctx context.Context, method, path string, form url.Values) ([]byte, error) {
	var body io.Reader
	if form != nil {
		body = strings.NewReader(form.Encode())
	}
	req, err := http.NewRequestWithContext(ctx, method, "https://api.stripe.com"+path, body)
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(config.AppConfig.StripeSecretKey, "")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("stripe error %d: %s", resp.StatusCode, string(data))
	}
	return data, nil
}

func ExportUserData(ctx context.Context, userID string) (map[string]interface{}, error) {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	var u models.User
	if err := database.UsersCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&u); err != nil {
		return nil, err
	}
	u.PasswordHash = ""
	patients, _ := database.PatientsCollection.CountDocuments(ctx, bson.M{"nutritionistId": oid})
	export := map[string]interface{}{
		"exportedAt": time.Now(),
		"user":       u,
		"patientsCount": patients,
	}
	return export, nil
}

package rest

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/billing"
)

func createCheckoutSession(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req billing.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plano inválido"})
		return
	}
	successURL := c.Query("success_url")
	cancelURL := c.Query("cancel_url")
	if successURL == "" {
		successURL = "http://localhost:5173/nutritionist/settings?tab=billing&status=success"
	}
	if cancelURL == "" {
		cancelURL = "http://localhost:5173/pricing"
	}
	url, err := billing.CreateCheckoutSession(c.Request.Context(), userID.(string), successURL, cancelURL, req.Plan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"url": url}})
}

func createBillingPortal(c *gin.Context) {
	userID, _ := c.Get("userID")
	returnURL := c.Query("return_url")
	if returnURL == "" {
		returnURL = "http://localhost:5173/nutritionist/settings?tab=billing"
	}
	url, err := billing.CreatePortalSession(c.Request.Context(), userID.(string), returnURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"url": url}})
}

func stripeWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload inválido"})
		return
	}
	sig := c.GetHeader("Stripe-Signature")
	if err := billing.HandleWebhook(c.Request.Context(), payload, sig); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"received": true})
}

func exportAccountData(c *gin.Context) {
	userID, _ := c.Get("userID")
	data, err := billing.ExportUserData(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao exportar dados"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

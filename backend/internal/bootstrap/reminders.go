package bootstrap

import (
	"context"
	"fmt"
	"time"

	"nufit/backend/internal/config"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/smtp"
)

// StartEventReminderWorker envia lembretes por e-mail para eventos nas próximas 24h.
func StartEventReminderWorker(ctx context.Context) {
	if config.AppConfig.EmailUser == "" || config.AppConfig.EmailPass == "" {
		return
	}
	ticker := time.NewTicker(30 * time.Minute)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				_ = sendUpcomingEventReminders(ctx)
			}
		}
	}()
}

func sendUpcomingEventReminders(ctx context.Context) error {
	now := time.Now()
	windowEnd := now.Add(24 * time.Hour)
	cursor, err := database.EventsCollection.Find(ctx, bson.M{
		"date": bson.M{"$gte": now, "$lte": windowEnd},
		"status": bson.M{"$ne": "cancelled"},
	})
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)
	for cursor.Next(ctx) {
		var ev models.Event
		if err := cursor.Decode(&ev); err != nil {
			continue
		}
		if ev.UserID.IsZero() {
			continue
		}
		var u models.User
		if err := database.UsersCollection.FindOne(ctx, bson.M{"_id": ev.UserID}).Decode(&u); err != nil {
			continue
		}
		if u.Email == "" {
			continue
		}
		subject := fmt.Sprintf("Lembrete NuFit: %s", ev.Title)
		body := fmt.Sprintf("Você tem o evento \"%s\" em %s às %s.", ev.Title, ev.Date.Format("02/01/2006"), ev.Time)
		_ = sendEmail(u.Email, subject, body)
	}
	return nil
}

func sendEmail(to, subject, body string) error {
	from := config.AppConfig.EmailUser
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s", to, subject, body))
	addr := fmt.Sprintf("%s:%d", config.AppConfig.GmailSMTPHost, config.AppConfig.GmailSMTPPort)
	auth := smtp.PlainAuth("", config.AppConfig.EmailUser, config.AppConfig.EmailPass, config.AppConfig.GmailSMTPHost)
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}

// SeedMealPlanTemplates insere modelos globais se a collection estiver vazia.
func SeedMealPlanTemplates(ctx context.Context) error {
	count, err := database.MealPlanTemplatesCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	now := time.Now()
	templates := []interface{}{
		models.MealPlanTemplate{
			ID:          primitive.NewObjectID(),
			Title:       "Plano equilibrado 2000 kcal",
			Description: "Modelo base para manutenção calórica",
			Category:    "manutencao",
			IsGlobal:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		models.MealPlanTemplate{
			ID:          primitive.NewObjectID(),
			Title:       "Plano hipocalórico leve",
			Description: "Modelo para déficit calórico moderado",
			Category:    "emagrecimento",
			IsGlobal:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	}
	_, err = database.MealPlanTemplatesCollection.InsertMany(ctx, templates)
	return err
}

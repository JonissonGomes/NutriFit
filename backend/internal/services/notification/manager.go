package notification

import (
	"context"
	"errors"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrNotificationNotFound = errors.New("notificação não encontrada")
	ErrInvalidUserID        = errors.New("ID de usuário inválido")
)

// CreateNotification cria uma nova notificação
func CreateNotification(ctx context.Context, notification *models.Notification) error {
	notification.ID = primitive.NewObjectID()
	notification.Read = false
	notification.Sent = false
	notification.CreatedAt = time.Now()
	notification.UpdatedAt = time.Now()

	_, err := database.NotificationsCollection.InsertOne(ctx, notification)
	return err
}

// GetUserNotifications obtém notificações de um usuário
func GetUserNotifications(ctx context.Context, userID string, page, limit int, unreadOnly bool) ([]*models.Notification, int64, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, ErrInvalidUserID
	}

	filter := bson.M{"userId": userObjID}
	if unreadOnly {
		filter["read"] = false
	}

	// Contar total
	total, err := database.NotificationsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Buscar notificações
	skip := int64((page - 1) * limit)
	findOptions := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := database.NotificationsCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var notifications []*models.Notification
	if err = cursor.All(ctx, &notifications); err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

// GetUnreadCount retorna o número de notificações não lidas
func GetUnreadCount(ctx context.Context, userID string) (int64, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return 0, ErrInvalidUserID
	}

	return database.NotificationsCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
		"read":   false,
	})
}

// MarkAsRead marca uma notificação como lida
func MarkAsRead(ctx context.Context, notificationID, userID string) error {
	notifObjID, err := primitive.ObjectIDFromHex(notificationID)
	if err != nil {
		return ErrNotificationNotFound
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	now := time.Now()
	result, err := database.NotificationsCollection.UpdateOne(
		ctx,
		bson.M{"_id": notifObjID, "userId": userObjID},
		bson.M{
			"$set": bson.M{
				"read":      true,
				"readAt":    now,
				"updatedAt": now,
			},
		},
	)

	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrNotificationNotFound
	}

	return nil
}

// MarkAllAsRead marca todas as notificações como lidas
func MarkAllAsRead(ctx context.Context, userID string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	now := time.Now()
	_, err = database.NotificationsCollection.UpdateMany(
		ctx,
		bson.M{"userId": userObjID, "read": false},
		bson.M{
			"$set": bson.M{
				"read":      true,
				"readAt":    now,
				"updatedAt": now,
			},
		},
	)

	return err
}

// DeleteNotification deleta uma notificação
func DeleteNotification(ctx context.Context, notificationID, userID string) error {
	notifObjID, err := primitive.ObjectIDFromHex(notificationID)
	if err != nil {
		return ErrNotificationNotFound
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	result, err := database.NotificationsCollection.DeleteOne(
		ctx,
		bson.M{"_id": notifObjID, "userId": userObjID},
	)

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrNotificationNotFound
	}

	return nil
}

// ==============================================
// FUNÇÕES DE CRIAÇÃO DE NOTIFICAÇÕES ESPECÍFICAS
// ==============================================

// NotifyNewMessage cria notificação de nova mensagem
func NotifyNewMessage(ctx context.Context, receiverID primitive.ObjectID, senderName string) error {
	notification := &models.Notification{
		UserID:   receiverID,
		Type:     models.NotificationTypeMessage,
		Title:    "Nova mensagem",
		Message:  senderName + " enviou uma mensagem",
		Channels: []models.NotificationChannel{models.ChannelInApp, models.ChannelEmail},
	}
	return CreateNotification(ctx, notification)
}

// NotifyNewReview cria notificação de nova avaliação
func NotifyNewReview(ctx context.Context, architectID primitive.ObjectID, clientName string, rating int) error {
	notification := &models.Notification{
		UserID:   architectID,
		Type:     models.NotificationTypeReview,
		Title:    "Nova avaliação",
		Message:  clientName + " deixou uma avaliação de " + string(rune('0'+rating)) + " estrelas",
		Channels: []models.NotificationChannel{models.ChannelInApp, models.ChannelEmail},
	}
	return CreateNotification(ctx, notification)
}

// NotifyVerificationApproved cria notificação de verificação aprovada
func NotifyVerificationApproved(ctx context.Context, userID primitive.ObjectID) error {
	notification := &models.Notification{
		UserID:   userID,
		Type:     models.NotificationTypeVerification,
		Title:    "Verificação aprovada!",
		Message:  "Seu perfil foi verificado. Agora você tem o selo de profissional verificado.",
		Channels: []models.NotificationChannel{models.ChannelInApp, models.ChannelEmail},
	}
	return CreateNotification(ctx, notification)
}

// NotifyVerificationRejected cria notificação de verificação rejeitada
func NotifyVerificationRejected(ctx context.Context, userID primitive.ObjectID, reason string) error {
	notification := &models.Notification{
		UserID:   userID,
		Type:     models.NotificationTypeVerification,
		Title:    "Verificação não aprovada",
		Message:  "Sua verificação não foi aprovada. Motivo: " + reason,
		Channels: []models.NotificationChannel{models.ChannelInApp, models.ChannelEmail},
	}
	return CreateNotification(ctx, notification)
}

// NotifyEventReminder cria notificação de lembrete de evento
func NotifyEventReminder(ctx context.Context, userID, eventID primitive.ObjectID, eventTitle string, eventTime time.Time) error {
	notification := &models.Notification{
		UserID:      userID,
		Type:        models.NotificationTypeEventReminder,
		Title:       "Lembrete: " + eventTitle,
		Message:     "Você tem um evento em 30 minutos: " + eventTitle,
		RelatedType: "event",
		RelatedID:   &eventID,
		Channels:    []models.NotificationChannel{models.ChannelInApp, models.ChannelEmail},
	}
	return CreateNotification(ctx, notification)
}

// NotifyNewFavorite cria notificação de novo favorito
func NotifyNewFavorite(ctx context.Context, architectID primitive.ObjectID, clientName string) error {
	notification := &models.Notification{
		UserID:   architectID,
		Type:     models.NotificationTypeFavorite,
		Title:    "Novo favorito",
		Message:  clientName + " adicionou você aos favoritos",
		Channels: []models.NotificationChannel{models.ChannelInApp},
	}
	return CreateNotification(ctx, notification)
}

// ==============================================
// PREFERÊNCIAS DE NOTIFICAÇÃO
// ==============================================

// GetUserPreferences obtém preferências de notificação de um usuário
func GetUserPreferences(ctx context.Context, userID string) (*models.NotificationPreference, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidUserID
	}

	var prefs models.NotificationPreference
	err = database.NotificationPrefsCollection.FindOne(ctx, bson.M{"userId": userObjID}).Decode(&prefs)
	if err != nil {
		// Retornar preferências padrão
		return getDefaultPreferences(userObjID), nil
	}

	return &prefs, nil
}

// UpdateUserPreferences atualiza preferências de notificação
func UpdateUserPreferences(ctx context.Context, userID string, updates map[string]interface{}) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	updates["updatedAt"] = time.Now()

	_, err = database.NotificationPrefsCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		bson.M{"$set": updates},
		options.Update().SetUpsert(true),
	)

	return err
}

// getDefaultPreferences retorna preferências padrão
func getDefaultPreferences(userID primitive.ObjectID) *models.NotificationPreference {
	prefs := &models.NotificationPreference{
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	prefs.EventReminders.Enabled = true
	prefs.EventReminders.MinutesBefore = 30
	prefs.ProjectUpdates.Enabled = true
	prefs.ProjectUpdates.Email = true
	prefs.Messages.Enabled = true
	prefs.Messages.Email = true
	prefs.Reviews.Enabled = true
	prefs.Reviews.Email = true
	prefs.Marketing.Enabled = false
	prefs.GlobalChannels.Email.Enabled = true
	prefs.GlobalChannels.SMS.Enabled = false
	prefs.GlobalChannels.Push.Enabled = false
	prefs.QuietHours.Enabled = false

	return prefs
}




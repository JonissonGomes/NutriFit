package settings

import (
	"context"
	"errors"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/auth"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrSettingsNotFound = errors.New("configurações não encontradas")
	ErrInvalidData      = errors.New("dados inválidos")
	ErrInvalidPassword  = errors.New("senha atual incorreta")
	ErrPasswordTooWeak  = errors.New("senha muito fraca")
)

// ============================================
// CONFIGURAÇÕES DO USUÁRIO
// ============================================

// GetSettings retorna as configurações do usuário
func GetSettings(ctx context.Context, userID string) (*models.UserSettings, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	var settings models.UserSettings
	err = database.UserSettingsCollection.FindOne(ctx, bson.M{"userId": userObjID}).Decode(&settings)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Criar configurações padrão
			return createDefaultSettings(ctx, userObjID)
		}
		return nil, err
	}

	return &settings, nil
}

// createDefaultSettings cria configurações padrão para um usuário
func createDefaultSettings(ctx context.Context, userObjID primitive.ObjectID) (*models.UserSettings, error) {
	settings := &models.UserSettings{
		ID:     primitive.NewObjectID(),
		UserID: userObjID,
		Notifications: &models.NotificationSettings{
			Email:          true,
			ProjectUpdates: true,
			ClientMessages: true,
			MarketingEmails: false,
		},
		Preferences: &models.Preferences{
			Language: "pt-BR",
			Theme:    "light",
		},
		Privacy: &models.PrivacySettings{
			ProfileVisibility: "public",
			ShowEmail:         false,
			ShowPhone:         true,
		},
		TwoFactorAuth: &models.TwoFactorAuth{
			Enabled: false,
		},
		UpdatedAt: time.Now(),
	}

	_, err := database.UserSettingsCollection.InsertOne(ctx, settings)
	if err != nil {
		return nil, err
	}

	return settings, nil
}

// UpdateNotifications atualiza configurações de notificações
func UpdateNotifications(ctx context.Context, userID string, notifications *models.NotificationSettings) (*models.UserSettings, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Garantir que as configurações existem
	_, err = GetSettings(ctx, userID)
	if err != nil && err != ErrSettingsNotFound {
		return nil, err
	}

	update := bson.M{
		"$set": bson.M{
			"notifications": notifications,
			"updatedAt":     time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err = database.UserSettingsCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
		opts,
	)
	if err != nil {
		return nil, err
	}

	return GetSettings(ctx, userID)
}

// UpdatePreferences atualiza preferências do usuário
func UpdatePreferences(ctx context.Context, userID string, preferences *models.Preferences) (*models.UserSettings, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Validar valores
	if preferences.Theme != "light" && preferences.Theme != "dark" {
		preferences.Theme = "light"
	}

	update := bson.M{
		"$set": bson.M{
			"preferences": preferences,
			"updatedAt":   time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err = database.UserSettingsCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
		opts,
	)
	if err != nil {
		return nil, err
	}

	return GetSettings(ctx, userID)
}

// UpdatePrivacy atualiza configurações de privacidade
func UpdatePrivacy(ctx context.Context, userID string, privacy *models.PrivacySettings) (*models.UserSettings, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Validar valores
	if privacy.ProfileVisibility != "public" && privacy.ProfileVisibility != "private" {
		privacy.ProfileVisibility = "public"
	}

	update := bson.M{
		"$set": bson.M{
			"privacy":   privacy,
			"updatedAt": time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err = database.UserSettingsCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
		opts,
	)
	if err != nil {
		return nil, err
	}

	return GetSettings(ctx, userID)
}

// ============================================
// PERFIL DO USUÁRIO
// ============================================

// ProfileData dados do perfil do usuário
type ProfileData struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Phone  string `json:"phone,omitempty"`
	Bio    string `json:"bio,omitempty"`
	Avatar string `json:"avatar,omitempty"`
}

// GetProfile retorna dados do perfil do usuário
func GetProfile(ctx context.Context, userID string) (*ProfileData, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	var user models.User
	err = database.UsersCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &ProfileData{
		ID:     user.ID.Hex(),
		Name:   user.Name,
		Email:  user.Email,
		Phone:  user.Phone,
		Bio:    user.Bio,
		Avatar: user.Avatar,
	}, nil
}

// UpdateProfile atualiza dados do perfil do usuário
func UpdateProfile(ctx context.Context, userID string, data map[string]interface{}) (*ProfileData, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Campos permitidos para atualização
	allowedFields := map[string]bool{
		"name":   true,
		"phone":  true,
		"bio":    true,
		"avatar": true,
	}

	updates := bson.M{}
	for key, value := range data {
		if allowedFields[key] {
			updates[key] = value
		}
	}

	if len(updates) == 0 {
		return GetProfile(ctx, userID)
	}

	updates["updatedAt"] = time.Now()

	_, err = database.UsersCollection.UpdateByID(ctx, userObjID, bson.M{"$set": updates})
	if err != nil {
		return nil, err
	}

	return GetProfile(ctx, userID)
}

// ============================================
// SEGURANÇA
// ============================================

// ChangePassword altera a senha do usuário
func ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	// Buscar usuário
	var user models.User
	err = database.UsersCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		return err
	}

	// Verificar senha atual
	if !auth.CheckPasswordHash(currentPassword, user.PasswordHash) {
		return ErrInvalidPassword
	}

	// Validar nova senha
	if len(newPassword) < 8 {
		return ErrPasswordTooWeak
	}

	// Hash da nova senha
	newHash, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Atualizar senha
	_, err = database.UsersCollection.UpdateByID(ctx, userObjID, bson.M{
		"$set": bson.M{
			"passwordHash": newHash,
			"updatedAt":    time.Now(),
		},
	})

	return err
}

// ============================================
// CONTA
// ============================================

// DeleteAccount desativa/remove a conta do usuário
func DeleteAccount(ctx context.Context, userID, password string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	// Buscar usuário
	var user models.User
	err = database.UsersCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		return err
	}

	// Verificar senha
	if !auth.CheckPasswordHash(password, user.PasswordHash) {
		return ErrInvalidPassword
	}

	// Soft delete: marcar como deletado ao invés de remover
	// Isso preserva integridade referencial
	_, err = database.UsersCollection.UpdateByID(ctx, userObjID, bson.M{
		"$set": bson.M{
			"deletedAt": time.Now(),
			"email":     user.Email + ".deleted." + time.Now().Format("20060102150405"),
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		return err
	}

	// Revogar todos os tokens de refresh
	_, _ = database.RefreshTokensCollection.DeleteMany(ctx, bson.M{"userId": userObjID})

	return nil
}



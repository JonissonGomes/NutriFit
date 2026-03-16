package profile

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrProfileNotFound    = errors.New("perfil não encontrado")
	ErrUsernameExists     = errors.New("nome de usuário já existe")
	ErrInvalidUsername    = errors.New("nome de usuário inválido")
	ErrUnauthorized       = errors.New("sem permissão")
	ErrInvalidData        = errors.New("dados inválidos")
)

// ============================================
// PERFIL PÚBLICO
// ============================================

// GetProfileByUserID retorna o perfil público de um usuário
func GetProfileByUserID(ctx context.Context, userID string) (*models.PublicProfile, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	var profile models.PublicProfile
	err = database.PublicProfilesCollection.FindOne(ctx, bson.M{"userId": userObjID}).Decode(&profile)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	return &profile, nil
}

// GetProfileByUsername retorna o perfil público pelo username
func GetProfileByUsername(ctx context.Context, username string) (*models.PublicProfile, error) {
	username = strings.ToLower(username)

	var profile models.PublicProfile
	err := database.PublicProfilesCollection.FindOne(ctx, bson.M{"username": username}).Decode(&profile)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	return &profile, nil
}

// CreateProfile cria um novo perfil público
func CreateProfile(ctx context.Context, userID, displayName, username string) (*models.PublicProfile, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Validar username
	if !isValidUsername(username) {
		return nil, ErrInvalidUsername
	}

	username = strings.ToLower(username)

	// Verificar se username já existe
	exists, err := usernameExists(ctx, username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUsernameExists
	}

	// Verificar se usuário já tem perfil
	existingProfile, _ := GetProfileByUserID(ctx, userID)
	if existingProfile != nil {
		return nil, errors.New("usuário já possui perfil público")
	}

	profile := &models.PublicProfile{
		ID:          primitive.NewObjectID(),
		UserID:      userObjID,
		Username:    username,
		DisplayName: displayName,
		Ratings: &models.Ratings{
			Average:      0,
			Total:        0,
			Distribution: make(map[string]int),
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = database.PublicProfilesCollection.InsertOne(ctx, profile)
	if err != nil {
		return nil, err
	}

	return profile, nil
}

// UpdateProfile atualiza o perfil público
func UpdateProfile(ctx context.Context, userID string, updates map[string]interface{}) (*models.PublicProfile, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Verificar se usuário tem perfil
	profile, err := GetProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Se está atualizando username, validar
	if newUsername, ok := updates["username"].(string); ok {
		newUsername = strings.ToLower(newUsername)
		if !isValidUsername(newUsername) {
			return nil, ErrInvalidUsername
		}

		// Verificar se é diferente do atual
		if newUsername != profile.Username {
			exists, err := usernameExists(ctx, newUsername)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, ErrUsernameExists
			}
			updates["username"] = newUsername
		}
	}

	updates["updatedAt"] = time.Now()
	update := bson.M{"$set": updates}

	_, err = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	if err != nil {
		return nil, err
	}

	return GetProfileByUserID(ctx, userID)
}

// UpdateProfileAvatar atualiza o avatar do perfil
func UpdateProfileAvatar(ctx context.Context, userID, avatarURL string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	// Verificar se o perfil existe
	_, err = GetProfileByUserID(ctx, userID)
	if err != nil {
		return err
	}

	update := bson.M{
		"$set": bson.M{
			"avatar":    avatarURL,
			"updatedAt": time.Now(),
		},
	}

	result, err := database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	
	if err != nil {
		return err
	}
	
	// Verificar se algum documento foi atualizado
	if result.MatchedCount == 0 {
		return ErrProfileNotFound
	}
	
	return nil
}

// UpdateProfileCover atualiza a imagem de capa do perfil
func UpdateProfileCover(ctx context.Context, userID, coverURL string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	// Verificar se o perfil existe
	_, err = GetProfileByUserID(ctx, userID)
	if err != nil {
		return err
	}

	update := bson.M{
		"$set": bson.M{
			"coverImage": coverURL,
			"updatedAt":  time.Now(),
		},
	}

	result, err := database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	
	if err != nil {
		return err
	}
	
	// Verificar se algum documento foi atualizado
	if result.MatchedCount == 0 {
		return ErrProfileNotFound
	}
	
	return nil
}

// ============================================
// BUSCA DE PERFIS
// ============================================

// ProfileFilters define os filtros de busca de perfis
type ProfileFilters struct {
	Category     string
	City         string
	State        string
	Verified     *bool
	MinRating    float64
	Lat          float64
	Lng          float64
	Radius       float64 // km
	Search       string
	Page         int
	Limit        int
}

// SearchProfiles busca perfis públicos com filtros
func SearchProfiles(ctx context.Context, filters ProfileFilters) ([]*models.PublicProfile, int64, error) {
	filter := bson.M{}

	// Filtro por categoria/especialidade
	if filters.Category != "" {
		filter["$or"] = []bson.M{
			{"specialty": bson.M{"$regex": filters.Category, "$options": "i"}},
			{"specialties": bson.M{"$in": []string{filters.Category}}},
		}
	}

	// Filtro por cidade
	if filters.City != "" {
		filter["location.address.city"] = bson.M{"$regex": filters.City, "$options": "i"}
	}

	// Filtro por estado
	if filters.State != "" {
		filter["location.address.state"] = filters.State
	}

	// Filtro por verificação
	if filters.Verified != nil && *filters.Verified {
		filter["verification.verified"] = true
	}

	// Filtro por rating mínimo
	if filters.MinRating > 0 {
		filter["ratings.average"] = bson.M{"$gte": filters.MinRating}
	}

	// Busca por texto
	if filters.Search != "" {
		filter["$or"] = []bson.M{
			{"displayName": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"username": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"bio": bson.M{"$regex": filters.Search, "$options": "i"}},
		}
	}

	// Contar total
	total, err := database.PublicProfilesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Ordenação: impulsionados primeiro, depois por rating
	sortOrder := bson.D{
		{Key: "boost.active", Value: -1},
		{Key: "boost.priority", Value: -1},
		{Key: "ratings.average", Value: -1},
		{Key: "createdAt", Value: -1},
	}

	skip := int64((filters.Page - 1) * filters.Limit)
	findOptions := options.Find().
		SetSort(sortOrder).
		SetSkip(skip).
		SetLimit(int64(filters.Limit))

	cursor, err := database.PublicProfilesCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var profiles []*models.PublicProfile
	if err = cursor.All(ctx, &profiles); err != nil {
		return nil, 0, err
	}

	return profiles, total, nil
}

// GetNearbyProfiles busca perfis próximos por geolocalização
func GetNearbyProfiles(ctx context.Context, lat, lng, radiusKm float64, limit int) ([]*models.PublicProfile, error) {
	// Converter raio para radianos (Earth radius = 6378.1 km)
	radiusRadians := radiusKm / 6378.1

	filter := bson.M{
		"location.coordinates": bson.M{
			"$geoWithin": bson.M{
				"$centerSphere": []interface{}{
					[]float64{lng, lat},
					radiusRadians,
				},
			},
		},
	}

	sortOrder := bson.D{
		{Key: "boost.active", Value: -1},
		{Key: "boost.priority", Value: -1},
		{Key: "ratings.average", Value: -1},
	}

	findOptions := options.Find().
		SetSort(sortOrder).
		SetLimit(int64(limit))

	cursor, err := database.PublicProfilesCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []*models.PublicProfile
	if err = cursor.All(ctx, &profiles); err != nil {
		return nil, err
	}

	return profiles, nil
}

// ============================================
// HELPERS
// ============================================

// isValidUsername valida o formato do username
func isValidUsername(username string) bool {
	// Username deve ter 3-30 caracteres, apenas letras, números, pontos e underscores
	// Deve começar com letra
	if len(username) < 3 || len(username) > 30 {
		return false
	}

	pattern := regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9._]*$`)
	return pattern.MatchString(username)
}

// usernameExists verifica se o username já existe
func usernameExists(ctx context.Context, username string) (bool, error) {
	count, err := database.PublicProfilesCollection.CountDocuments(ctx, bson.M{"username": username})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CheckUsernameAvailable verifica se username está disponível
func CheckUsernameAvailable(ctx context.Context, username string) (bool, error) {
	if !isValidUsername(username) {
		return false, ErrInvalidUsername
	}

	exists, err := usernameExists(ctx, strings.ToLower(username))
	if err != nil {
		return false, err
	}

	return !exists, nil
}

// IncrementProjectsCount incrementa o contador de projetos
func IncrementProjectsCount(ctx context.Context, userID string, delta int) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	update := bson.M{
		"$inc": bson.M{"projectsCount": delta},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	_, err = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	return err
}

// IncrementProfileViews incrementa o contador de visualizações do perfil
func IncrementProfileViews(ctx context.Context, userID string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	update := bson.M{
		"$inc": bson.M{"viewsCount": 1},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	_, err = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	return err
}

// IncrementReviewsCount incrementa o contador de reviews
func IncrementReviewsCount(ctx context.Context, userID string, delta int) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	update := bson.M{
		"$inc": bson.M{"reviewsCount": delta},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	_, err = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	return err
}

// UpdateRatings atualiza as estatísticas de rating
func UpdateRatings(ctx context.Context, userID string, avgRating float64, totalReviews int, distribution map[string]int) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	update := bson.M{
		"$set": bson.M{
			"ratings": bson.M{
				"average":      avgRating,
				"total":        totalReviews,
				"distribution": distribution,
			},
			"reviewsCount": totalReviews,
			"updatedAt":    time.Now(),
		},
	}

	_, err = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)
	return err
}



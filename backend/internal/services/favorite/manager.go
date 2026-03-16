package favorite

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
	ErrAlreadyFavorited = errors.New("arquiteto já está nos favoritos")
	ErrNotFavorited     = errors.New("arquiteto não está nos favoritos")
	ErrInvalidData      = errors.New("dados inválidos")
	ErrSelfFavorite     = errors.New("não é possível favoritar a si mesmo")
)

// ============================================
// GERENCIAMENTO DE FAVORITOS
// ============================================

// AddFavorite adiciona um arquiteto aos favoritos do cliente
func AddFavorite(ctx context.Context, clientID, architectID string) (*models.Favorite, error) {
	clientObjID, err := primitive.ObjectIDFromHex(clientID)
	if err != nil {
		return nil, ErrInvalidData
	}

	archObjID, err := primitive.ObjectIDFromHex(architectID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Verificar se não está tentando favoritar a si mesmo
	if clientID == architectID {
		return nil, ErrSelfFavorite
	}

	// Verificar se já existe
	exists, err := IsFavorited(ctx, clientID, architectID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrAlreadyFavorited
	}

	favorite := &models.Favorite{
		ID:          primitive.NewObjectID(),
		ClientID:    clientObjID,
		ArchitectID: archObjID,
		CreatedAt:   time.Now(),
	}

	_, err = database.FavoritesCollection.InsertOne(ctx, favorite)
	if err != nil {
		return nil, err
	}

	return favorite, nil
}

// RemoveFavorite remove um arquiteto dos favoritos
func RemoveFavorite(ctx context.Context, clientID, architectID string) error {
	clientObjID, err := primitive.ObjectIDFromHex(clientID)
	if err != nil {
		return ErrInvalidData
	}

	archObjID, err := primitive.ObjectIDFromHex(architectID)
	if err != nil {
		return ErrInvalidData
	}

	result, err := database.FavoritesCollection.DeleteOne(ctx, bson.M{
		"clientId":    clientObjID,
		"architectId": archObjID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrNotFavorited
	}

	return nil
}

// IsFavorited verifica se um arquiteto está nos favoritos
func IsFavorited(ctx context.Context, clientID, architectID string) (bool, error) {
	clientObjID, err := primitive.ObjectIDFromHex(clientID)
	if err != nil {
		return false, ErrInvalidData
	}

	archObjID, err := primitive.ObjectIDFromHex(architectID)
	if err != nil {
		return false, ErrInvalidData
	}

	count, err := database.FavoritesCollection.CountDocuments(ctx, bson.M{
		"clientId":    clientObjID,
		"architectId": archObjID,
	})

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// FavoriteWithProfile representa um favorito com dados do perfil
type FavoriteWithProfile struct {
	ID          primitive.ObjectID      `json:"id"`
	ArchitectID primitive.ObjectID      `json:"architectId"`
	Profile     *models.PublicProfile   `json:"profile,omitempty"`
	CreatedAt   time.Time               `json:"createdAt"`
}

// GetFavorites retorna a lista de favoritos do cliente com perfis
func GetFavorites(ctx context.Context, clientID string, page, limit int) ([]*FavoriteWithProfile, int64, error) {
	clientObjID, err := primitive.ObjectIDFromHex(clientID)
	if err != nil {
		return nil, 0, ErrInvalidData
	}

	filter := bson.M{"clientId": clientObjID}

	// Contar total
	total, err := database.FavoritesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Pipeline de agregação para juntar com perfis
	pipeline := []bson.M{
		{"$match": filter},
		{"$sort": bson.M{"createdAt": -1}},
		{"$skip": (page - 1) * limit},
		{"$limit": limit},
		{"$lookup": bson.M{
			"from":         "public_profiles",
			"localField":   "architectId",
			"foreignField": "userId",
			"as":           "profile",
		}},
		{"$unwind": bson.M{
			"path":                       "$profile",
			"preserveNullAndEmptyArrays": true,
		}},
	}

	cursor, err := database.FavoritesCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var results []*FavoriteWithProfile
	for cursor.Next(ctx) {
		var result struct {
			ID          primitive.ObjectID    `bson:"_id"`
			ClientID    primitive.ObjectID    `bson:"clientId"`
			ArchitectID primitive.ObjectID    `bson:"architectId"`
			CreatedAt   time.Time             `bson:"createdAt"`
			Profile     *models.PublicProfile `bson:"profile"`
		}

		if err := cursor.Decode(&result); err != nil {
			continue
		}

		results = append(results, &FavoriteWithProfile{
			ID:          result.ID,
			ArchitectID: result.ArchitectID,
			Profile:     result.Profile,
			CreatedAt:   result.CreatedAt,
		})
	}

	return results, total, nil
}

// GetFavoriteIDs retorna apenas os IDs dos arquitetos favoritados
func GetFavoriteIDs(ctx context.Context, clientID string) ([]string, error) {
	clientObjID, err := primitive.ObjectIDFromHex(clientID)
	if err != nil {
		return nil, ErrInvalidData
	}

	findOptions := options.Find().SetProjection(bson.M{"architectId": 1})

	cursor, err := database.FavoritesCollection.Find(ctx, bson.M{"clientId": clientObjID}, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var ids []string
	for cursor.Next(ctx) {
		var result struct {
			ArchitectID primitive.ObjectID `bson:"architectId"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		ids = append(ids, result.ArchitectID.Hex())
	}

	return ids, nil
}

// GetFavoritesCount retorna o número de favoritos do cliente
func GetFavoritesCount(ctx context.Context, clientID string) (int64, error) {
	clientObjID, err := primitive.ObjectIDFromHex(clientID)
	if err != nil {
		return 0, ErrInvalidData
	}

	return database.FavoritesCollection.CountDocuments(ctx, bson.M{"clientId": clientObjID})
}

// GetFansCount retorna o número de "fãs" (clientes que favoritaram) de um arquiteto
func GetFansCount(ctx context.Context, architectID string) (int64, error) {
	archObjID, err := primitive.ObjectIDFromHex(architectID)
	if err != nil {
		return 0, ErrInvalidData
	}

	return database.FavoritesCollection.CountDocuments(ctx, bson.M{"architectId": archObjID})
}


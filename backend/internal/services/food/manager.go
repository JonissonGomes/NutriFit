package food

import (
	"context"
	"errors"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrFoodNotFound = errors.New("alimento não encontrado")
)

// SearchFoods busca alimentos na base de dados
func SearchFoods(ctx context.Context, query string, limit int) ([]models.Food, error) {
	filter := bson.M{}

	if query != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": query, "$options": "i"}},
			{"description": bson.M{"$regex": query, "$options": "i"}},
			{"category": bson.M{"$regex": query, "$options": "i"}},
		}
	}

	limitInt64 := int64(limit)
	if limitInt64 > 50 {
		limitInt64 = 50
	}

	cursor, err := database.FoodsCollection.Find(ctx, filter, &options.FindOptions{
		Limit: &limitInt64,
		Sort:  bson.M{"name": 1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var foods []models.Food
	if err = cursor.All(ctx, &foods); err != nil {
		return nil, err
	}

	return foods, nil
}

// GetFood busca um alimento por ID
func GetFood(ctx context.Context, foodID string) (*models.Food, error) {
	var food models.Food
	err := database.FoodsCollection.FindOne(ctx, bson.M{"_id": foodID}).Decode(&food)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrFoodNotFound
		}
		return nil, err
	}

	return &food, nil
}

// CreateFood cria um novo alimento na base
func CreateFood(ctx context.Context, food models.Food) (*models.Food, error) {
	if food.ID == "" {
		food.ID = primitive.NewObjectID().Hex()
	}

	_, err := database.FoodsCollection.InsertOne(ctx, food)
	if err != nil {
		return nil, err
	}

	return &food, nil
}

// GetSubstitutions busca alimentos substitutos nutricionalmente equivalentes
func GetSubstitutions(ctx context.Context, foodID string, mealPlanID string) ([]models.Food, error) {
	// Buscar o alimento original
	food, err := GetFood(ctx, foodID)
	if err != nil {
		return nil, err
	}

	// Buscar alimentos com macros similares (dentro de 10% de diferença)
	tolerance := 0.1
	filter := bson.M{
		"_id": bson.M{"$ne": foodID},
		"macros.calories": bson.M{
			"$gte": food.Macros.Calories * (1 - tolerance),
			"$lte": food.Macros.Calories * (1 + tolerance),
		},
	}

	limitInt64 := int64(3)
	cursor, err := database.FoodsCollection.Find(ctx, filter, &options.FindOptions{
		Limit: &limitInt64,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var substitutions []models.Food
	if err = cursor.All(ctx, &substitutions); err != nil {
		return nil, err
	}

	return substitutions, nil
}

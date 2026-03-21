package predefined_meal

import (
	"context"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func List(ctx context.Context, query, group string, limit int64) ([]models.PredefinedMeal, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	filter := bson.M{}
	if query != "" {
		filter["name"] = bson.M{"$regex": query, "$options": "i"}
	}
	if group != "" {
		filter["mealGroups"] = group
	}
	cursor, err := database.PredefinedMealsCollection.Find(ctx, filter, options.Find().SetSort(bson.M{"name": 1}).SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var out []models.PredefinedMeal
	if err := cursor.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func UpsertMany(ctx context.Context, meals []models.PredefinedMeal) (int64, error) {
	now := time.Now()
	var upserts int64
	for _, m := range meals {
		m.UpdatedAt = now
		if m.CreatedAt.IsZero() {
			m.CreatedAt = now
		}
		filter := bson.M{"name": m.Name}
		update := bson.M{
			"$set": bson.M{
				"calories":   m.Calories,
				"mealGroups": m.MealGroups,
				"filters":    m.Filters,
				"updatedAt":  m.UpdatedAt,
			},
			"$setOnInsert": bson.M{
				"createdAt": m.CreatedAt,
			},
		}
		res, err := database.PredefinedMealsCollection.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
		if err != nil {
			return upserts, err
		}
		upserts += res.UpsertedCount
	}
	return upserts, nil
}

package meal_plan_template

import (
	"context"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func List(ctx context.Context, nutritionistID string) ([]models.MealPlanTemplate, error) {
	oid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	filter := bson.M{"$or": []bson.M{
		{"nutritionistId": oid},
		{"isGlobal": true},
	}}
	cursor, err := database.MealPlanTemplatesCollection.Find(ctx, filter, options.Find().SetSort(bson.M{"updatedAt": -1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var items []models.MealPlanTemplate
	return items, cursor.All(ctx, &items)
}

func Create(ctx context.Context, nutritionistID string, tpl models.MealPlanTemplate) (*models.MealPlanTemplate, error) {
	oid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	tpl.NutritionistID = oid
	tpl.CreatedAt = time.Now()
	tpl.UpdatedAt = time.Now()
	res, err := database.MealPlanTemplatesCollection.InsertOne(ctx, tpl)
	if err != nil {
		return nil, err
	}
	tpl.ID = res.InsertedID.(primitive.ObjectID)
	return &tpl, nil
}

func GetByID(ctx context.Context, id string) (*models.MealPlanTemplate, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var tpl models.MealPlanTemplate
	if err := database.MealPlanTemplatesCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&tpl); err != nil {
		return nil, err
	}
	return &tpl, nil
}

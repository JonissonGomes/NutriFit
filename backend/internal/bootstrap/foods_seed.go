package bootstrap

import (
	"context"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
)

func SeedFoods(ctx context.Context) error {
	count, err := database.FoodsCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	now := time.Now()
	items := []models.Food{
		{ID: "taco-arroz-branco", Name: "Arroz, branco, cozido", Category: "Cereais", Source: "TACO", Macros: &models.MacroNutrients{Calories: 128, Proteins: 2.5, Carbohydrates: 28.1, Fats: 0.2}, IsVerified: true, CreatedAt: now, UpdatedAt: now},
		{ID: "taco-feijao-carioca", Name: "Feijão, carioca, cozido", Category: "Leguminosas", Source: "TACO", Macros: &models.MacroNutrients{Calories: 76, Proteins: 4.8, Carbohydrates: 13.6, Fats: 0.5}, IsVerified: true, CreatedAt: now, UpdatedAt: now},
		{ID: "taco-frango-peito", Name: "Frango, peito, sem pele, grelhado", Category: "Carnes", Source: "TACO", Macros: &models.MacroNutrients{Calories: 159, Proteins: 32, Carbohydrates: 0, Fats: 2.5}, IsVerified: true, CreatedAt: now, UpdatedAt: now},
		{ID: "taco-ovo-cozido", Name: "Ovo, de galinha, cozido", Category: "Ovos", Source: "TACO", Macros: &models.MacroNutrients{Calories: 146, Proteins: 13.3, Carbohydrates: 0.6, Fats: 9.5}, IsVerified: true, CreatedAt: now, UpdatedAt: now},
		{ID: "usda-banana", Name: "Banana, raw", Category: "Fruits", Source: "USDA", Macros: &models.MacroNutrients{Calories: 89, Proteins: 1.1, Carbohydrates: 22.8, Fats: 0.3}, IsVerified: true, CreatedAt: now, UpdatedAt: now},
		{ID: "usda-salmon", Name: "Salmon, Atlantic, farmed, cooked", Category: "Fish", Source: "USDA", Macros: &models.MacroNutrients{Calories: 206, Proteins: 22.1, Carbohydrates: 0, Fats: 12.4}, IsVerified: true, CreatedAt: now, UpdatedAt: now},
	}
	docs := make([]interface{}, len(items))
	for i := range items {
		docs[i] = items[i]
	}
	_, err = database.FoodsCollection.InsertMany(ctx, docs)
	return err
}

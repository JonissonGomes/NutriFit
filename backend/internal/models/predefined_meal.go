package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PredefinedMeal struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name       string             `bson:"name" json:"name"`
	Calories   float64            `bson:"calories,omitempty" json:"calories,omitempty"`
	MealGroups []string           `bson:"mealGroups,omitempty" json:"mealGroups,omitempty"`
	Filters    []string           `bson:"filters,omitempty" json:"filters,omitempty"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updatedAt" json:"updatedAt"`
}

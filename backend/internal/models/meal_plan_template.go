package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MealPlanTemplate struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NutritionistID primitive.ObjectID `bson:"nutritionistId,omitempty" json:"nutritionistId,omitempty"`
	Title          string             `bson:"title" json:"title"`
	Description    string             `bson:"description,omitempty" json:"description,omitempty"`
	Category       string             `bson:"category,omitempty" json:"category,omitempty"`
	Meals          []Meal             `bson:"meals,omitempty" json:"meals,omitempty"`
	IsGlobal       bool               `bson:"isGlobal" json:"isGlobal"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

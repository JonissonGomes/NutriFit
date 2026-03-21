package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Recipe struct {
	ID             primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	NutritionistID primitive.ObjectID   `bson:"nutritionistId" json:"nutritionistId"`
	Title          string               `bson:"title" json:"title"`
	Description    string               `bson:"description,omitempty" json:"description,omitempty"`
	Ingredients    []string             `bson:"ingredients,omitempty" json:"ingredients,omitempty"`
	Steps          []string             `bson:"steps,omitempty" json:"steps,omitempty"`
	MealGroups     []string             `bson:"mealGroups,omitempty" json:"mealGroups,omitempty"`
	Filters        []string             `bson:"filters,omitempty" json:"filters,omitempty"`
	Calories       float64              `bson:"calories,omitempty" json:"calories,omitempty"`
	ImageURLs      []string             `bson:"imageUrls,omitempty" json:"imageUrls,omitempty"`
	IsPublic       bool                 `bson:"isPublic" json:"isPublic"`
	PatientIDs     []primitive.ObjectID `bson:"patientIds,omitempty" json:"patientIds,omitempty"`
	MealPlanIDs    []primitive.ObjectID `bson:"mealPlanIds,omitempty" json:"mealPlanIds,omitempty"`
	CreatedAt      time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time            `bson:"updatedAt" json:"updatedAt"`
}

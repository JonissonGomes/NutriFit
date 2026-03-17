package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MealPhotoStatus string

const (
	MealPhotoStatusProcessing MealPhotoStatus = "processing"
	MealPhotoStatusReady      MealPhotoStatus = "ready"
	MealPhotoStatusFailed     MealPhotoStatus = "failed"
)

type AIAnalysisClassification string

const (
	AIClassificationAligned      AIAnalysisClassification = "aligned"
	AIClassificationAttention    AIAnalysisClassification = "attention"
	AIClassificationOffPlan      AIAnalysisClassification = "off-plan"
)

type AIAnalysis struct {
	Classification AIAnalysisClassification `bson:"classification" json:"classification"`
	Foods          []string                 `bson:"foods" json:"foods"` // alimentos identificados
	EstimatedMacros *MacroNutrients         `bson:"estimatedMacros,omitempty" json:"estimatedMacros,omitempty"`
	Calories       float64                  `bson:"calories" json:"calories"`
	Confidence     float64                  `bson:"confidence" json:"confidence"` // 0-1
	Notes          string                   `bson:"notes,omitempty" json:"notes,omitempty"`
	AnalyzedAt     time.Time                `bson:"analyzedAt" json:"analyzedAt"`
}

type FoodDiaryEntry struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PatientID   primitive.ObjectID `bson:"patientId" json:"patientId"`
	MealPlanID  *primitive.ObjectID `bson:"mealPlanId,omitempty" json:"mealPlanId,omitempty"`
	Date        time.Time          `bson:"date" json:"date"`
	MealType    MealType           `bson:"mealType" json:"mealType"`
	PhotoURL    string             `bson:"photoUrl,omitempty" json:"photoUrl,omitempty"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	AudioURL    string             `bson:"audioUrl,omitempty" json:"audioUrl,omitempty"`
	AIAnalysis  *AIAnalysis        `bson:"aiAnalysis,omitempty" json:"aiAnalysis,omitempty"`
	NutritionistComment string     `bson:"nutritionistComment,omitempty" json:"nutritionistComment,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

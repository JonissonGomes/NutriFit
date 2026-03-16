package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MealPlanStatus string

const (
	MealPlanStatusDraft    MealPlanStatus = "draft"
	MealPlanStatusActive   MealPlanStatus = "active"
	MealPlanStatusPaused   MealPlanStatus = "paused"
	MealPlanStatusCompleted MealPlanStatus = "completed"
)

type MealPlanCategory string

const (
	CategoryEmagrecimento MealPlanCategory = "emagrecimento"
	CategoryGanhoMassa    MealPlanCategory = "ganho-massa"
	CategoryPerformance   MealPlanCategory = "performance"
	CategorySaude         MealPlanCategory = "saude"
	CategoryGestante      MealPlanCategory = "gestante"
	CategoryInfantil      MealPlanCategory = "infantil"
	CategoryVegetariano   MealPlanCategory = "vegetariano"
	CategoryVegano        MealPlanCategory = "vegano"
	CategoryIntolerancias MealPlanCategory = "intolerancias"
)

type MealType string

const (
	MealTypeCafeManha    MealType = "cafe-manha"
	MealTypeLancheManha  MealType = "lanche-manha"
	MealTypeAlmoco       MealType = "almoco"
	MealTypeLancheTarde  MealType = "lanche-tarde"
	MealTypeJantar        MealType = "jantar"
	MealTypeCeia         MealType = "ceia"
)

type MacroNutrients struct {
	Calories      float64 `bson:"calories" json:"calories"`
	Proteins      float64 `bson:"proteins" json:"proteins"` // gramas
	Carbohydrates float64 `bson:"carbohydrates" json:"carbohydrates"` // gramas
	Fats          float64 `bson:"fats" json:"fats"` // gramas
	Fiber         float64 `bson:"fiber,omitempty" json:"fiber,omitempty"` // gramas
}

type FoodItem struct {
	FoodID     string  `bson:"foodId" json:"foodId"` // ID do alimento na base de dados
	Name       string  `bson:"name" json:"name"`
	Quantity   float64 `bson:"quantity" json:"quantity"` // quantidade em gramas ou unidade
	Unit       string  `bson:"unit" json:"unit"` // "g", "ml", "un", etc
	Macros     *MacroNutrients `bson:"macros,omitempty" json:"macros,omitempty"`
	Substitutes []string `bson:"substitutes,omitempty" json:"substitutes,omitempty"` // IDs de alimentos substitutos
}

type Meal struct {
	Type      MealType    `bson:"type" json:"type"`
	Time      string      `bson:"time" json:"time"` // HH:MM
	Foods     []FoodItem  `bson:"foods" json:"foods"`
	Macros    *MacroNutrients `bson:"macros,omitempty" json:"macros,omitempty"`
	Notes     string      `bson:"notes,omitempty" json:"notes,omitempty"`
}

type MealPlan struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NutritionistID primitive.ObjectID `bson:"nutritionistId" json:"nutritionistId"`
	PatientID     *primitive.ObjectID `bson:"patientId,omitempty" json:"patientId,omitempty"`
	Title         string             `bson:"title" json:"title"`
	Description   string             `bson:"description,omitempty" json:"description,omitempty"`
	Category      MealPlanCategory   `bson:"category" json:"category"`
	Status        MealPlanStatus     `bson:"status" json:"status"`
	StartDate     *time.Time         `bson:"startDate,omitempty" json:"startDate,omitempty"`
	EndDate       *time.Time         `bson:"endDate,omitempty" json:"endDate,omitempty"`
	Meals         []Meal             `bson:"meals" json:"meals"`
	TotalMacros   *MacroNutrients    `bson:"totalMacros,omitempty" json:"totalMacros,omitempty"`
	Restrictions  []string           `bson:"restrictions,omitempty" json:"restrictions,omitempty"` // alergias, intolerâncias, etc
	Notes         string             `bson:"notes,omitempty" json:"notes,omitempty"`
	IsTemplate    bool               `bson:"isTemplate" json:"isTemplate"` // se é um modelo reutilizável
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

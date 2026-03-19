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

type ClinicalPatientSnapshot struct {
	Name   string `bson:"name,omitempty" json:"name,omitempty"`
	Email  string `bson:"email,omitempty" json:"email,omitempty"`
	Phone  string `bson:"phone,omitempty" json:"phone,omitempty"`
	Age    int    `bson:"age,omitempty" json:"age,omitempty"`
	Sex    string `bson:"sex,omitempty" json:"sex,omitempty"`
	Height float64 `bson:"height,omitempty" json:"height,omitempty"` // cm
	Weight float64 `bson:"weight,omitempty" json:"weight,omitempty"` // kg
}

type ClinicalEnergySnapshot struct {
	Objective      string  `bson:"objective,omitempty" json:"objective,omitempty"`
	ActivityLevel  string  `bson:"activityLevel,omitempty" json:"activityLevel,omitempty"`
	ActivityFactor float64 `bson:"activityFactor,omitempty" json:"activityFactor,omitempty"`
	TMB            float64 `bson:"tmb,omitempty" json:"tmb,omitempty"`
	GET            float64 `bson:"get,omitempty" json:"get,omitempty"`
}

type ClinicalStrategySnapshot struct {
	Calories      float64 `bson:"calories,omitempty" json:"calories,omitempty"`
	Proteins      float64 `bson:"proteins,omitempty" json:"proteins,omitempty"`
	Carbohydrates float64 `bson:"carbohydrates,omitempty" json:"carbohydrates,omitempty"`
	Fats          float64 `bson:"fats,omitempty" json:"fats,omitempty"`
	MealsPerDay   int     `bson:"mealsPerDay,omitempty" json:"mealsPerDay,omitempty"`
}

type ClinicalSnapshot struct {
	Patient          *ClinicalPatientSnapshot  `bson:"patient,omitempty" json:"patient,omitempty"`
	Energy           *ClinicalEnergySnapshot   `bson:"energy,omitempty" json:"energy,omitempty"`
	Strategy         *ClinicalStrategySnapshot `bson:"strategy,omitempty" json:"strategy,omitempty"`
	Restrictions     []string                  `bson:"restrictions,omitempty" json:"restrictions,omitempty"`
	Preferences      []string                  `bson:"preferences,omitempty" json:"preferences,omitempty"`
	AnamnesisSummary string                    `bson:"anamnesisSummary,omitempty" json:"anamnesisSummary,omitempty"`
	LabExamSummary   string                    `bson:"labExamSummary,omitempty" json:"labExamSummary,omitempty"`
	BMI              float64                   `bson:"bmi,omitempty" json:"bmi,omitempty"`
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
	ClinicalSnapshot *ClinicalSnapshot `bson:"clinicalSnapshot,omitempty" json:"clinicalSnapshot,omitempty"`
	Notes         string             `bson:"notes,omitempty" json:"notes,omitempty"`
	IsTemplate    bool               `bson:"isTemplate" json:"isTemplate"` // se é um modelo reutilizável
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

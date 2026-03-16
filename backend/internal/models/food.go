package models

import (
	"time"
)

// Food representa um alimento na base de dados nutricional
type Food struct {
	ID          string         `bson:"_id" json:"id"` // código TBCA/TACO ou ID interno
	Name        string         `bson:"name" json:"name"`
	Category    string         `bson:"category,omitempty" json:"category,omitempty"`
	Description string         `bson:"description,omitempty" json:"description,omitempty"`
	Macros      *MacroNutrients `bson:"macros" json:"macros"` // por 100g
	Micros      *Micronutrients  `bson:"micros,omitempty" json:"micros,omitempty"` // por 100g
	Source      string         `bson:"source,omitempty" json:"source,omitempty"` // "TBCA", "TACO", "custom"
	IsVerified  bool           `bson:"isVerified" json:"isVerified"`
	CreatedAt   time.Time      `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time      `bson:"updatedAt" json:"updatedAt"`
}

type Micronutrients struct {
	VitaminA    float64 `bson:"vitaminA,omitempty" json:"vitaminA,omitempty"` // mcg
	VitaminC    float64 `bson:"vitaminC,omitempty" json:"vitaminC,omitempty"` // mg
	VitaminD    float64 `bson:"vitaminD,omitempty" json:"vitaminD,omitempty"` // mcg
	VitaminE    float64 `bson:"vitaminE,omitempty" json:"vitaminE,omitempty"` // mg
	VitaminK    float64 `bson:"vitaminK,omitempty" json:"vitaminK,omitempty"` // mcg
	Thiamin     float64 `bson:"thiamin,omitempty" json:"thiamin,omitempty"` // mg (B1)
	Riboflavin  float64 `bson:"riboflavin,omitempty" json:"riboflavin,omitempty"` // mg (B2)
	Niacin      float64 `bson:"niacin,omitempty" json:"niacin,omitempty"` // mg (B3)
	VitaminB6   float64 `bson:"vitaminB6,omitempty" json:"vitaminB6,omitempty"` // mg
	Folate      float64 `bson:"folate,omitempty" json:"folate,omitempty"` // mcg (B9)
	VitaminB12  float64 `bson:"vitaminB12,omitempty" json:"vitaminB12,omitempty"` // mcg
	Calcium     float64 `bson:"calcium,omitempty" json:"calcium,omitempty"` // mg
	Iron        float64 `bson:"iron,omitempty" json:"iron,omitempty"` // mg
	Magnesium   float64 `bson:"magnesium,omitempty" json:"magnesium,omitempty"` // mg
	Phosphorus  float64 `bson:"phosphorus,omitempty" json:"phosphorus,omitempty"` // mg
	Potassium   float64 `bson:"potassium,omitempty" json:"potassium,omitempty"` // mg
	Sodium      float64 `bson:"sodium,omitempty" json:"sodium,omitempty"` // mg
	Zinc        float64 `bson:"zinc,omitempty" json:"zinc,omitempty"` // mg
}

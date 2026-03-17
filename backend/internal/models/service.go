package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ServiceCategory string

const (
	ServiceCategoryEmagrecimento    ServiceCategory = "emagrecimento"
	ServiceCategoryGanhoMassa       ServiceCategory = "ganho-massa"
	ServiceCategoryPerformance      ServiceCategory = "performance"
	ServiceCategorySaude           ServiceCategory = "saude"
	ServiceCategoryGestante        ServiceCategory = "gestante"
	ServiceCategoryInfantil        ServiceCategory = "infantil"
	ServiceCategoryVegetariano     ServiceCategory = "vegetariano"
	ServiceCategoryVegano          ServiceCategory = "vegano"
	ServiceCategoryIntolerancias   ServiceCategory = "intolerancias"
	ServiceCategoryConsultoria      ServiceCategory = "consultoria"
)

type ServiceAvailability struct {
	ThisWeek  bool `bson:"thisWeek" json:"thisWeek"`
	NextWeek  bool `bson:"nextWeek" json:"nextWeek"`
	ThisMonth bool `bson:"thisMonth" json:"thisMonth"`
	Slots     []TimeSlot `bson:"slots,omitempty" json:"slots,omitempty"`
}

type TimeSlot struct {
	Date  string   `bson:"date" json:"date"` // YYYY-MM-DD
	Times []string `bson:"times" json:"times"` // ["09:00", "10:00"]
}

type ServicePricing struct {
	Min     float64 `bson:"min" json:"min"`
	Max     float64 `bson:"max" json:"max"`
	Average float64 `bson:"average" json:"average"`
}

type Service struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID  `bson:"userId" json:"userId"`
	Name        string              `bson:"name" json:"name"`
	Description string              `bson:"description" json:"description"`
	Price       float64             `bson:"price" json:"price"`
	Duration    string              `bson:"duration" json:"duration"`
	Category    ServiceCategory     `bson:"category" json:"category"`
	Active      bool                `bson:"active" json:"active"`
	Features    []string            `bson:"features,omitempty" json:"features,omitempty"`
	Availability *ServiceAvailability `bson:"availability,omitempty" json:"availability,omitempty"`
	Pricing     *ServicePricing     `bson:"pricing,omitempty" json:"pricing,omitempty"`
	CreatedAt   time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time           `bson:"updatedAt" json:"updatedAt"`
}




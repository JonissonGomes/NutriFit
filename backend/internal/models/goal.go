package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GoalType string

const (
	GoalTypeWeight        GoalType = "weight"
	GoalTypeBodyFat       GoalType = "body-fat"
	GoalTypeMuscleMass    GoalType = "muscle-mass"
	GoalTypeWaterIntake   GoalType = "water-intake"
	GoalTypeExercise      GoalType = "exercise"
	GoalTypeHabit         GoalType = "habit"
	GoalTypeCustom        GoalType = "custom"
)

type GoalStatus string

const (
	GoalStatusActive    GoalStatus = "active"
	GoalStatusCompleted GoalStatus = "completed"
	GoalStatusPaused    GoalStatus = "paused"
	GoalStatusCancelled GoalStatus = "cancelled"
)

type Goal struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PatientID   primitive.ObjectID `bson:"patientId" json:"patientId"`
	Type        GoalType           `bson:"type" json:"type"`
	Description string             `bson:"description" json:"description"`
	TargetValue float64            `bson:"targetValue" json:"targetValue"`
	CurrentValue float64            `bson:"currentValue" json:"currentValue"`
	Unit        string             `bson:"unit" json:"unit"` // "kg", "g", "ml", "%", etc
	Deadline    *time.Time         `bson:"deadline,omitempty" json:"deadline,omitempty"`
	Status      GoalStatus         `bson:"status" json:"status"`
	IsHabit     bool               `bson:"isHabit" json:"isHabit"` // se é um hábito (checklist)
	CheckIns    []GoalCheckIn      `bson:"checkIns,omitempty" json:"checkIns,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type GoalCheckIn struct {
	Date        time.Time `bson:"date" json:"date"`
	Value       float64   `bson:"value,omitempty" json:"value,omitempty"`
	Completed   bool      `bson:"completed" json:"completed"` // para hábitos
	Notes       string    `bson:"notes,omitempty" json:"notes,omitempty"`
}

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Circumferences struct {
	Neck       float64 `bson:"neck,omitempty" json:"neck,omitempty"` // cm
	Chest      float64 `bson:"chest,omitempty" json:"chest,omitempty"` // cm
	Waist      float64 `bson:"waist,omitempty" json:"waist,omitempty"` // cm
	Hip        float64 `bson:"hip,omitempty" json:"hip,omitempty"` // cm
	Thigh      float64 `bson:"thigh,omitempty" json:"thigh,omitempty"` // cm
	Arm        float64 `bson:"arm,omitempty" json:"arm,omitempty"` // cm
}

type Body3DReport struct {
	BodyFatPercent    float64        `bson:"bodyFatPercent" json:"bodyFatPercent"`
	MuscleMass        float64        `bson:"muscleMass" json:"muscleMass"` // kg
	FatMass           float64        `bson:"fatMass" json:"fatMass"` // kg
	Circumferences    *Circumferences `bson:"circumferences,omitempty" json:"circumferences,omitempty"`
	MetabolicRisk     string         `bson:"metabolicRisk" json:"metabolicRisk"` // "baixo", "medio", "alto"
	BMI               float64        `bson:"bmi" json:"bmi"`
	Confidence        float64        `bson:"confidence" json:"confidence"` // 0-1
	GeneratedAt       time.Time      `bson:"generatedAt" json:"generatedAt"`
}

type Anthropometric struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PatientID     primitive.ObjectID `bson:"patientId" json:"patientId"`
	Date          time.Time          `bson:"date" json:"date"`
	Weight        float64            `bson:"weight" json:"weight"` // kg
	Height        float64            `bson:"height" json:"height"` // cm
	BodyFat       float64            `bson:"bodyFat,omitempty" json:"bodyFat,omitempty"` // percentual
	MuscleMass    float64            `bson:"muscleMass,omitempty" json:"muscleMass,omitempty"` // kg
	BMI           float64            `bson:"bmi,omitempty" json:"bmi,omitempty"`
	Circumferences *Circumferences   `bson:"circumferences,omitempty" json:"circumferences,omitempty"`
	Photos        []string            `bson:"photos,omitempty" json:"photos,omitempty"` // URLs das fotos para Body3D
	Body3DReport   *Body3DReport       `bson:"body3dReport,omitempty" json:"body3dReport,omitempty"`
	Notes         string              `bson:"notes,omitempty" json:"notes,omitempty"`
	CreatedAt     time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time           `bson:"updatedAt" json:"updatedAt"`
}

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LabExamType string

const (
	LabExamTypeBlood      LabExamType = "blood"
	LabExamTypeUrine      LabExamType = "urine"
	LabExamTypeStool      LabExamType = "stool"
	LabExamTypeHormonal   LabExamType = "hormonal"
	LabExamTypeVitamin    LabExamType = "vitamin"
	LabExamTypeOther      LabExamType = "other"
)

type LabExamResult struct {
	Parameter string  `bson:"parameter" json:"parameter"`
	Value     string  `bson:"value" json:"value"`
	Unit      string  `bson:"unit,omitempty" json:"unit,omitempty"`
	Reference string  `bson:"reference,omitempty" json:"reference,omitempty"`
	Status    string  `bson:"status,omitempty" json:"status,omitempty"` // "normal", "alto", "baixo"
}

type LabExamAIAnalysis struct {
	Summary      string   `bson:"summary" json:"summary"`
	Findings     []string `bson:"findings" json:"findings"`
	Recommendations []string `bson:"recommendations" json:"recommendations"`
	Concerns     []string `bson:"concerns,omitempty" json:"concerns,omitempty"`
	AnalyzedAt   time.Time `bson:"analyzedAt" json:"analyzedAt"`
}

type LabExam struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PatientID   primitive.ObjectID `bson:"patientId" json:"patientId"`
	Date        time.Time          `bson:"date" json:"date"`
	Type        LabExamType        `bson:"type" json:"type"`
	FileURL     string             `bson:"fileUrl" json:"fileUrl"` // PDF ou imagem do exame
	Results     []LabExamResult    `bson:"results,omitempty" json:"results,omitempty"` // resultados estruturados (se disponível)
	RawText     string             `bson:"rawText,omitempty" json:"rawText,omitempty"` // texto extraído do exame
	AIAnalysis  *LabExamAIAnalysis `bson:"aiAnalysis,omitempty" json:"aiAnalysis,omitempty"`
	Notes       string             `bson:"notes,omitempty" json:"notes,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AnamnesisStatus string

const (
	AnamnesisStatusDraft     AnamnesisStatus = "draft"
	AnamnesisStatusSent      AnamnesisStatus = "sent"
	AnamnesisStatusCompleted AnamnesisStatus = "completed"
	AnamnesisStatusExpired   AnamnesisStatus = "expired"
)

type QuestionType string

const (
	QuestionTypeText       QuestionType = "text"
	QuestionTypeTextarea   QuestionType = "textarea"
	QuestionTypeNumber     QuestionType = "number"
	QuestionTypeSelect     QuestionType = "select"
	QuestionTypeMultiSelect QuestionType = "multi-select"
	QuestionTypeRadio      QuestionType = "radio"
	QuestionTypeCheckbox   QuestionType = "checkbox"
	QuestionTypeDate       QuestionType = "date"
	QuestionTypeBoolean    QuestionType = "boolean"
)

// FormQuestion representa um item de pergunta em um template de anamnese (evita conflito com models.Question do fórum).
type FormQuestion struct {
	ID          string      `bson:"id" json:"id"`
	Type        QuestionType `bson:"type" json:"type"`
	Label       string      `bson:"label" json:"label"`
	Placeholder string      `bson:"placeholder,omitempty" json:"placeholder,omitempty"`
	Required    bool        `bson:"required" json:"required"`
	Options     []string    `bson:"options,omitempty" json:"options,omitempty"` // para select, radio, checkbox
	Default     interface{} `bson:"default,omitempty" json:"default,omitempty"`
	Validation  string      `bson:"validation,omitempty" json:"validation,omitempty"`
	Order       int         `bson:"order" json:"order"`
}

type FormTemplate struct {
	ID          string         `bson:"id" json:"id"`
	Name        string         `bson:"name" json:"name"`
	Description string         `bson:"description,omitempty" json:"description,omitempty"`
	Category    string         `bson:"category,omitempty" json:"category,omitempty"`
	Questions   []FormQuestion `bson:"questions" json:"questions"`
	IsDefault   bool       `bson:"isDefault" json:"isDefault"`
	CreatedAt   time.Time  `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time  `bson:"updatedAt" json:"updatedAt"`
}

type AnamnesisAnswer struct {
	QuestionID string      `bson:"questionId" json:"questionId"`
	Value      interface{} `bson:"value" json:"value"`
}

type Anamnesis struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NutritionistID primitive.ObjectID `bson:"nutritionistId" json:"nutritionistId"`
	PatientID    primitive.ObjectID `bson:"patientId" json:"patientId"`
	TemplateID   string             `bson:"templateId,omitempty" json:"templateId,omitempty"`
	FormTemplate *FormTemplate      `bson:"formTemplate,omitempty" json:"formTemplate,omitempty"`
	Answers      []AnamnesisAnswer  `bson:"answers" json:"answers"`
	Status       AnamnesisStatus    `bson:"status" json:"status"`
	AISummary    string             `bson:"aiSummary,omitempty" json:"aiSummary,omitempty"` // resumo gerado por IA
	SentAt       *time.Time         `bson:"sentAt,omitempty" json:"sentAt,omitempty"`
	CompletedAt  *time.Time         `bson:"completedAt,omitempty" json:"completedAt,omitempty"`
	ExpiresAt    *time.Time         `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

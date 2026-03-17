package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuestionnaireType string

const (
	QuestionnaireTypeMetabolicScreening QuestionnaireType = "metabolic-screening"
	QuestionnaireTypeEatingPattern      QuestionnaireType = "eating-pattern"
	QuestionnaireTypeSleep              QuestionnaireType = "sleep"
	QuestionnaireTypePhysicalActivity   QuestionnaireType = "physical-activity"
	QuestionnaireTypeCustom             QuestionnaireType = "custom"
)

type QuestionnaireStatus string

const (
	QuestionnaireStatusDraft     QuestionnaireStatus = "draft"
	QuestionnaireStatusSent      QuestionnaireStatus = "sent"
	QuestionnaireStatusCompleted QuestionnaireStatus = "completed"
	QuestionnaireStatusExpired   QuestionnaireStatus = "expired"
)

type Questionnaire struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NutritionistID primitive.ObjectID `bson:"nutritionistId" json:"nutritionistId"`
	PatientID     primitive.ObjectID `bson:"patientId" json:"patientId"`
	Type          QuestionnaireType  `bson:"type" json:"type"`
	Title         string             `bson:"title" json:"title"`
	Description   string             `bson:"description,omitempty" json:"description,omitempty"`
	Questions      []FormQuestion     `bson:"questions" json:"questions"` // item de formulário (models.FormQuestion)
	Answers        []AnamnesisAnswer  `bson:"answers,omitempty" json:"answers,omitempty"` // reutiliza AnamnesisAnswer
	Status        QuestionnaireStatus `bson:"status" json:"status"`
	SentAt        *time.Time          `bson:"sentAt,omitempty" json:"sentAt,omitempty"`
	CompletedAt   *time.Time          `bson:"completedAt,omitempty" json:"completedAt,omitempty"`
	ExpiresAt     *time.Time          `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
	CreatedAt     time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time           `bson:"updatedAt" json:"updatedAt"`
}

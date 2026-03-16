package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Nota: Este arquivo faz parte do pacote models do backend ArckDesign

// QuestionCategory representa a categoria de uma pergunta
type QuestionCategory string

const (
	QuestionCategoryMateriais   QuestionCategory = "materiais"
	QuestionCategoryProjeto     QuestionCategory = "projeto"
	QuestionCategoryReforma     QuestionCategory = "reforma"
	QuestionCategoryInteriores  QuestionCategory = "interiores"
	QuestionCategoryOrcamento   QuestionCategory = "orcamento"
	QuestionCategoryLegislacao  QuestionCategory = "legislacao"
	QuestionCategoryOutro       QuestionCategory = "outro"
)

// QuestionStatus representa o status de uma pergunta
type QuestionStatus string

const (
	QuestionStatusOpen     QuestionStatus = "open"
	QuestionStatusAnswered QuestionStatus = "answered"
	QuestionStatusClosed   QuestionStatus = "closed"
)

// Answer representa uma resposta a uma pergunta
type Answer struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ArchitectID  primitive.ObjectID `bson:"architectId" json:"architectId"`
	ArchitectName string            `bson:"architectName" json:"architectName"`
	ArchitectAvatar string          `bson:"architectAvatar,omitempty" json:"architectAvatar,omitempty"`
	Content      string             `bson:"content" json:"content"`
	Helpful      int                `bson:"helpful" json:"helpful"`
	HelpfulBy    []primitive.ObjectID `bson:"helpfulBy,omitempty" json:"helpfulBy,omitempty"`
	IsBestAnswer bool               `bson:"isBestAnswer" json:"isBestAnswer"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Question representa uma pergunta ao especialista
type Question struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ClientID    primitive.ObjectID `bson:"clientId" json:"clientId"`
	ClientName  string             `bson:"clientName" json:"clientName"`
	ArchitectID *primitive.ObjectID `bson:"architectId,omitempty" json:"architectId,omitempty"` // opcional, se direcionada
	Title       string             `bson:"title" json:"title"`
	Content     string             `bson:"content" json:"content"`
	Category    QuestionCategory   `bson:"category" json:"category"`
	Tags        []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	Answers     []Answer           `bson:"answers,omitempty" json:"answers,omitempty"`
	AnswerCount int                `bson:"answerCount" json:"answerCount"`
	Status      QuestionStatus     `bson:"status" json:"status"`
	Views       int                `bson:"views" json:"views"`
	Featured    bool               `bson:"featured" json:"featured"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// CreateQuestionRequest representa a requisição para criar uma pergunta
type CreateQuestionRequest struct {
	Title       string           `json:"title" binding:"required,min=10,max=200"`
	Content     string           `json:"content" binding:"required,min=20,max=2000"`
	Category    QuestionCategory `json:"category" binding:"required"`
	Tags        []string         `json:"tags,omitempty"`
	ArchitectID string           `json:"architectId,omitempty"` // opcional
}

// CreateAnswerRequest representa a requisição para criar uma resposta
type CreateAnswerRequest struct {
	Content string `json:"content" binding:"required,min=20,max=2000"`
}

// QuestionFilters representa os filtros para buscar perguntas
type QuestionFilters struct {
	Category    QuestionCategory `form:"category"`
	Status      QuestionStatus   `form:"status"`
	ArchitectID string           `form:"architectId"`
	ClientID    string           `form:"clientId"`
	Search      string           `form:"search"`
	Featured    *bool            `form:"featured"`
	Page        int              `form:"page,default=1"`
	Limit       int              `form:"limit,default=20"`
}

// QuestionListResponse representa a resposta paginada de perguntas
type QuestionListResponse struct {
	Data       []Question `json:"data"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	Limit      int        `json:"limit"`
	TotalPages int        `json:"totalPages"`
}

// QuestionStats representa estatísticas de perguntas
type QuestionStats struct {
	TotalQuestions   int64 `json:"totalQuestions"`
	TotalAnswered    int64 `json:"totalAnswered"`
	TotalOpen        int64 `json:"totalOpen"`
	TotalAnswers     int64 `json:"totalAnswers"`
	MyQuestions      int64 `json:"myQuestions,omitempty"`
	MyAnswers        int64 `json:"myAnswers,omitempty"`
}


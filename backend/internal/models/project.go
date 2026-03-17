package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProjectStatus string

const (
	ProjectStatusDraft     ProjectStatus = "draft"
	ProjectStatusPublished ProjectStatus = "published"
	ProjectStatusArchived  ProjectStatus = "archived"
)

type ProjectWorkStatus string

const (
	WorkStatusEmAndamento ProjectWorkStatus = "em-andamento"
	WorkStatusAprovado    ProjectWorkStatus = "aprovado"
	WorkStatusConcluido   ProjectWorkStatus = "concluido"
	WorkStatusRevisao     ProjectWorkStatus = "revisao"
)

type AccessType string

const (
	AccessTypePublic   AccessType = "public"
	AccessTypePrivate  AccessType = "private"
	AccessTypePassword AccessType = "password"
)

type ProjectCategory string

const (
	CategoryResidencial ProjectCategory = "residencial"
	CategoryComercial   ProjectCategory = "comercial"
	CategoryReforma      ProjectCategory = "reforma"
	CategoryInteriores   ProjectCategory = "interiores"
)

type ProjectSpecs struct {
	Area    string `bson:"area,omitempty" json:"area,omitempty"`
	Garage  string `bson:"garage,omitempty" json:"garage,omitempty"`
	Style   string `bson:"style,omitempty" json:"style,omitempty"`
}

type Project struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       primitive.ObjectID `bson:"userId" json:"userId"`
	ClientID     *primitive.ObjectID `bson:"clientId,omitempty" json:"clientId,omitempty"`
	Title        string             `bson:"title" json:"title"`
	Description  string             `bson:"description,omitempty" json:"description,omitempty"`
	Category     ProjectCategory    `bson:"category" json:"category"`
	Location     string             `bson:"location" json:"location"`
	Status       ProjectStatus      `bson:"status" json:"status"`
	ProjectStatus ProjectWorkStatus `bson:"projectStatus,omitempty" json:"projectStatus,omitempty"`
	AccessType   AccessType         `bson:"accessType" json:"accessType"`
	PasswordHash string             `bson:"passwordHash,omitempty" json:"-"`
	CoverImage   string             `bson:"coverImage,omitempty" json:"coverImage,omitempty"`
	Tags         []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	Specs        *ProjectSpecs      `bson:"specs,omitempty" json:"specs,omitempty"`
	Views        int                `bson:"views" json:"views"`
	FilesCount   int                `bson:"filesCount" json:"filesCount"`
	Featured     bool               `bson:"featured" json:"featured"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}




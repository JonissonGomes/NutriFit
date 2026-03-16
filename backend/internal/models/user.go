package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRole string

const (
	RoleNutricionista UserRole = "nutricionista"
	RolePaciente      UserRole = "paciente"
	RoleAdmin         UserRole = "admin"
	RoleModerator     UserRole = "moderator"
	RoleCurator       UserRole = "curator"
	RoleSupport       UserRole = "support"
)

type PlanType string

const (
	PlanFree         PlanType = "free"
	PlanStarter      PlanType = "starter"
	PlanProfessional PlanType = "professional"
	PlanBusiness     PlanType = "business"
)

type Location struct {
	Enabled     bool      `bson:"enabled" json:"enabled"`
	Coordinates *Coordinates `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
	Address     *Address     `bson:"address,omitempty" json:"address,omitempty"`
	Source      string    `bson:"source" json:"source"` // browser, ip, manual
	LastUpdated time.Time `bson:"lastUpdated,omitempty" json:"lastUpdated,omitempty"`
	ConsentGiven bool     `bson:"consentGiven" json:"consentGiven"`
	ConsentDate  time.Time `bson:"consentDate,omitempty" json:"consentDate,omitempty"`
}

type Coordinates struct {
	Latitude  float64 `bson:"latitude" json:"latitude"`
	Longitude float64 `bson:"longitude" json:"longitude"`
	Accuracy  float64 `bson:"accuracy,omitempty" json:"accuracy,omitempty"` // metros
}

type Address struct {
	Street       string `bson:"street,omitempty" json:"street,omitempty"`
	City         string `bson:"city" json:"city"`
	State        string `bson:"state" json:"state"`
	Neighborhood string `bson:"neighborhood,omitempty" json:"neighborhood,omitempty"`
	PostalCode   string `bson:"postalCode,omitempty" json:"postalCode,omitempty"`
	Country      string `bson:"country" json:"country"`
}

type GoogleOAuth struct {
	ID      string `bson:"id" json:"id"`
	Email   string `bson:"email" json:"email"`
	Picture string `bson:"picture,omitempty" json:"picture,omitempty"`
}

type OAuth struct {
	Google *GoogleOAuth `bson:"google,omitempty" json:"google,omitempty"`
}

type AdminMetadata struct {
	CreatedBy  primitive.ObjectID `bson:"createdBy,omitempty" json:"createdBy,omitempty"`
	LastLogin  time.Time          `bson:"lastLogin,omitempty" json:"lastLogin,omitempty"`
	LoginCount int                `bson:"loginCount" json:"loginCount"`
	ActionsCount int              `bson:"actionsCount" json:"actionsCount"`
	Status     string             `bson:"status" json:"status"` // active, suspended
}

type Permissions struct {
	Users        *ResourcePermissions `bson:"users,omitempty" json:"users,omitempty"`
	Projects     *ResourcePermissions `bson:"projects,omitempty" json:"projects,omitempty"`
	Verifications *ResourcePermissions `bson:"verifications,omitempty" json:"verifications,omitempty"`
	Moderation   *ResourcePermissions `bson:"moderation,omitempty" json:"moderation,omitempty"`
	Analytics    *ResourcePermissions `bson:"analytics,omitempty" json:"analytics,omitempty"`
	Settings     *ResourcePermissions `bson:"settings,omitempty" json:"settings,omitempty"`
}

type ResourcePermissions struct {
	View   bool `bson:"view" json:"view"`
	Edit   bool `bson:"edit" json:"edit"`
	Delete bool `bson:"delete" json:"delete"`
	Ban    bool `bson:"ban,omitempty" json:"ban,omitempty"`
	Approve bool `bson:"approve,omitempty" json:"approve,omitempty"`
	Reject bool `bson:"reject,omitempty" json:"reject,omitempty"`
	Feature bool `bson:"feature,omitempty" json:"feature,omitempty"`
	Export bool `bson:"export,omitempty" json:"export,omitempty"`
}

type User struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email         string             `bson:"email" json:"email"`
	Name          string             `bson:"name" json:"name"`
	PasswordHash  string             `bson:"passwordHash,omitempty" json:"-"`
	Role          UserRole           `bson:"role" json:"role"`
	OAuth         *OAuth             `bson:"oauth,omitempty" json:"oauth,omitempty"`
	Avatar        string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Phone         string             `bson:"phone,omitempty" json:"phone,omitempty"`
	Bio           string             `bson:"bio,omitempty" json:"bio,omitempty"`
	StorageUsed   int64              `bson:"storageUsed" json:"storageUsed"`
	StorageLimit  int64              `bson:"storageLimit" json:"storageLimit"`
	Plan          PlanType           `bson:"plan" json:"plan"`
	Location      *Location          `bson:"location,omitempty" json:"location,omitempty"`
	Permissions   *Permissions       `bson:"permissions,omitempty" json:"permissions,omitempty"`
	AdminMetadata *AdminMetadata     `bson:"adminMetadata,omitempty" json:"adminMetadata,omitempty"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}



package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NotificationSettings struct {
	Email          bool `bson:"email" json:"email"`
	ProjectUpdates bool `bson:"projectUpdates" json:"projectUpdates"`
	ClientMessages bool `bson:"clientMessages" json:"clientMessages"`
	MarketingEmails bool `bson:"marketingEmails" json:"marketingEmails"`
}

type Preferences struct {
	Language string `bson:"language" json:"language"`
	Theme    string `bson:"theme" json:"theme"` // light, dark
}

type PrivacySettings struct {
	ProfileVisibility string `bson:"profileVisibility" json:"profileVisibility"` // public, private
	ShowEmail         bool   `bson:"showEmail" json:"showEmail"`
	ShowPhone         bool   `bson:"showPhone" json:"showPhone"`
}

type TwoFactorAuth struct {
	Enabled    bool     `bson:"enabled" json:"enabled"`
	Secret     string   `bson:"secret,omitempty" json:"-"`
	BackupCodes []string `bson:"backupCodes,omitempty" json:"-"`
}

type UserSettings struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        primitive.ObjectID `bson:"userId" json:"userId"`
	Notifications *NotificationSettings `bson:"notifications,omitempty" json:"notifications,omitempty"`
	Preferences   *Preferences       `bson:"preferences,omitempty" json:"preferences,omitempty"`
	Privacy       *PrivacySettings   `bson:"privacy,omitempty" json:"privacy,omitempty"`
	TwoFactorAuth *TwoFactorAuth     `bson:"twoFactorAuth,omitempty" json:"twoFactorAuth,omitempty"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}




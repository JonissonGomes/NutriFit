package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// NotificationType tipo de notificação
type NotificationType string

const (
	NotificationTypeEventReminder  NotificationType = "event_reminder"
	NotificationTypeProjectUpdate  NotificationType = "project_update"
	NotificationTypeMessage        NotificationType = "message"
	NotificationTypeReview         NotificationType = "review"
	NotificationTypeVerification   NotificationType = "verification"
	NotificationTypeFavorite       NotificationType = "favorite"
	NotificationTypeSystem         NotificationType = "system"
)

// NotificationChannel canal de envio
type NotificationChannel string

const (
	ChannelInApp NotificationChannel = "in_app"
	ChannelEmail NotificationChannel = "email"
	ChannelSMS   NotificationChannel = "sms"
	ChannelPush  NotificationChannel = "push"
)

// Notification modelo de notificação
type Notification struct {
	ID            primitive.ObjectID    `bson:"_id,omitempty" json:"id"`
	UserID        primitive.ObjectID    `bson:"userId" json:"userId"`
	Type          NotificationType      `bson:"type" json:"type"`
	Title         string                `bson:"title" json:"title"`
	Message       string                `bson:"message" json:"message"`
	RelatedType   string                `bson:"relatedType,omitempty" json:"relatedType,omitempty"`   // project, event, message, review
	RelatedID     *primitive.ObjectID   `bson:"relatedId,omitempty" json:"relatedId,omitempty"`
	Channels      []NotificationChannel `bson:"channels" json:"channels"`
	Read          bool                  `bson:"read" json:"read"`
	ReadAt        *time.Time            `bson:"readAt,omitempty" json:"readAt,omitempty"`
	ScheduledFor  *time.Time            `bson:"scheduledFor,omitempty" json:"scheduledFor,omitempty"`
	Sent          bool                  `bson:"sent" json:"sent"`
	SentAt        *time.Time            `bson:"sentAt,omitempty" json:"sentAt,omitempty"`
	SentChannels  []NotificationChannel `bson:"sentChannels,omitempty" json:"sentChannels,omitempty"` // Canais pelos quais foi enviada
	Metadata      map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`         // Dados extras
	CreatedAt     time.Time             `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time             `bson:"updatedAt" json:"updatedAt"`
}

// NotificationPreference preferências de notificação do usuário
type NotificationPreference struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID   primitive.ObjectID `bson:"userId" json:"userId"`
	
	// Preferências por tipo
	EventReminders struct {
		Enabled       bool `bson:"enabled" json:"enabled"`
		MinutesBefore int  `bson:"minutesBefore" json:"minutesBefore"` // Padrão: 30
	} `bson:"eventReminders" json:"eventReminders"`
	
	ProjectUpdates struct {
		Enabled bool `bson:"enabled" json:"enabled"`
		Email   bool `bson:"email" json:"email"`
	} `bson:"projectUpdates" json:"projectUpdates"`
	
	Messages struct {
		Enabled      bool `bson:"enabled" json:"enabled"`
		Email        bool `bson:"email" json:"email"`
		EmailDigest  bool `bson:"emailDigest" json:"emailDigest"` // Resumo diário por email
	} `bson:"messages" json:"messages"`
	
	Reviews struct {
		Enabled bool `bson:"enabled" json:"enabled"`
		Email   bool `bson:"email" json:"email"`
	} `bson:"reviews" json:"reviews"`
	
	Marketing struct {
		Enabled bool `bson:"enabled" json:"enabled"`
		Email   bool `bson:"email" json:"email"`
	} `bson:"marketing" json:"marketing"`
	
	// Canais globais
	GlobalChannels struct {
		Email struct {
			Enabled bool   `bson:"enabled" json:"enabled"`
			Address string `bson:"address,omitempty" json:"address,omitempty"` // Email alternativo
		} `bson:"email" json:"email"`
		
		SMS struct {
			Enabled bool   `bson:"enabled" json:"enabled"`
			Phone   string `bson:"phone,omitempty" json:"phone,omitempty"`
		} `bson:"sms" json:"sms"`
		
		Push struct {
			Enabled bool   `bson:"enabled" json:"enabled"`
			Token   string `bson:"token,omitempty" json:"token,omitempty"` // FCM token
		} `bson:"push" json:"push"`
	} `bson:"globalChannels" json:"globalChannels"`
	
	// Horários de silêncio
	QuietHours struct {
		Enabled   bool   `bson:"enabled" json:"enabled"`
		StartTime string `bson:"startTime" json:"startTime"` // "22:00"
		EndTime   string `bson:"endTime" json:"endTime"`     // "08:00"
		Timezone  string `bson:"timezone" json:"timezone"`   // "America/Sao_Paulo"
	} `bson:"quietHours" json:"quietHours"`
	
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
}




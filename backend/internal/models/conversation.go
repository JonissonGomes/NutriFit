package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Conversation struct {
	ID            primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Participants  []primitive.ObjectID `bson:"participants" json:"participants"`
	LastMessage   *primitive.ObjectID  `bson:"lastMessage,omitempty" json:"lastMessage,omitempty"`
	LastMessageAt time.Time            `bson:"lastMessageAt" json:"lastMessageAt"`
	UnreadCount   map[string]int       `bson:"unreadCount" json:"unreadCount"` // userId -> count
	CreatedAt     time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time            `bson:"updatedAt" json:"updatedAt"`
}

type Message struct {
	ID             primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	ConversationID primitive.ObjectID   `bson:"conversationId" json:"conversationId"`
	SenderID       primitive.ObjectID   `bson:"senderId" json:"senderId"`
	ReceiverID     primitive.ObjectID   `bson:"receiverId" json:"receiverId"`
	Text           string               `bson:"text" json:"text"`
	Attachments    []MessageAttachment  `bson:"attachments,omitempty" json:"attachments,omitempty"`
	Read           bool                 `bson:"read" json:"read"`
	ReadAt         *time.Time           `bson:"readAt,omitempty" json:"readAt,omitempty"`
	CreatedAt      time.Time            `bson:"createdAt" json:"createdAt"`
}

type MessageAttachment struct {
	Type     string `bson:"type" json:"type"` // image, file
	URL      string `bson:"url" json:"url"`
	Filename string `bson:"filename" json:"filename"`
	Size     int64  `bson:"size" json:"size"`
}




package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Favorite struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ClientID    primitive.ObjectID `bson:"clientId" json:"clientId"`
	ArchitectID primitive.ObjectID `bson:"architectId" json:"architectId"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}




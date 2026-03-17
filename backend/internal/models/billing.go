package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentMethod struct {
	Type   string `bson:"type" json:"type"` // credit_card
	Last4  string `bson:"last4" json:"last4"`
	ExpMonth int  `bson:"expMonth" json:"expMonth"`
	ExpYear  int  `bson:"expYear" json:"expYear"`
}

type BillingStatus string

const (
	BillingStatusActive   BillingStatus = "active"
	BillingStatusCanceled BillingStatus = "canceled"
	BillingStatusPastDue  BillingStatus = "past_due"
)

type Billing struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"userId" json:"userId"`
	Plan            PlanType           `bson:"plan" json:"plan"`
	PaymentMethod   *PaymentMethod     `bson:"paymentMethod,omitempty" json:"paymentMethod,omitempty"`
	SubscriptionID  string             `bson:"subscriptionId,omitempty" json:"subscriptionId,omitempty"`
	CurrentPeriodEnd time.Time         `bson:"currentPeriodEnd,omitempty" json:"currentPeriodEnd,omitempty"`
	Status          BillingStatus      `bson:"status" json:"status"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}




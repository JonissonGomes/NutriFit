package anthropometric

import (
	"context"
	"errors"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrRecordNotFound = errors.New("registro antropométrico não encontrado")
)

func ListByPatient(ctx context.Context, patientID string, limit int) ([]models.Anthropometric, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}
	limitInt64 := int64(limit)
	if limitInt64 <= 0 || limitInt64 > 200 {
		limitInt64 = 50
	}

	cursor, err := database.AnthropometricCollection.Find(ctx, bson.M{"patientId": patientOID}, &options.FindOptions{
		Limit: &limitInt64,
		Sort:  bson.M{"date": -1, "createdAt": -1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.Anthropometric
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func Create(ctx context.Context, rec models.Anthropometric) (*models.Anthropometric, error) {
	rec.ID = primitive.NewObjectID()
	rec.CreatedAt = time.Now()
	rec.UpdatedAt = time.Now()
	if rec.Height > 0 && rec.Weight > 0 {
		h := rec.Height / 100.0
		rec.BMI = rec.Weight / (h * h)
	}
	_, err := database.AnthropometricCollection.InsertOne(ctx, rec)
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func Update(ctx context.Context, id string, updates bson.M) (*models.Anthropometric, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	updates["updatedAt"] = time.Now()
	after := options.After
	res := database.AnthropometricCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &after},
	)
	if res.Err() != nil {
		if errors.Is(res.Err(), mongo.ErrNoDocuments) {
			return nil, ErrRecordNotFound
		}
		return nil, res.Err()
	}

	var out models.Anthropometric
	if err := res.Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

func Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	r, err := database.AnthropometricCollection.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return err
	}
	if r.DeletedCount == 0 {
		return ErrRecordNotFound
	}
	return nil
}


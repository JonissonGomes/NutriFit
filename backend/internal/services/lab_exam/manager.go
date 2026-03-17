package lab_exam

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
	ErrLabExamNotFound = errors.New("exame não encontrado")
)

func ListByPatient(ctx context.Context, patientID string, limit int) ([]models.LabExam, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}
	limitInt64 := int64(limit)
	if limitInt64 <= 0 || limitInt64 > 100 {
		limitInt64 = 50
	}
	cursor, err := database.LabExamsCollection.Find(ctx, bson.M{"patientId": patientOID}, &options.FindOptions{
		Limit: &limitInt64,
		Sort:  bson.M{"date": -1, "createdAt": -1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.LabExam
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func Create(ctx context.Context, exam models.LabExam) (*models.LabExam, error) {
	exam.ID = primitive.NewObjectID()
	exam.CreatedAt = time.Now()
	exam.UpdatedAt = time.Now()
	_, err := database.LabExamsCollection.InsertOne(ctx, exam)
	if err != nil {
		return nil, err
	}
	return &exam, nil
}

func Update(ctx context.Context, id string, updates bson.M) (*models.LabExam, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	updates["updatedAt"] = time.Now()
	after := options.After
	res := database.LabExamsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &after},
	)
	if res.Err() != nil {
		if errors.Is(res.Err(), mongo.ErrNoDocuments) {
			return nil, ErrLabExamNotFound
		}
		return nil, res.Err()
	}

	var out models.LabExam
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
	r, err := database.LabExamsCollection.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return err
	}
	if r.DeletedCount == 0 {
		return ErrLabExamNotFound
	}
	return nil
}


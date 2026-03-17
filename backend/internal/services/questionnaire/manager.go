package questionnaire

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
	ErrQuestionnaireNotFound = errors.New("questionário não encontrado")
)

func ListByPatient(ctx context.Context, patientID string, limit int) ([]models.Questionnaire, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}
	limitInt64 := int64(limit)
	if limitInt64 <= 0 || limitInt64 > 100 {
		limitInt64 = 50
	}

	cursor, err := database.QuestionnairesCollection.Find(ctx, bson.M{"patientId": patientOID}, &options.FindOptions{
		Limit: &limitInt64,
		Sort:  bson.M{"createdAt": -1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.Questionnaire
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func Create(ctx context.Context, q models.Questionnaire) (*models.Questionnaire, error) {
	q.ID = primitive.NewObjectID()
	q.CreatedAt = time.Now()
	q.UpdatedAt = time.Now()
	if q.Status == "" {
		q.Status = models.QuestionnaireStatusDraft
	}

	_, err := database.QuestionnairesCollection.InsertOne(ctx, q)
	if err != nil {
		return nil, err
	}
	return &q, nil
}

func Update(ctx context.Context, id string, updates bson.M) (*models.Questionnaire, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	updates["updatedAt"] = time.Now()
	after := options.After
	res := database.QuestionnairesCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &after},
	)
	if res.Err() != nil {
		if errors.Is(res.Err(), mongo.ErrNoDocuments) {
			return nil, ErrQuestionnaireNotFound
		}
		return nil, res.Err()
	}

	var out models.Questionnaire
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
	r, err := database.QuestionnairesCollection.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return err
	}
	if r.DeletedCount == 0 {
		return ErrQuestionnaireNotFound
	}
	return nil
}

func SubmitAnswers(ctx context.Context, id string, answers []models.AnamnesisAnswer) (*models.Questionnaire, error) {
	updates := bson.M{
		"answers": answers,
		"status":  models.QuestionnaireStatusCompleted,
	}
	now := time.Now()
	updates["completedAt"] = &now
	return Update(ctx, id, updates)
}


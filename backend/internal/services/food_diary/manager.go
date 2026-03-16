package food_diary

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
	ErrEntryNotFound = errors.New("registro não encontrado")
)

// CreateEntry cria um novo registro no diário alimentar
func CreateEntry(ctx context.Context, entry models.FoodDiaryEntry) (*models.FoodDiaryEntry, error) {
	entry.CreatedAt = time.Now()
	entry.UpdatedAt = time.Now()

	result, err := database.FoodDiaryCollection.InsertOne(ctx, entry)
	if err != nil {
		return nil, err
	}

	entry.ID = result.InsertedID.(primitive.ObjectID)
	return &entry, nil
}

// GetEntries busca registros do diário alimentar de um paciente
func GetEntries(ctx context.Context, patientID string, startDate, endDate *time.Time, limit int) ([]models.FoodDiaryEntry, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	filter := bson.M{"patientId": patientOID}

	if startDate != nil && endDate != nil {
		filter["date"] = bson.M{
			"$gte": startDate,
			"$lte": endDate,
		}
	}

	limitInt64 := int64(limit)
	if limitInt64 > 100 {
		limitInt64 = 100
	}

	cursor, err := database.FoodDiaryCollection.Find(ctx, filter, &options.FindOptions{
		Limit: &limitInt64,
		Sort:  bson.M{"date": -1, "createdAt": -1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var entries []models.FoodDiaryEntry
	if err = cursor.All(ctx, &entries); err != nil {
		return nil, err
	}

	return entries, nil
}

// GetEntry busca um registro específico
func GetEntry(ctx context.Context, entryID string) (*models.FoodDiaryEntry, error) {
	entryOID, err := primitive.ObjectIDFromHex(entryID)
	if err != nil {
		return nil, err
	}

	var entry models.FoodDiaryEntry
	err = database.FoodDiaryCollection.FindOne(ctx, bson.M{"_id": entryOID}).Decode(&entry)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrEntryNotFound
		}
		return nil, err
	}

	return &entry, nil
}

// UpdateEntry atualiza um registro
func UpdateEntry(ctx context.Context, entryID string, updates bson.M) (*models.FoodDiaryEntry, error) {
	entryOID, err := primitive.ObjectIDFromHex(entryID)
	if err != nil {
		return nil, err
	}

	updates["updatedAt"] = time.Now()

	returnAfter := options.After
	result := database.FoodDiaryCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": entryOID},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &returnAfter},
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return nil, ErrEntryNotFound
		}
		return nil, result.Err()
	}

	var entry models.FoodDiaryEntry
	if err = result.Decode(&entry); err != nil {
		return nil, err
	}

	return &entry, nil
}

// AddNutritionistComment adiciona comentário do nutricionista
func AddNutritionistComment(ctx context.Context, entryID string, comment string) error {
	entryOID, err := primitive.ObjectIDFromHex(entryID)
	if err != nil {
		return err
	}

	_, err = database.FoodDiaryCollection.UpdateOne(
		ctx,
		bson.M{"_id": entryOID},
		bson.M{
			"$set": bson.M{
				"nutritionistComment": comment,
				"updatedAt":           time.Now(),
			},
		},
	)

	return err
}

// UpdateAIAnalysis atualiza análise de IA de uma foto
func UpdateAIAnalysis(ctx context.Context, entryID string, analysis models.AIAnalysis) error {
	entryOID, err := primitive.ObjectIDFromHex(entryID)
	if err != nil {
		return err
	}

	_, err = database.FoodDiaryCollection.UpdateOne(
		ctx,
		bson.M{"_id": entryOID},
		bson.M{
			"$set": bson.M{
				"aiAnalysis": analysis,
				"updatedAt":  time.Now(),
			},
		},
	)

	return err
}

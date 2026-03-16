package goal

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
	ErrGoalNotFound = errors.New("meta não encontrada")
)

// CreateGoal cria uma nova meta
func CreateGoal(ctx context.Context, goal models.Goal) (*models.Goal, error) {
	goal.CreatedAt = time.Now()
	goal.UpdatedAt = time.Now()

	result, err := database.GoalsCollection.InsertOne(ctx, goal)
	if err != nil {
		return nil, err
	}

	goal.ID = result.InsertedID.(primitive.ObjectID)
	return &goal, nil
}

// GetPatientGoals busca metas de um paciente
func GetPatientGoals(ctx context.Context, patientID string) ([]models.Goal, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	cursor, err := database.GoalsCollection.Find(ctx, bson.M{
		"patientId": patientOID,
		"status":    bson.M{"$ne": models.GoalStatusCancelled},
	}, &options.FindOptions{
		Sort: bson.M{"createdAt": -1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var goals []models.Goal
	if err = cursor.All(ctx, &goals); err != nil {
		return nil, err
	}

	return goals, nil
}

// UpdateGoal atualiza uma meta
func UpdateGoal(ctx context.Context, goalID string, updates bson.M) (*models.Goal, error) {
	goalOID, err := primitive.ObjectIDFromHex(goalID)
	if err != nil {
		return nil, err
	}

	updates["updatedAt"] = time.Now()

	returnAfter := options.After
	result := database.GoalsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": goalOID},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &returnAfter},
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return nil, ErrGoalNotFound
		}
		return nil, result.Err()
	}

	var goal models.Goal
	if err = result.Decode(&goal); err != nil {
		return nil, err
	}

	return &goal, nil
}

// DeleteGoal remove uma meta
func DeleteGoal(ctx context.Context, goalID string) error {
	goalOID, err := primitive.ObjectIDFromHex(goalID)
	if err != nil {
		return err
	}

	result, err := database.GoalsCollection.DeleteOne(ctx, bson.M{"_id": goalOID})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrGoalNotFound
	}

	return nil
}

// AddCheckIn adiciona um check-in a uma meta
func AddCheckIn(ctx context.Context, goalID string, checkIn models.GoalCheckIn) (*models.Goal, error) {
	goalOID, err := primitive.ObjectIDFromHex(goalID)
	if err != nil {
		return nil, err
	}

	// Buscar meta atual
	var goal models.Goal
	err = database.GoalsCollection.FindOne(ctx, bson.M{"_id": goalOID}).Decode(&goal)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrGoalNotFound
		}
		return nil, err
	}

	// Adicionar check-in
	if goal.CheckIns == nil {
		goal.CheckIns = []models.GoalCheckIn{}
	}
	goal.CheckIns = append(goal.CheckIns, checkIn)

	// Atualizar valor atual se fornecido
	if checkIn.Value > 0 {
		goal.CurrentValue = checkIn.Value
	}

	// Verificar se meta foi completada
	if goal.TargetValue > 0 && goal.CurrentValue >= goal.TargetValue {
		goal.Status = models.GoalStatusCompleted
	}

	goal.UpdatedAt = time.Now()

	_, err = database.GoalsCollection.ReplaceOne(ctx, bson.M{"_id": goalOID}, goal)
	if err != nil {
		return nil, err
	}

	return &goal, nil
}

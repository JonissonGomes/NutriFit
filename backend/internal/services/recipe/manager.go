package recipe

import (
	"context"
	"errors"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var ErrRecipeNotFound = errors.New("receita não encontrada")

func ListByNutritionist(ctx context.Context, nutritionistID string, limit int64) ([]models.Recipe, error) {
	nid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	cursor, err := database.RecipesCollection.Find(ctx, bson.M{"nutritionistId": nid}, options.Find().SetSort(bson.M{"updatedAt": -1}).SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var out []models.Recipe
	if err := cursor.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func ListPublicByNutritionist(ctx context.Context, nutritionistID string, limit int64) ([]models.Recipe, error) {
	nid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 100 {
		limit = 12
	}
	cursor, err := database.RecipesCollection.Find(ctx, bson.M{"nutritionistId": nid, "isPublic": true}, options.Find().SetSort(bson.M{"updatedAt": -1}).SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var out []models.Recipe
	if err := cursor.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func ListForPatient(ctx context.Context, patientID string, limit int64) ([]models.Recipe, error) {
	userOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	linkedPatientIDs := resolveLinkedPatientIDs(ctx, userOID)
	patientIDOr := []bson.M{{"patientIds": userOID}}
	if len(linkedPatientIDs) > 0 {
		patientIDOr = append(patientIDOr, bson.M{"patientIds": bson.M{"$in": linkedPatientIDs}})
	}

	mealPlanIDs := patientMealPlanIDs(ctx, userOID, linkedPatientIDs)
	filter := bson.M{
		"$or": []bson.M{
			{"isPublic": true},
			{"$or": patientIDOr},
			{"mealPlanIds": bson.M{"$in": mealPlanIDs}},
		},
	}
	cursor, err := database.RecipesCollection.Find(ctx, filter, options.Find().SetSort(bson.M{"updatedAt": -1}).SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var out []models.Recipe
	if err := cursor.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func resolveLinkedPatientIDs(ctx context.Context, userID primitive.ObjectID) []primitive.ObjectID {
	cursor, err := database.PatientsCollection.Find(ctx, bson.M{"userId": userID}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil
	}
	defer cursor.Close(ctx)
	var docs []struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	if err := cursor.All(ctx, &docs); err != nil {
		return nil
	}
	ids := make([]primitive.ObjectID, 0, len(docs))
	for _, d := range docs {
		ids = append(ids, d.ID)
	}
	return ids
}

func patientMealPlanIDs(ctx context.Context, userID primitive.ObjectID, linkedPatientIDs []primitive.ObjectID) []primitive.ObjectID {
	or := []bson.M{{"patientId": userID}}
	if len(linkedPatientIDs) > 0 {
		or = append(or, bson.M{"patientId": bson.M{"$in": linkedPatientIDs}})
	}
	cursor, err := database.MealPlansCollection.Find(ctx, bson.M{"$or": or}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil
	}
	defer cursor.Close(ctx)
	var docs []struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	if err := cursor.All(ctx, &docs); err != nil {
		return nil
	}
	ids := make([]primitive.ObjectID, 0, len(docs))
	for _, d := range docs {
		ids = append(ids, d.ID)
	}
	return ids
}

func Create(ctx context.Context, nutritionistID string, in models.Recipe) (*models.Recipe, error) {
	nid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	in.NutritionistID = nid
	in.CreatedAt = now
	in.UpdatedAt = now
	res, err := database.RecipesCollection.InsertOne(ctx, in)
	if err != nil {
		return nil, err
	}
	in.ID = res.InsertedID.(primitive.ObjectID)
	return &in, nil
}

func Update(ctx context.Context, id, nutritionistID string, updates bson.M) (*models.Recipe, error) {
	rid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	nid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	updates["updatedAt"] = time.Now()
	after := options.After
	res := database.RecipesCollection.FindOneAndUpdate(ctx, bson.M{"_id": rid, "nutritionistId": nid}, bson.M{"$set": updates}, options.FindOneAndUpdate().SetReturnDocument(after))
	if res.Err() != nil {
		if errors.Is(res.Err(), mongo.ErrNoDocuments) {
			return nil, ErrRecipeNotFound
		}
		return nil, res.Err()
	}
	var out models.Recipe
	if err := res.Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

func Delete(ctx context.Context, id, nutritionistID string) error {
	rid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	nid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return err
	}
	res, err := database.RecipesCollection.DeleteOne(ctx, bson.M{"_id": rid, "nutritionistId": nid})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrRecipeNotFound
	}
	return nil
}

func AddImageURL(ctx context.Context, id, nutritionistID, imageURL string) (*models.Recipe, error) {
	rid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	nid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}
	var current models.Recipe
	if err := database.RecipesCollection.FindOne(ctx, bson.M{"_id": rid, "nutritionistId": nid}).Decode(&current); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrRecipeNotFound
		}
		return nil, err
	}
	if len(current.ImageURLs) >= 3 {
		return nil, errors.New("limite máximo de 3 imagens por receita")
	}
	after := options.After
	res := database.RecipesCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": rid, "nutritionistId": nid},
		bson.M{
			"$push": bson.M{"imageUrls": imageURL},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
		options.FindOneAndUpdate().SetReturnDocument(after),
	)
	if res.Err() != nil {
		if errors.Is(res.Err(), mongo.ErrNoDocuments) {
			return nil, ErrRecipeNotFound
		}
		return nil, res.Err()
	}
	var out models.Recipe
	if err := res.Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

package project

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/auth"
)

func GetProjectsByUser(userID, status, category string, page, limit int) ([]*models.Project, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, err
	}

	filter := bson.M{"userId": objID}
	if status != "" {
		filter["status"] = status
	}
	if category != "" {
		filter["category"] = category
	}

	// Count total
	total, err := database.ProjectsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Find with pagination
	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit))

	cursor, err := database.ProjectsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var projects []*models.Project
	if err = cursor.All(ctx, &projects); err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

func CreateProject(project *models.Project) (*models.Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	project.ID = primitive.NewObjectID()
	project.CreatedAt = time.Now()
	project.UpdatedAt = time.Now()

	_, err := database.ProjectsCollection.InsertOne(ctx, project)
	if err != nil {
		return nil, err
	}

	return project, nil
}

func GetProjectByID(projectID, userID string) (*models.Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	projectObjID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	var project models.Project
	err = database.ProjectsCollection.FindOne(ctx, bson.M{
		"_id":    projectObjID,
		"userId": userObjID,
	}).Decode(&project)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	return &project, nil
}

func UpdateProject(projectID, userID string, updates map[string]interface{}) (*models.Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	projectObjID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	updates["updatedAt"] = time.Now()
	update := bson.M{"$set": updates}

	var project models.Project
	err = database.ProjectsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": projectObjID, "userId": userObjID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&project)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	return &project, nil
}

func DeleteProject(projectID, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	projectObjID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return err
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	result, err := database.ProjectsCollection.DeleteOne(ctx, bson.M{
		"_id":    projectObjID,
		"userId": userObjID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("project not found")
	}

	return nil
}

func UpdateProjectVisibility(projectID, userID, accessType, password string) (*models.Project, error) {
	updates := map[string]interface{}{
		"accessType": accessType,
	}

	if accessType == "password" && password != "" {
		hashedPassword, err := auth.HashPassword(password)
		if err != nil {
			return nil, err
		}
		updates["passwordHash"] = hashedPassword
	} else {
		updates["passwordHash"] = ""
	}

	return UpdateProject(projectID, userID, updates)
}

func GetProjectStats(projectID, userID string) (map[string]interface{}, error) {
	project, err := GetProjectByID(projectID, userID)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	projectObjID, _ := primitive.ObjectIDFromHex(projectID)
	imageCount, _ := database.ImagesCollection.CountDocuments(ctx, bson.M{"projectId": projectObjID})

	stats := map[string]interface{}{
		"views":      project.Views,
		"filesCount": imageCount,
		"status":     project.Status,
		"createdAt":  project.CreatedAt,
	}

	return stats, nil
}

func GetProjectImages(projectID, userID string) ([]*models.Image, error) {
	// Verify project ownership
	_, err := GetProjectByID(projectID, userID)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	projectObjID, _ := primitive.ObjectIDFromHex(projectID)

	cursor, err := database.ImagesCollection.Find(ctx, bson.M{
		"projectId": projectObjID,
	}, options.Find().SetSort(bson.D{{Key: "position", Value: 1}}))

	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var images []*models.Image
	if err = cursor.All(ctx, &images); err != nil {
		return nil, err
	}

	return images, nil
}




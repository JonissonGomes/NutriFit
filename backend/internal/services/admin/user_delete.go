package admin

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

var (
	ErrCannotDeleteSelf       = errors.New("você não pode excluir sua própria conta")
	ErrUserNotFound           = errors.New("usuário não encontrado")
	ErrCannotDeleteSuperAdmin = errors.New("não é possível excluir um super administrador")
)

// DeleteUserCascade remove o usuário e todos os dados vinculados na plataforma.
func DeleteUserCascade(ctx context.Context, targetUserID, actorUserID string) error {
	if targetUserID == actorUserID {
		return ErrCannotDeleteSelf
	}

	userOID, err := primitive.ObjectIDFromHex(targetUserID)
	if err != nil {
		return ErrUserNotFound
	}

	var user models.User
	err = database.UsersCollection.FindOne(ctx, bson.M{"_id": userOID}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrUserNotFound
		}
		return err
	}

	if user.Role == models.RoleSuperAdmin {
		return ErrCannotDeleteSuperAdmin
	}

	patientIDs, err := collectPatientIDs(ctx, userOID)
	if err != nil {
		return err
	}

	mealPlanIDs, err := collectMealPlanIDs(ctx, userOID, patientIDs)
	if err != nil {
		return err
	}

	if len(mealPlanIDs) > 0 {
		if _, err := database.ShoppingListsCollection.DeleteMany(ctx, bson.M{"mealPlanId": bson.M{"$in": mealPlanIDs}}); err != nil {
			return err
		}
	}

	if len(patientIDs) > 0 {
		patientFilter := bson.M{"patientId": bson.M{"$in": patientIDs}}
		patientCollections := []*mongo.Collection{
			database.AnamnesisCollection,
			database.AnthropometricCollection,
			database.FoodDiaryCollection,
			database.GoalsCollection,
			database.LabExamsCollection,
			database.QuestionnairesCollection,
		}
		for _, col := range patientCollections {
			if _, err := col.DeleteMany(ctx, patientFilter); err != nil {
				return err
			}
		}
		if _, err := database.ReviewsCollection.DeleteMany(ctx, bson.M{
			"$or": []bson.M{
				{"patientId": bson.M{"$in": patientIDs}},
				{"nutritionistId": userOID},
			},
		}); err != nil {
			return err
		}
		if _, err := database.EventsCollection.DeleteMany(ctx, bson.M{
			"$or": []bson.M{
				{"patientId": bson.M{"$in": patientIDs}},
				{"userId": userOID},
			},
		}); err != nil {
			return err
		}
	} else {
		if _, err := database.ReviewsCollection.DeleteMany(ctx, bson.M{"nutritionistId": userOID}); err != nil {
			return err
		}
		if _, err := database.EventsCollection.DeleteMany(ctx, bson.M{"userId": userOID}); err != nil {
			return err
		}
	}

	nutritionistCollections := []struct {
		col    *mongo.Collection
		filter bson.M
	}{
		{database.AnamnesisTemplatesCollection, bson.M{"nutritionistId": userOID}},
		{database.RecipesCollection, bson.M{"nutritionistId": userOID}},
		{database.MealPlanTemplatesCollection, bson.M{"nutritionistId": userOID}},
	}
	for _, item := range nutritionistCollections {
		if _, err := item.col.DeleteMany(ctx, item.filter); err != nil {
			return err
		}
	}

	if len(mealPlanIDs) > 0 {
		if _, err := database.MealPlansCollection.DeleteMany(ctx, bson.M{
			"$or": []bson.M{
				{"_id": bson.M{"$in": mealPlanIDs}},
				{"nutritionistId": userOID},
			},
		}); err != nil {
			return err
		}
	} else {
		if _, err := database.MealPlansCollection.DeleteMany(ctx, bson.M{"nutritionistId": userOID}); err != nil {
			return err
		}
	}

	if _, err := database.PatientsCollection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"nutritionistId": userOID},
			{"userId": userOID},
		},
	}); err != nil {
		return err
	}

	if err := deleteMessaging(ctx, userOID); err != nil {
		return err
	}

	userLinkFilter := bson.M{"userId": userOID}
	directUserCollections := []*mongo.Collection{
		database.RefreshTokensCollection,
		database.PublicProfilesCollection,
		database.UserSettingsCollection,
		database.BillingCollection,
		database.NotificationsCollection,
		database.NotificationPrefsCollection,
		database.AnalyticsCollection,
		database.ImagesCollection,
		database.ServicesCollection,
		database.ModelFilesCollection,
	}
	for _, col := range directUserCollections {
		if _, err := col.DeleteMany(ctx, userLinkFilter); err != nil {
			return err
		}
	}

	if _, err := database.BadgesCollection.DeleteMany(ctx, bson.M{"userId": userOID}); err != nil {
		return err
	}

	if _, err := database.FavoritesCollection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"clientId": userOID},
			{"architectId": userOID},
		},
	}); err != nil {
		return err
	}

	if _, err := database.ProjectsCollection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"userId": userOID},
			{"clientId": userOID},
		},
	}); err != nil {
		return err
	}

	if _, err := database.BlogPostsCollection.DeleteMany(ctx, bson.M{"authorId": userOID}); err != nil {
		return err
	}

	if _, err := database.QuestionsCollection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"clientId": userOID},
			{"architectId": userOID},
		},
	}); err != nil {
		return err
	}
	if _, err := database.QuestionsCollection.UpdateMany(ctx, bson.M{"answers.architectId": userOID}, bson.M{
		"$pull": bson.M{"answers": bson.M{"architectId": userOID}},
	}); err != nil {
		return err
	}

	if _, err := database.BoostSubscriptionsCollection.DeleteMany(ctx, bson.M{"architectId": userOID}); err != nil {
		return err
	}

	userHex := userOID.Hex()
	if _, err := database.FeaturedContentCollection.DeleteMany(ctx, bson.M{"targetId": userHex}); err != nil {
		return err
	}
	if _, err := database.ModerationReportsCollection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"reporterId": userOID},
			{"targetId": userHex},
		},
	}); err != nil {
		return err
	}
	if _, err := database.SearchIndexCollection.DeleteMany(ctx, bson.M{
		"$or": []bson.M{
			{"userId": userOID},
			{"_id": userOID},
		},
	}); err != nil {
		return err
	}

	res, err := database.UsersCollection.DeleteOne(ctx, bson.M{"_id": userOID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrUserNotFound
	}

	actorOID, _ := primitive.ObjectIDFromHex(actorUserID)
	_, _ = database.AdminActionsCollection.InsertOne(ctx, bson.M{
		"adminId":    actorOID,
		"action":     "delete_user",
		"targetType": "user",
		"targetId":   userHex,
		"metadata": bson.M{
			"email": user.Email,
			"role":  user.Role,
		},
		"createdAt": time.Now(),
	})

	return nil
}

func collectPatientIDs(ctx context.Context, userOID primitive.ObjectID) ([]primitive.ObjectID, error) {
	cursor, err := database.PatientsCollection.Find(ctx, bson.M{
		"$or": []bson.M{
			{"nutritionistId": userOID},
			{"userId": userOID},
		},
	}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var ids []primitive.ObjectID
	for cursor.Next(ctx) {
		var doc struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}
		ids = append(ids, doc.ID)
	}
	return ids, cursor.Err()
}

func collectMealPlanIDs(ctx context.Context, userOID primitive.ObjectID, patientIDs []primitive.ObjectID) ([]primitive.ObjectID, error) {
	orFilter := []bson.M{{"nutritionistId": userOID}}
	if len(patientIDs) > 0 {
		orFilter = append(orFilter, bson.M{"patientId": bson.M{"$in": patientIDs}})
	}

	cursor, err := database.MealPlansCollection.Find(ctx, bson.M{"$or": orFilter}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var ids []primitive.ObjectID
	for cursor.Next(ctx) {
		var doc struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}
		ids = append(ids, doc.ID)
	}
	return ids, cursor.Err()
}

func deleteMessaging(ctx context.Context, userOID primitive.ObjectID) error {
	convCursor, err := database.ConversationsCollection.Find(ctx, bson.M{
		"participants": userOID,
	}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return err
	}
	defer convCursor.Close(ctx)

	var convIDs []primitive.ObjectID
	for convCursor.Next(ctx) {
		var doc struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := convCursor.Decode(&doc); err != nil {
			return err
		}
		convIDs = append(convIDs, doc.ID)
	}
	if err := convCursor.Err(); err != nil {
		return err
	}

	msgFilter := bson.M{
		"$or": []bson.M{
			{"senderId": userOID},
			{"receiverId": userOID},
		},
	}
	if len(convIDs) > 0 {
		msgFilter = bson.M{
			"$or": []bson.M{
				{"senderId": userOID},
				{"receiverId": userOID},
				{"conversationId": bson.M{"$in": convIDs}},
			},
		}
	}

	if _, err := database.MessagesCollection.DeleteMany(ctx, msgFilter); err != nil {
		return err
	}
	if _, err := database.ConversationsCollection.DeleteMany(ctx, bson.M{"participants": userOID}); err != nil {
		return err
	}
	return nil
}

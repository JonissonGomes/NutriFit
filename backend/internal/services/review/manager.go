package review

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

// ============================================
// ERROS
// ============================================

var (
	ErrReviewNotFound        = errors.New("avaliação não encontrada")
	ErrUnauthorized          = errors.New("não autorizado")
	ErrAlreadyReviewed       = errors.New("você já avaliou este nutricionista")
	ErrInvalidRating         = errors.New("avaliação deve ser entre 1 e 5")
	ErrCannotReviewSelf      = errors.New("não é possível avaliar a si mesmo")
	ErrNutritionistNotFound  = errors.New("nutricionista não encontrado")
)

// ============================================
// TIPOS
// ============================================

// ReviewWithDetails inclui detalhes do paciente
type ReviewWithDetails struct {
	models.Review `bson:",inline"`
	PatientName   string `bson:"patientName" json:"patientName"`
	PatientAvatar string `bson:"patientAvatar,omitempty" json:"patientAvatar,omitempty"`
	MealPlanTitle string `bson:"mealPlanTitle,omitempty" json:"mealPlanTitle,omitempty"`
}

// NutritionistRatingStats estatísticas de avaliação de um nutricionista
type NutritionistRatingStats struct {
	AverageRating float64         `json:"averageRating"`
	TotalReviews  int64           `json:"totalReviews"`
	Distribution  map[int]int64   `json:"distribution"` // 1-5 estrelas
}

// ============================================
// CRIAR REVIEW
// ============================================

// CreateReview cria uma nova avaliação
func CreateReview(ctx context.Context, review *models.Review) (*models.Review, error) {
	// Validar rating
	if review.Rating < 1 || review.Rating > 5 {
		return nil, ErrInvalidRating
	}

	// Verificar se não está avaliando a si mesmo
	if review.NutritionistID == review.PatientID {
		return nil, ErrCannotReviewSelf
	}

	// Verificar se nutricionista existe
	var nutritionist models.User
	err := database.UsersCollection.FindOne(ctx, bson.M{
		"_id":  review.NutritionistID,
		"role": models.RoleNutricionista,
	}).Decode(&nutritionist)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNutritionistNotFound
		}
		return nil, err
	}

	// Verificar se já existe avaliação do mesmo paciente para este nutricionista
	existingFilter := bson.M{
		"nutritionistId": review.NutritionistID,
		"patientId":      review.PatientID,
	}
	count, err := database.ReviewsCollection.CountDocuments(ctx, existingFilter)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrAlreadyReviewed
	}

	// VALIDAÇÃO: Exigir plano alimentar concluído para permitir avaliação
	if review.MealPlanID == nil {
		return nil, errors.New("é necessário ter um plano alimentar concluído para avaliar o nutricionista")
	}

	// Verificar se o plano alimentar existe e está concluído
	var mealPlan models.MealPlan
	err = database.MealPlansCollection.FindOne(ctx, bson.M{
		"_id":           review.MealPlanID,
		"patientId":    review.PatientID,
		"nutritionistId": review.NutritionistID,
	}).Decode(&mealPlan)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("plano alimentar não encontrado ou você não tem permissão para avaliar este plano")
		}
		return nil, err
	}

	// Verificar se o plano está concluído
	if mealPlan.Status != models.MealPlanStatusCompleted {
		return nil, errors.New("apenas planos alimentares concluídos podem ser avaliados")
	}

	// Definir timestamps
	now := time.Now()
	review.ID = primitive.NewObjectID()
	review.CreatedAt = now
	review.UpdatedAt = now
	review.Helpful = 0
	review.Verified = true // Marcar como verificado já que o projeto está concluído

	// Inserir review
	_, err = database.ReviewsCollection.InsertOne(ctx, review)
	if err != nil {
		return nil, err
	}

	// Atualizar média de avaliação do nutricionista (assíncrono seria melhor)
	go updateNutritionistRating(context.Background(), review.NutritionistID.Hex())

	return review, nil
}

// ============================================
// LISTAR REVIEWS
// ============================================

// GetReviewsByNutritionist retorna avaliações de um nutricionista
func GetReviewsByNutritionist(ctx context.Context, nutritionistID string, page, limit int) ([]ReviewWithDetails, int64, error) {
	nutritionistObjID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, 0, err
	}

	// Contar total
	filter := bson.M{"nutritionistId": nutritionistObjID}
	total, err := database.ReviewsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Pipeline para obter reviews com detalhes do paciente
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$sort", Value: bson.M{"createdAt": -1}}},
		{{Key: "$skip", Value: int64((page - 1) * limit)}},
		{{Key: "$limit", Value: int64(limit)}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "patientId",
			"foreignField": "_id",
			"as":           "patient",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$patient",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "meal_plans",
			"localField":   "mealPlanId",
			"foreignField": "_id",
			"as":           "mealPlan",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$mealPlan",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$addFields", Value: bson.M{
			"patientName":   "$patient.name",
			"patientAvatar": "$patient.avatar",
			"mealPlanTitle": "$mealPlan.title",
		}}},
		{{Key: "$project", Value: bson.M{
			"patient":  0,
			"mealPlan": 0,
		}}},
	}

	cursor, err := database.ReviewsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var reviews []ReviewWithDetails
	if err := cursor.All(ctx, &reviews); err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// GetMyReviews lista avaliações feitas pelo usuário autenticado.
// Para pacientes: reviews criadas pelo paciente. Para nutricionistas: reviews recebidas.
func GetMyReviews(ctx context.Context, userID string, page, limit int) ([]ReviewWithDetails, int64, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	// Descobrir role do usuário
	var u models.User
	_ = database.UsersCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&u)

	filter := bson.M{}
	if u.Role == models.RoleNutricionista {
		filter["nutritionistId"] = userObjID
	} else {
		filter["patientId"] = userObjID
	}

	total, err := database.ReviewsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$sort", Value: bson.M{"createdAt": -1}}},
		{{Key: "$skip", Value: int64((page - 1) * limit)}},
		{{Key: "$limit", Value: int64(limit)}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "patientId",
			"foreignField": "_id",
			"as":           "patient",
		}}},
		{{Key: "$unwind", Value: bson.M{"path": "$patient", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "nutritionistId",
			"foreignField": "_id",
			"as":           "nutritionist",
		}}},
		{{Key: "$unwind", Value: bson.M{"path": "$nutritionist", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "meal_plans",
			"localField":   "mealPlanId",
			"foreignField": "_id",
			"as":           "mealPlan",
		}}},
		{{Key: "$unwind", Value: bson.M{"path": "$mealPlan", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$addFields", Value: bson.M{
			"patientName":   "$patient.name",
			"patientAvatar": "$patient.avatar",
			"mealPlanTitle": "$mealPlan.title",
		}}},
		{{Key: "$project", Value: bson.M{
			"patient":      0,
			"nutritionist": 0,
			"mealPlan":     0,
		}}},
	}

	cursor, err := database.ReviewsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var reviews []ReviewWithDetails
	if err := cursor.All(ctx, &reviews); err != nil {
		return nil, 0, err
	}
	return reviews, total, nil
}

// GetReviewByID obtém uma avaliação por ID
func GetReviewByID(ctx context.Context, reviewID string) (*models.Review, error) {
	objID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		return nil, err
	}

	var review models.Review
	err = database.ReviewsCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&review)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrReviewNotFound
		}
		return nil, err
	}

	return &review, nil
}

// ============================================
// ATUALIZAR REVIEW
// ============================================

// UpdateReview atualiza uma avaliação (apenas pelo autor)
func UpdateReview(ctx context.Context, reviewID, patientID string, updates *models.Review) (*models.Review, error) {
	objID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		return nil, err
	}
	patientObjID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	// Validar rating se fornecido
	if updates.Rating != 0 && (updates.Rating < 1 || updates.Rating > 5) {
		return nil, ErrInvalidRating
	}

	// Verificar se o usuário é o autor
	filter := bson.M{
		"_id":       objID,
		"patientId": patientObjID,
	}

	updateFields := bson.M{
		"updatedAt": time.Now(),
	}

	if updates.Rating != 0 {
		updateFields["rating"] = updates.Rating
	}
	if updates.Comment != "" {
		updateFields["comment"] = updates.Comment
	}

	var review models.Review
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	err = database.ReviewsCollection.FindOneAndUpdate(
		ctx,
		filter,
		bson.M{"$set": updateFields},
		opts,
	).Decode(&review)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	// Atualizar média de avaliação do nutricionista
	go updateNutritionistRating(context.Background(), review.NutritionistID.Hex())

	return &review, nil
}

// ============================================
// DELETAR REVIEW
// ============================================

// DeleteReview remove uma avaliação
func DeleteReview(ctx context.Context, reviewID, patientID string) error {
	objID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		return err
	}
	patientObjID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return err
	}

	// Obter review para saber o nutricionista
	var review models.Review
	err = database.ReviewsCollection.FindOne(ctx, bson.M{
		"_id":       objID,
		"patientId": patientObjID,
	}).Decode(&review)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrUnauthorized
		}
		return err
	}

	// Deletar
	_, err = database.ReviewsCollection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		return err
	}

	// Atualizar média de avaliação do nutricionista
	go updateNutritionistRating(context.Background(), review.NutritionistID.Hex())

	return nil
}

// ============================================
// ESTATÍSTICAS
// ============================================

// GetNutritionistRatingStats retorna estatísticas de avaliação de um nutricionista
func GetNutritionistRatingStats(ctx context.Context, nutritionistID string) (*NutritionistRatingStats, error) {
	nutritionistObjID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	// Pipeline para calcular estatísticas
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"nutritionistId": nutritionistObjID}}},
		{{Key: "$group", Value: bson.M{
			"_id":       nil,
			"avgRating": bson.M{"$avg": "$rating"},
			"total":     bson.M{"$sum": 1},
			"rating1":   bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$rating", 1}}, 1, 0}}},
			"rating2":   bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$rating", 2}}, 1, 0}}},
			"rating3":   bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$rating", 3}}, 1, 0}}},
			"rating4":   bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$rating", 4}}, 1, 0}}},
			"rating5":   bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$rating", 5}}, 1, 0}}},
		}}},
	}

	cursor, err := database.ReviewsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	stats := &NutritionistRatingStats{
		Distribution: make(map[int]int64),
	}

	if cursor.Next(ctx) {
		var result struct {
			AvgRating float64 `bson:"avgRating"`
			Total     int64   `bson:"total"`
			Rating1   int64   `bson:"rating1"`
			Rating2   int64   `bson:"rating2"`
			Rating3   int64   `bson:"rating3"`
			Rating4   int64   `bson:"rating4"`
			Rating5   int64   `bson:"rating5"`
		}
		if err := cursor.Decode(&result); err == nil {
			stats.AverageRating = result.AvgRating
			stats.TotalReviews = result.Total
			stats.Distribution[1] = result.Rating1
			stats.Distribution[2] = result.Rating2
			stats.Distribution[3] = result.Rating3
			stats.Distribution[4] = result.Rating4
			stats.Distribution[5] = result.Rating5
		}
	}

	return stats, nil
}

// ============================================
// MARCAR COMO ÚTIL
// ============================================

// MarkReviewHelpful incrementa o contador de útil
func MarkReviewHelpful(ctx context.Context, reviewID string) error {
	objID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		return err
	}

	_, err = database.ReviewsCollection.UpdateByID(ctx, objID, bson.M{
		"$inc": bson.M{"helpful": 1},
	})
	return err
}

// ============================================
// HELPERS
// ============================================

// updateNutritionistRating atualiza a média de avaliação no perfil público do nutricionista
func updateNutritionistRating(ctx context.Context, nutritionistID string) {
	nutritionistObjID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return
	}

	stats, err := GetNutritionistRatingStats(ctx, nutritionistID)
	if err != nil {
		return
	}

	// Atualizar no perfil público
	_, _ = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": nutritionistObjID},
		bson.M{"$set": bson.M{
			"ratings.average": stats.AverageRating,
			"ratings.total":   stats.TotalReviews,
			"reviewsCount":    stats.TotalReviews,
			"updatedAt":      time.Now(),
		}},
	)
}


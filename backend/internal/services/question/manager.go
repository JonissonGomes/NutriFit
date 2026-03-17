package question

import (
	"context"
	"errors"
	"math"
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
	ErrQuestionNotFound     = errors.New("pergunta não encontrada")
	ErrAnswerNotFound       = errors.New("resposta não encontrada")
	ErrUnauthorized         = errors.New("não autorizado")
	ErrAlreadyMarkedHelpful = errors.New("você já marcou esta resposta como útil")
	ErrCannotAnswerOwn      = errors.New("você não pode responder sua própria pergunta")
)

// ============================================
// FUNÇÕES DE PERGUNTAS
// ============================================

// ListQuestions lista perguntas com filtros
func ListQuestions(ctx context.Context, filters models.QuestionFilters) (*models.QuestionListResponse, error) {
	filter := bson.M{}

	if filters.Category != "" {
		filter["category"] = filters.Category
	}

	if filters.Status != "" {
		filter["status"] = filters.Status
	}

	if filters.ArchitectID != "" {
		if oid, err := primitive.ObjectIDFromHex(filters.ArchitectID); err == nil {
			filter["architectId"] = oid
		}
	}

	if filters.ClientID != "" {
		if oid, err := primitive.ObjectIDFromHex(filters.ClientID); err == nil {
			filter["clientId"] = oid
		}
	}

	if filters.Featured != nil {
		filter["featured"] = *filters.Featured
	}

	if filters.Search != "" {
		filter["$or"] = []bson.M{
			{"title": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"content": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"tags": bson.M{"$regex": filters.Search, "$options": "i"}},
		}
	}

	// Contagem total
	total, err := database.QuestionsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	// Paginação
	page := filters.Page
	if page < 1 {
		page = 1
	}
	limit := filters.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	skip := (page - 1) * limit

	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := database.QuestionsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var questions []models.Question
	if err := cursor.All(ctx, &questions); err != nil {
		return nil, err
	}

	if questions == nil {
		questions = []models.Question{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return &models.QuestionListResponse{
		Data:       questions,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// CreateQuestion cria uma nova pergunta
func CreateQuestion(ctx context.Context, userID, userName string, req models.CreateQuestionRequest) (*models.Question, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	question := &models.Question{
		ID:          primitive.NewObjectID(),
		ClientID:    userOID,
		ClientName:  userName,
		Title:       req.Title,
		Content:     req.Content,
		Category:    req.Category,
		Tags:        req.Tags,
		Answers:     []models.Answer{},
		AnswerCount: 0,
		Status:      models.QuestionStatusOpen,
		Views:       0,
		Featured:    false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Se direcionada a um nutricionista específico
	if req.ArchitectID != "" {
		architectOID, err := primitive.ObjectIDFromHex(req.ArchitectID)
		if err == nil {
			question.ArchitectID = &architectOID
		}
	}

	_, err = database.QuestionsCollection.InsertOne(ctx, question)
	if err != nil {
		return nil, err
	}

	return question, nil
}

// GetQuestionByID busca uma pergunta por ID e incrementa views
func GetQuestionByID(ctx context.Context, id string) (*models.Question, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	update := bson.M{
		"$inc": bson.M{"views": 1},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var question models.Question
	err = database.QuestionsCollection.FindOneAndUpdate(ctx, bson.M{"_id": oid}, update, opts).Decode(&question)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}

	return &question, nil
}

// UpdateQuestion atualiza uma pergunta
func UpdateQuestion(ctx context.Context, questionID, userID string, req models.CreateQuestionRequest) (*models.Question, error) {
	questionOID, err := primitive.ObjectIDFromHex(questionID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar se o usuário é o autor
	var question models.Question
	err = database.QuestionsCollection.FindOne(ctx, bson.M{"_id": questionOID}).Decode(&question)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}

	if question.ClientID != userOID {
		return nil, ErrUnauthorized
	}

	update := bson.M{
		"$set": bson.M{
			"title":     req.Title,
			"content":   req.Content,
			"category":  req.Category,
			"tags":      req.Tags,
			"updatedAt": time.Now(),
		},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedQuestion models.Question
	err = database.QuestionsCollection.FindOneAndUpdate(ctx, bson.M{"_id": questionOID}, update, opts).Decode(&updatedQuestion)
	if err != nil {
		return nil, err
	}

	return &updatedQuestion, nil
}

// DeleteQuestion deleta uma pergunta
func DeleteQuestion(ctx context.Context, questionID, userID string, isAdmin bool) error {
	questionOID, err := primitive.ObjectIDFromHex(questionID)
	if err != nil {
		return err
	}

	// Verificar se o usuário é o autor (se não for admin)
	if !isAdmin {
		userOID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			return err
		}

		var question models.Question
		err = database.QuestionsCollection.FindOne(ctx, bson.M{"_id": questionOID}).Decode(&question)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return ErrQuestionNotFound
			}
			return err
		}

		if question.ClientID != userOID {
			return ErrUnauthorized
		}
	}

	_, err = database.QuestionsCollection.DeleteOne(ctx, bson.M{"_id": questionOID})
	return err
}

// CloseQuestion fecha uma pergunta
func CloseQuestion(ctx context.Context, questionID, userID string) (*models.Question, error) {
	questionOID, err := primitive.ObjectIDFromHex(questionID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar se o usuário é o autor
	var question models.Question
	err = database.QuestionsCollection.FindOne(ctx, bson.M{"_id": questionOID}).Decode(&question)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}

	if question.ClientID != userOID {
		return nil, ErrUnauthorized
	}

	update := bson.M{
		"$set": bson.M{
			"status":    models.QuestionStatusClosed,
			"updatedAt": time.Now(),
		},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedQuestion models.Question
	err = database.QuestionsCollection.FindOneAndUpdate(ctx, bson.M{"_id": questionOID}, update, opts).Decode(&updatedQuestion)
	if err != nil {
		return nil, err
	}

	return &updatedQuestion, nil
}

// AddAnswer adiciona uma resposta a uma pergunta
func AddAnswer(ctx context.Context, questionID, architectID, architectName, architectAvatar, content string) (*models.Question, error) {
	questionOID, err := primitive.ObjectIDFromHex(questionID)
	if err != nil {
		return nil, err
	}

	architectOID, err := primitive.ObjectIDFromHex(architectID)
	if err != nil {
		return nil, err
	}

	// Verificar se a pergunta existe e se o usuário não é o autor
	var question models.Question
	err = database.QuestionsCollection.FindOne(ctx, bson.M{"_id": questionOID}).Decode(&question)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}

	if question.ClientID == architectOID {
		return nil, ErrCannotAnswerOwn
	}

	answer := models.Answer{
		ID:              primitive.NewObjectID(),
		ArchitectID:     architectOID,
		ArchitectName:   architectName,
		ArchitectAvatar: architectAvatar,
		Content:         content,
		Helpful:         0,
		HelpfulBy:       []primitive.ObjectID{},
		IsBestAnswer:    false,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	update := bson.M{
		"$push": bson.M{"answers": answer},
		"$inc":  bson.M{"answerCount": 1},
		"$set": bson.M{
			"status":    models.QuestionStatusAnswered,
			"updatedAt": time.Now(),
		},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedQuestion models.Question
	err = database.QuestionsCollection.FindOneAndUpdate(ctx, bson.M{"_id": questionOID}, update, opts).Decode(&updatedQuestion)
	if err != nil {
		return nil, err
	}

	return &updatedQuestion, nil
}

// MarkBestAnswer marca uma resposta como a melhor
func MarkBestAnswer(ctx context.Context, questionID, answerID, userID string) (*models.Question, error) {
	questionOID, err := primitive.ObjectIDFromHex(questionID)
	if err != nil {
		return nil, err
	}

	answerOID, err := primitive.ObjectIDFromHex(answerID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar se o usuário é o autor da pergunta
	var question models.Question
	err = database.QuestionsCollection.FindOne(ctx, bson.M{"_id": questionOID}).Decode(&question)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}

	if question.ClientID != userOID {
		return nil, ErrUnauthorized
	}

	// Primeiro, remover a marcação de melhor resposta de todas as respostas
	_, err = database.QuestionsCollection.UpdateOne(ctx,
		bson.M{"_id": questionOID},
		bson.M{"$set": bson.M{"answers.$[].isBestAnswer": false}},
	)
	if err != nil {
		return nil, err
	}

	// Marcar a resposta específica como melhor
	update := bson.M{
		"$set": bson.M{
			"answers.$[elem].isBestAnswer": true,
			"updatedAt":                    time.Now(),
		},
	}

	arrayFilters := options.ArrayFilters{
		Filters: []interface{}{
			bson.M{"elem._id": answerOID},
		},
	}

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After).
		SetArrayFilters(arrayFilters)

	var updatedQuestion models.Question
	err = database.QuestionsCollection.FindOneAndUpdate(ctx, bson.M{"_id": questionOID}, update, opts).Decode(&updatedQuestion)
	if err != nil {
		return nil, err
	}

	return &updatedQuestion, nil
}

// MarkAnswerHelpful marca uma resposta como útil
func MarkAnswerHelpful(ctx context.Context, questionID, answerID, userID string) (*models.Question, error) {
	questionOID, err := primitive.ObjectIDFromHex(questionID)
	if err != nil {
		return nil, err
	}

	answerOID, err := primitive.ObjectIDFromHex(answerID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar se o usuário já marcou como útil
	var question models.Question
	err = database.QuestionsCollection.FindOne(ctx, bson.M{"_id": questionOID}).Decode(&question)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrQuestionNotFound
		}
		return nil, err
	}

	for _, answer := range question.Answers {
		if answer.ID == answerOID {
			for _, helpfulUserID := range answer.HelpfulBy {
				if helpfulUserID == userOID {
					return nil, ErrAlreadyMarkedHelpful
				}
			}
			break
		}
	}

	update := bson.M{
		"$inc":  bson.M{"answers.$[elem].helpful": 1},
		"$push": bson.M{"answers.$[elem].helpfulBy": userOID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	arrayFilters := options.ArrayFilters{
		Filters: []interface{}{
			bson.M{"elem._id": answerOID},
		},
	}

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After).
		SetArrayFilters(arrayFilters)

	var updatedQuestion models.Question
	err = database.QuestionsCollection.FindOneAndUpdate(ctx, bson.M{"_id": questionOID}, update, opts).Decode(&updatedQuestion)
	if err != nil {
		return nil, err
	}

	return &updatedQuestion, nil
}

// GetQuestionStats retorna estatísticas de perguntas
func GetQuestionStats(ctx context.Context, userID string) (*models.QuestionStats, error) {
	stats := &models.QuestionStats{}

	// Total de perguntas
	total, err := database.QuestionsCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	stats.TotalQuestions = total

	// Total respondidas
	answered, err := database.QuestionsCollection.CountDocuments(ctx, bson.M{"status": models.QuestionStatusAnswered})
	if err != nil {
		return nil, err
	}
	stats.TotalAnswered = answered

	// Total abertas
	open, err := database.QuestionsCollection.CountDocuments(ctx, bson.M{"status": models.QuestionStatusOpen})
	if err != nil {
		return nil, err
	}
	stats.TotalOpen = open

	// Estatísticas do usuário específico
	if userID != "" {
		userOID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			myQuestions, err := database.QuestionsCollection.CountDocuments(ctx, bson.M{"clientId": userOID})
			if err == nil {
				stats.MyQuestions = myQuestions
			}

			// Contar respostas do usuário
			pipeline := []bson.M{
				{"$unwind": "$answers"},
				{"$match": bson.M{"answers.architectId": userOID}},
				{"$count": "total"},
			}
			cursor, err := database.QuestionsCollection.Aggregate(ctx, pipeline)
			if err == nil {
				var result []bson.M
				if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
					if t, ok := result[0]["total"].(int32); ok {
						stats.MyAnswers = int64(t)
					}
				}
			}
		}
	}

	return stats, nil
}

// GetPopularQuestions retorna as perguntas mais populares
func GetPopularQuestions(ctx context.Context, limit int) ([]models.Question, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}

	opts := options.Find().
		SetSort(bson.D{
			{Key: "views", Value: -1},
			{Key: "answerCount", Value: -1},
		}).
		SetLimit(int64(limit))

	cursor, err := database.QuestionsCollection.Find(ctx, bson.M{"status": bson.M{"$ne": models.QuestionStatusClosed}}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var questions []models.Question
	if err := cursor.All(ctx, &questions); err != nil {
		return nil, err
	}

	if questions == nil {
		questions = []models.Question{}
	}

	return questions, nil
}

// GetQuestionsByArchitect retorna perguntas respondidas por um nutricionista (nome mantido por compatibilidade)
func GetQuestionsByArchitect(ctx context.Context, architectID string, limit int) ([]models.Question, error) {
	architectOID, err := primitive.ObjectIDFromHex(architectID)
	if err != nil {
		return nil, err
	}

	if limit < 1 || limit > 50 {
		limit = 10
	}

	filter := bson.M{
		"answers.architectId": architectOID,
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "updatedAt", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := database.QuestionsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var questions []models.Question
	if err := cursor.All(ctx, &questions); err != nil {
		return nil, err
	}

	if questions == nil {
		questions = []models.Question{}
	}

	return questions, nil
}

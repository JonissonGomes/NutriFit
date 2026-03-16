package event

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
	ErrEventNotFound = errors.New("evento não encontrado")
	ErrUnauthorized  = errors.New("sem permissão para acessar este evento")
	ErrInvalidData   = errors.New("dados inválidos")
)

// ============================================
// CRUD DE EVENTOS
// ============================================

// CreateEvent cria um novo evento
func CreateEvent(ctx context.Context, evt *models.Event) (*models.Event, error) {
	evt.ID = primitive.NewObjectID()
	evt.Status = models.EventStatusPendente
	evt.CreatedAt = time.Now()
	evt.UpdatedAt = time.Now()

	_, err := database.EventsCollection.InsertOne(ctx, evt)
	if err != nil {
		return nil, err
	}

	return evt, nil
}

// GetEventByID retorna um evento pelo ID
func GetEventByID(ctx context.Context, eventID, userID string) (*models.Event, error) {
	evtObjID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, ErrInvalidData
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Buscar evento do arquiteto ou onde o usuário é cliente
	filter := bson.M{
		"_id": evtObjID,
		"$or": []bson.M{
			{"userId": userObjID},
			{"clientId": userObjID},
		},
	}

	var event models.Event
	err = database.EventsCollection.FindOne(ctx, filter).Decode(&event)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrEventNotFound
		}
		return nil, err
	}

	return &event, nil
}

// GetEventsByUser retorna eventos de um usuário com filtros
func GetEventsByUser(ctx context.Context, userID string, filters EventFilters) ([]*models.Event, int64, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, ErrInvalidData
	}

	// Filtro base: eventos do usuário ou onde é cliente
	filter := bson.M{
		"$or": []bson.M{
			{"userId": userObjID},
			{"clientId": userObjID},
		},
	}

	// Aplicar filtros adicionais
	if filters.Status != "" {
		filter["status"] = filters.Status
	}
	if filters.Type != "" {
		filter["type"] = filters.Type
	}
	if !filters.StartDate.IsZero() {
		filter["date"] = bson.M{"$gte": filters.StartDate}
	}
	if !filters.EndDate.IsZero() {
		if filter["date"] == nil {
			filter["date"] = bson.M{}
		}
		filter["date"].(bson.M)["$lte"] = filters.EndDate
	}

	// Contar total
	total, err := database.EventsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Buscar com paginação
	skip := int64((filters.Page - 1) * filters.Limit)
	findOptions := options.Find().
		SetSort(bson.D{{Key: "date", Value: 1}, {Key: "time", Value: 1}}).
		SetSkip(skip).
		SetLimit(int64(filters.Limit))

	cursor, err := database.EventsCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var events []*models.Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

// EventFilters define os filtros de busca de eventos
type EventFilters struct {
	Status    string
	Type      string
	StartDate time.Time
	EndDate   time.Time
	Page      int
	Limit     int
}

// GetUpcomingEvents retorna os próximos eventos
func GetUpcomingEvents(ctx context.Context, userID string, limit int) ([]*models.Event, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	now := time.Now()

	filter := bson.M{
		"$or": []bson.M{
			{"userId": userObjID},
			{"clientId": userObjID},
		},
		"date": bson.M{"$gte": now},
		"status": bson.M{"$nin": []string{
			string(models.EventStatusCancelado),
			string(models.EventStatusConcluido),
		}},
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "date", Value: 1}, {Key: "time", Value: 1}}).
		SetLimit(int64(limit))

	cursor, err := database.EventsCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*models.Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}

	return events, nil
}

// UpdateEvent atualiza um evento
func UpdateEvent(ctx context.Context, eventID, userID string, updates map[string]interface{}) (*models.Event, error) {
	evtObjID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, ErrInvalidData
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Verificar se o evento pertence ao usuário
	var existingEvent models.Event
	err = database.EventsCollection.FindOne(ctx, bson.M{
		"_id":    evtObjID,
		"userId": userObjID,
	}).Decode(&existingEvent)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrEventNotFound
		}
		return nil, err
	}

	// Preparar atualização
	updates["updatedAt"] = time.Now()
	update := bson.M{"$set": updates}

	_, err = database.EventsCollection.UpdateByID(ctx, evtObjID, update)
	if err != nil {
		return nil, err
	}

	// Retornar evento atualizado
	return GetEventByID(ctx, eventID, userID)
}

// UpdateEventStatus atualiza apenas o status de um evento
func UpdateEventStatus(ctx context.Context, eventID, userID string, newStatus models.EventStatus) (*models.Event, error) {
	updates := map[string]interface{}{
		"status": newStatus,
	}
	return UpdateEvent(ctx, eventID, userID, updates)
}

// DeleteEvent remove um evento
func DeleteEvent(ctx context.Context, eventID, userID string) error {
	evtObjID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return ErrInvalidData
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	result, err := database.EventsCollection.DeleteOne(ctx, bson.M{
		"_id":    evtObjID,
		"userId": userObjID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrEventNotFound
	}

	return nil
}

// ============================================
// ESTATÍSTICAS
// ============================================

// EventStats representa estatísticas de eventos
type EventStats struct {
	Total       int64            `json:"total"`
	Upcoming    int64            `json:"upcoming"`
	Completed   int64            `json:"completed"`
	Cancelled   int64            `json:"cancelled"`
	ByType      map[string]int64 `json:"byType"`
	ByStatus    map[string]int64 `json:"byStatus"`
	ThisWeek    int64            `json:"thisWeek"`
	ThisMonth   int64            `json:"thisMonth"`
}

// GetEventStats retorna estatísticas dos eventos
func GetEventStats(ctx context.Context, userID string) (*EventStats, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	now := time.Now()
	weekLater := now.AddDate(0, 0, 7)
	monthLater := now.AddDate(0, 1, 0)

	baseFilter := bson.M{
		"$or": []bson.M{
			{"userId": userObjID},
			{"clientId": userObjID},
		},
	}

	stats := &EventStats{
		ByType:   make(map[string]int64),
		ByStatus: make(map[string]int64),
	}

	// Total
	total, _ := database.EventsCollection.CountDocuments(ctx, baseFilter)
	stats.Total = total

	// Upcoming
	upcomingFilter := bson.M{
		"$or":  baseFilter["$or"],
		"date": bson.M{"$gte": now},
		"status": bson.M{"$nin": []string{
			string(models.EventStatusCancelado),
			string(models.EventStatusConcluido),
		}},
	}
	stats.Upcoming, _ = database.EventsCollection.CountDocuments(ctx, upcomingFilter)

	// Completed
	completedFilter := bson.M{
		"$or":    baseFilter["$or"],
		"status": models.EventStatusConcluido,
	}
	stats.Completed, _ = database.EventsCollection.CountDocuments(ctx, completedFilter)

	// Cancelled
	cancelledFilter := bson.M{
		"$or":    baseFilter["$or"],
		"status": models.EventStatusCancelado,
	}
	stats.Cancelled, _ = database.EventsCollection.CountDocuments(ctx, cancelledFilter)

	// This week
	thisWeekFilter := bson.M{
		"$or": baseFilter["$or"],
		"date": bson.M{
			"$gte": now,
			"$lte": weekLater,
		},
	}
	stats.ThisWeek, _ = database.EventsCollection.CountDocuments(ctx, thisWeekFilter)

	// This month
	thisMonthFilter := bson.M{
		"$or": baseFilter["$or"],
		"date": bson.M{
			"$gte": now,
			"$lte": monthLater,
		},
	}
	stats.ThisMonth, _ = database.EventsCollection.CountDocuments(ctx, thisMonthFilter)

	// By type (agregação)
	typePipeline := []bson.M{
		{"$match": baseFilter},
		{"$group": bson.M{"_id": "$type", "count": bson.M{"$sum": 1}}},
	}
	typeCursor, _ := database.EventsCollection.Aggregate(ctx, typePipeline)
	if typeCursor != nil {
		defer typeCursor.Close(ctx)
		for typeCursor.Next(ctx) {
			var result struct {
				ID    string `bson:"_id"`
				Count int64  `bson:"count"`
			}
			if typeCursor.Decode(&result) == nil && result.ID != "" {
				stats.ByType[result.ID] = result.Count
			}
		}
	}

	// By status (agregação)
	statusPipeline := []bson.M{
		{"$match": baseFilter},
		{"$group": bson.M{"_id": "$status", "count": bson.M{"$sum": 1}}},
	}
	statusCursor, _ := database.EventsCollection.Aggregate(ctx, statusPipeline)
	if statusCursor != nil {
		defer statusCursor.Close(ctx)
		for statusCursor.Next(ctx) {
			var result struct {
				ID    string `bson:"_id"`
				Count int64  `bson:"count"`
			}
			if statusCursor.Decode(&result) == nil && result.ID != "" {
				stats.ByStatus[result.ID] = result.Count
			}
		}
	}

	return stats, nil
}




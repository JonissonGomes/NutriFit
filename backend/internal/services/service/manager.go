package service

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
	ErrServiceNotFound = errors.New("serviço não encontrado")
	ErrUnauthorized    = errors.New("sem permissão para acessar este serviço")
	ErrInvalidData     = errors.New("dados inválidos")
)

// ============================================
// CRUD DE SERVIÇOS
// ============================================

// CreateService cria um novo serviço para o nutricionista
func CreateService(ctx context.Context, svc *models.Service) (*models.Service, error) {
	svc.ID = primitive.NewObjectID()
	svc.Active = true
	svc.CreatedAt = time.Now()
	svc.UpdatedAt = time.Now()

	_, err := database.ServicesCollection.InsertOne(ctx, svc)
	if err != nil {
		return nil, err
	}

	return svc, nil
}

// GetServiceByID retorna um serviço pelo ID
func GetServiceByID(ctx context.Context, serviceID, userID string) (*models.Service, error) {
	svcObjID, err := primitive.ObjectIDFromHex(serviceID)
	if err != nil {
		return nil, ErrInvalidData
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	var service models.Service
	err = database.ServicesCollection.FindOne(ctx, bson.M{
		"_id":    svcObjID,
		"userId": userObjID,
	}).Decode(&service)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrServiceNotFound
		}
		return nil, err
	}

	return &service, nil
}

// GetServicesByUser retorna todos os serviços de um nutricionista
func GetServicesByUser(ctx context.Context, userID string, activeOnly bool, page, limit int) ([]*models.Service, int64, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, ErrInvalidData
	}

	filter := bson.M{"userId": userObjID}
	if activeOnly {
		filter["active"] = true
	}

	// Contar total
	total, err := database.ServicesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Buscar com paginação
	skip := int64((page - 1) * limit)
	findOptions := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := database.ServicesCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var services []*models.Service
	if err = cursor.All(ctx, &services); err != nil {
		return nil, 0, err
	}

	return services, total, nil
}

// UpdateService atualiza um serviço existente
func UpdateService(ctx context.Context, serviceID, userID string, updates map[string]interface{}) (*models.Service, error) {
	svcObjID, err := primitive.ObjectIDFromHex(serviceID)
	if err != nil {
		return nil, ErrInvalidData
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Verificar se o serviço pertence ao usuário
	var existingService models.Service
	err = database.ServicesCollection.FindOne(ctx, bson.M{
		"_id":    svcObjID,
		"userId": userObjID,
	}).Decode(&existingService)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrServiceNotFound
		}
		return nil, err
	}

	// Preparar atualização
	updates["updatedAt"] = time.Now()
	update := bson.M{"$set": updates}

	_, err = database.ServicesCollection.UpdateByID(ctx, svcObjID, update)
	if err != nil {
		return nil, err
	}

	// Retornar serviço atualizado
	return GetServiceByID(ctx, serviceID, userID)
}

// DeleteService remove um serviço
func DeleteService(ctx context.Context, serviceID, userID string) error {
	svcObjID, err := primitive.ObjectIDFromHex(serviceID)
	if err != nil {
		return ErrInvalidData
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidData
	}

	result, err := database.ServicesCollection.DeleteOne(ctx, bson.M{
		"_id":    svcObjID,
		"userId": userObjID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrServiceNotFound
	}

	return nil
}

// ToggleServiceActive ativa/desativa um serviço
func ToggleServiceActive(ctx context.Context, serviceID, userID string) (*models.Service, error) {
	service, err := GetServiceByID(ctx, serviceID, userID)
	if err != nil {
		return nil, err
	}

	// Inverter status
	newActive := !service.Active
	updates := map[string]interface{}{
		"active": newActive,
	}

	return UpdateService(ctx, serviceID, userID, updates)
}

// ============================================
// ESTATÍSTICAS
// ============================================

// ServiceStats representa estatísticas de serviços
type ServiceStats struct {
	Total       int64   `json:"total"`
	Active      int64   `json:"active"`
	Inactive    int64   `json:"inactive"`
	AvgPrice    float64 `json:"avgPrice"`
	TotalValue  float64 `json:"totalValue"`
	ByCategory  map[string]int64 `json:"byCategory"`
}

// GetServiceStats retorna estatísticas dos serviços do nutricionista
func GetServiceStats(ctx context.Context, userID string) (*ServiceStats, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidData
	}

	// Pipeline de agregação
	pipeline := []bson.M{
		{"$match": bson.M{"userId": userObjID}},
		{"$group": bson.M{
			"_id":        nil,
			"total":      bson.M{"$sum": 1},
			"active":     bson.M{"$sum": bson.M{"$cond": []interface{}{"$active", 1, 0}}},
			"inactive":   bson.M{"$sum": bson.M{"$cond": []interface{}{"$active", 0, 1}}},
			"avgPrice":   bson.M{"$avg": "$price"},
			"totalValue": bson.M{"$sum": "$price"},
		}},
	}

	cursor, err := database.ServicesCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	stats := &ServiceStats{
		ByCategory: make(map[string]int64),
	}

	if cursor.Next(ctx) {
		var result struct {
			Total      int64   `bson:"total"`
			Active     int64   `bson:"active"`
			Inactive   int64   `bson:"inactive"`
			AvgPrice   float64 `bson:"avgPrice"`
			TotalValue float64 `bson:"totalValue"`
		}
		if err := cursor.Decode(&result); err == nil {
			stats.Total = result.Total
			stats.Active = result.Active
			stats.Inactive = result.Inactive
			stats.AvgPrice = result.AvgPrice
			stats.TotalValue = result.TotalValue
		}
	}

	// Estatísticas por categoria
	categoryPipeline := []bson.M{
		{"$match": bson.M{"userId": userObjID}},
		{"$group": bson.M{
			"_id":   "$category",
			"count": bson.M{"$sum": 1},
		}},
	}

	catCursor, err := database.ServicesCollection.Aggregate(ctx, categoryPipeline)
	if err != nil {
		return stats, nil // Retorna stats parciais
	}
	defer catCursor.Close(ctx)

	for catCursor.Next(ctx) {
		var catResult struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := catCursor.Decode(&catResult); err == nil && catResult.ID != "" {
			stats.ByCategory[catResult.ID] = catResult.Count
		}
	}

	return stats, nil
}

// ============================================
// SERVIÇOS PÚBLICOS (para pacientes)
// ============================================

// GetPublicServicesByNutritionist retorna serviços ativos de um nutricionista (visão pública)
func GetPublicServicesByNutritionist(ctx context.Context, nutritionistID string) ([]*models.Service, error) {
	nutritionistObjID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, ErrInvalidData
	}

	filter := bson.M{
		"userId": nutritionistObjID,
		"active": true,
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "price", Value: 1}}).
		SetProjection(bson.M{
			"userId": 0, // Não expor userId na visão pública
		})

	cursor, err := database.ServicesCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var services []*models.Service
	if err = cursor.All(ctx, &services); err != nil {
		return nil, err
	}

	return services, nil
}




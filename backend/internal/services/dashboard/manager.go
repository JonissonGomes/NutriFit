package dashboard

import (
	"context"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/cache"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============================================
// TIPOS DE RESPOSTA
// ============================================

// ArchitectStats estatísticas do dashboard do arquiteto
type ArchitectStats struct {
	TotalViews       int64   `json:"totalViews"`
	TotalProjects    int64   `json:"totalProjects"`
	TotalClients     int64   `json:"totalClients"`
	MonthlyRevenue   float64 `json:"monthlyRevenue"`
	ViewsChange      float64 `json:"viewsChange"`      // Percentual de mudança
	ProjectsChange   float64 `json:"projectsChange"`
	ClientsChange    float64 `json:"clientsChange"`
	RevenueChange    float64 `json:"revenueChange"`
	ActiveProjects   int64   `json:"activeProjects"`
	PendingEvents    int64   `json:"pendingEvents"`
	UnreadMessages   int64   `json:"unreadMessages"`
	TotalServices    int64   `json:"totalServices"`
	ActiveServices   int64   `json:"activeServices"`
}

// RecentProject projeto recente para o dashboard
type RecentProject struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	CoverImage  string    `json:"coverImage,omitempty"`
	Views       int       `json:"views"`
	FilesCount  int       `json:"filesCount"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// UpcomingEvent evento próximo para o dashboard
type UpcomingEvent struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Date       time.Time `json:"date"`
	Time       string    `json:"time"`
	Type       string    `json:"type"`
	Status     string    `json:"status"`
	Location   string    `json:"location"`
	ClientName string    `json:"clientName,omitempty"`
}

// ClientStats estatísticas do dashboard do cliente
type ClientStats struct {
	ActiveProjects     int64 `json:"activeProjects"`
	FavoriteArchitects int64 `json:"favoriteArchitects"`
	UpcomingMeetings   int64 `json:"upcomingMeetings"`
	CompletedProjects  int64 `json:"completedProjects"`
	TotalMessages      int64 `json:"totalMessages"`
	UnreadMessages     int64 `json:"unreadMessages"`
}

// ClientProject projeto do cliente para o dashboard
type ClientProject struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Status        string    `json:"status"`
	ArchitectName string    `json:"architectName,omitempty"`
	CoverImage    string    `json:"coverImage,omitempty"`
	Progress      int       `json:"progress"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// ============================================
// DASHBOARD DO ARQUITETO
// ============================================

// GetArchitectStats retorna estatísticas do arquiteto
func GetArchitectStats(ctx context.Context, userID string) (*ArchitectStats, error) {
	// Tentar obter do cache primeiro
	cacheKey := cache.DashboardStatsKey("architect:" + userID)
	var cachedStats ArchitectStats
	if err := cache.Get(ctx, cacheKey, &cachedStats); err == nil {
		return &cachedStats, nil
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	stats := &ArchitectStats{}

	// Total de projetos
	stats.TotalProjects, _ = database.ProjectsCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
	})

	// Projetos ativos (published)
	stats.ActiveProjects, _ = database.ProjectsCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
		"status": "published",
	})

	// Total de visualizações (soma de views de todos os projetos)
	viewsPipeline := []bson.M{
		{"$match": bson.M{"userId": userObjID}},
		{"$group": bson.M{"_id": nil, "totalViews": bson.M{"$sum": "$views"}}},
	}
	viewsCursor, err := database.ProjectsCollection.Aggregate(ctx, viewsPipeline)
	if err == nil {
		defer viewsCursor.Close(ctx)
		if viewsCursor.Next(ctx) {
			var result struct {
				TotalViews int64 `bson:"totalViews"`
			}
			if viewsCursor.Decode(&result) == nil {
				stats.TotalViews = result.TotalViews
			}
		}
	}

	// Clientes únicos (projetos com clientId)
	clientsPipeline := []bson.M{
		{"$match": bson.M{"userId": userObjID, "clientId": bson.M{"$exists": true, "$ne": nil}}},
		{"$group": bson.M{"_id": "$clientId"}},
		{"$count": "total"},
	}
	clientsCursor, err := database.ProjectsCollection.Aggregate(ctx, clientsPipeline)
	if err == nil {
		defer clientsCursor.Close(ctx)
		if clientsCursor.Next(ctx) {
			var result struct {
				Total int64 `bson:"total"`
			}
			if clientsCursor.Decode(&result) == nil {
				stats.TotalClients = result.Total
			}
		}
	}

	// Eventos pendentes
	now := time.Now()
	stats.PendingEvents, _ = database.EventsCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
		"date":   bson.M{"$gte": now},
		"status": bson.M{"$nin": []string{"cancelado", "concluido"}},
	})

	// Mensagens não lidas
	unreadPipeline := []bson.M{
		{"$match": bson.M{"participants": userObjID}},
		{"$project": bson.M{"unread": "$unreadCount." + userID}},
		{"$group": bson.M{"_id": nil, "total": bson.M{"$sum": "$unread"}}},
	}
	unreadCursor, err := database.ConversationsCollection.Aggregate(ctx, unreadPipeline)
	if err == nil {
		defer unreadCursor.Close(ctx)
		if unreadCursor.Next(ctx) {
			var result struct {
				Total int64 `bson:"total"`
			}
			if unreadCursor.Decode(&result) == nil {
				stats.UnreadMessages = result.Total
			}
		}
	}

	// Serviços
	stats.TotalServices, _ = database.ServicesCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
	})
	stats.ActiveServices, _ = database.ServicesCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
		"active": true,
	})

	// TODO: Calcular mudanças percentuais (requer histórico)
	// Por enquanto, valores placeholder
	stats.ViewsChange = 0
	stats.ProjectsChange = 0
	stats.ClientsChange = 0
	stats.RevenueChange = 0
	stats.MonthlyRevenue = 0

	// Salvar no cache
	_ = cache.Set(ctx, cacheKey, stats, cache.TTLMedium)

	return stats, nil
}

// GetRecentProjects retorna projetos recentes do arquiteto
func GetRecentProjects(ctx context.Context, userID string, limit int) ([]*RecentProject, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "updatedAt", Value: -1}}).
		SetLimit(int64(limit)).
		SetProjection(bson.M{
			"_id":        1,
			"title":      1,
			"status":     1,
			"coverImage": 1,
			"views":      1,
			"filesCount": 1,
			"updatedAt":  1,
		})

	cursor, err := database.ProjectsCollection.Find(ctx, bson.M{"userId": userObjID}, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []*RecentProject
	for cursor.Next(ctx) {
		var p models.Project
		if err := cursor.Decode(&p); err != nil {
			continue
		}
		projects = append(projects, &RecentProject{
			ID:         p.ID.Hex(),
			Title:      p.Title,
			Status:     string(p.Status),
			CoverImage: p.CoverImage,
			Views:      p.Views,
			FilesCount: p.FilesCount,
			UpdatedAt:  p.UpdatedAt,
		})
	}

	return projects, nil
}

// GetUpcomingEvents retorna eventos próximos do arquiteto
func GetUpcomingEvents(ctx context.Context, userID string, limit int) ([]*UpcomingEvent, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
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

	var events []*UpcomingEvent
	for cursor.Next(ctx) {
		var e models.Event
		if err := cursor.Decode(&e); err != nil {
			continue
		}
		events = append(events, &UpcomingEvent{
			ID:       e.ID.Hex(),
			Title:    e.Title,
			Date:     e.Date,
			Time:     e.Time,
			Type:     string(e.Type),
			Status:   string(e.Status),
			Location: string(e.Location),
		})
	}

	return events, nil
}

// ============================================
// ALIASES NUTRICIONISTA (mesma lógica, cache/nomenclatura)
// ============================================

// RecentMealPlan resumo de plano alimentar para o dashboard do nutricionista.
type RecentMealPlan struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Status     string    `json:"status"`
	Category   string    `json:"category"`
	PatientID  string    `json:"patientId,omitempty"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// GetNutritionistStats retorna estatísticas do nutricionista (planos alimentares e pacientes).
func GetNutritionistStats(ctx context.Context, userID string) (*ArchitectStats, error) {
	cacheKey := cache.DashboardStatsKey("nutritionist:" + userID)
	var cachedStats ArchitectStats
	if err := cache.Get(ctx, cacheKey, &cachedStats); err == nil {
		return &cachedStats, nil
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	stats := &ArchitectStats{}

	// Total de planos alimentares
	stats.TotalProjects, _ = database.MealPlansCollection.CountDocuments(ctx, bson.M{
		"nutritionistId": userObjID,
	})
	stats.ActiveProjects, _ = database.MealPlansCollection.CountDocuments(ctx, bson.M{
		"nutritionistId": userObjID,
		"status":        bson.M{"$in": []string{string(models.MealPlanStatusActive), string(models.MealPlanStatusDraft)}},
	})

	// Total de pacientes (coleção patients)
	stats.TotalClients, _ = database.PatientsCollection.CountDocuments(ctx, bson.M{
		"nutritionistId": userObjID,
	})

	stats.TotalViews = 0 // planos alimentares não têm views por padrão

	now := time.Now()
	stats.PendingEvents, _ = database.EventsCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
		"date":   bson.M{"$gte": now},
		"status": bson.M{"$nin": []string{"cancelado", "concluido"}},
	})

	unreadPipeline := []bson.M{
		{"$match": bson.M{"participants": userObjID}},
		{"$project": bson.M{"unread": "$unreadCount." + userID}},
		{"$group": bson.M{"_id": nil, "total": bson.M{"$sum": "$unread"}}},
	}
	unreadCursor, err := database.ConversationsCollection.Aggregate(ctx, unreadPipeline)
	if err == nil {
		defer unreadCursor.Close(ctx)
		if unreadCursor.Next(ctx) {
			var result struct {
				Total int64 `bson:"total"`
			}
			if unreadCursor.Decode(&result) == nil {
				stats.UnreadMessages = result.Total
			}
		}
	}

	stats.TotalServices, _ = database.ServicesCollection.CountDocuments(ctx, bson.M{
		"userId": userObjID,
	})
	stats.ActiveServices, _ = database.ServicesCollection.CountDocuments(ctx, bson.M{
		"userId":  userObjID,
		"active": true,
	})

	stats.ViewsChange = 0
	stats.ProjectsChange = 0
	stats.ClientsChange = 0
	stats.RevenueChange = 0
	stats.MonthlyRevenue = 0

	_ = cache.Set(ctx, cacheKey, stats, cache.TTLMedium)
	return stats, nil
}

// GetRecentMealPlans retorna planos alimentares recentes do nutricionista.
func GetRecentMealPlans(ctx context.Context, userID string, limit int) ([]*RecentMealPlan, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "updatedAt", Value: -1}}).
		SetLimit(int64(limit)).
		SetProjection(bson.M{
			"_id": 1, "title": 1, "status": 1, "category": 1, "patientId": 1, "updatedAt": 1,
		})

	cursor, err := database.MealPlansCollection.Find(ctx, bson.M{"nutritionistId": userObjID}, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []*RecentMealPlan
	for cursor.Next(ctx) {
		var mp models.MealPlan
		if err := cursor.Decode(&mp); err != nil {
			continue
		}
		pid := ""
		if mp.PatientID != nil {
			pid = mp.PatientID.Hex()
		}
		list = append(list, &RecentMealPlan{
			ID:        mp.ID.Hex(),
			Title:     mp.Title,
			Status:    string(mp.Status),
			Category:  string(mp.Category),
			PatientID: pid,
			UpdatedAt: mp.UpdatedAt,
		})
	}
	return list, nil
}

// ============================================
// DASHBOARD DO CLIENTE / PACIENTE
// ============================================

// GetClientStats retorna estatísticas do cliente
func GetClientStats(ctx context.Context, userID string) (*ClientStats, error) {
	// Tentar obter do cache primeiro
	cacheKey := cache.DashboardStatsKey("client:" + userID)
	var cachedStats ClientStats
	if err := cache.Get(ctx, cacheKey, &cachedStats); err == nil {
		return &cachedStats, nil
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	stats := &ClientStats{}

	// Projetos ativos (onde o usuário é cliente)
	stats.ActiveProjects, _ = database.ProjectsCollection.CountDocuments(ctx, bson.M{
		"clientId": userObjID,
		"status":   bson.M{"$ne": "archived"},
	})

	// Projetos concluídos
	stats.CompletedProjects, _ = database.ProjectsCollection.CountDocuments(ctx, bson.M{
		"clientId":      userObjID,
		"projectStatus": "concluido",
	})

	// Arquitetos favoritos
	stats.FavoriteArchitects, _ = database.FavoritesCollection.CountDocuments(ctx, bson.M{
		"clientId": userObjID,
	})

	// Reuniões próximas
	now := time.Now()
	stats.UpcomingMeetings, _ = database.EventsCollection.CountDocuments(ctx, bson.M{
		"clientId": userObjID,
		"date":     bson.M{"$gte": now},
		"status":   bson.M{"$nin": []string{"cancelado", "concluido"}},
	})

	// Mensagens não lidas
	unreadPipeline := []bson.M{
		{"$match": bson.M{"participants": userObjID}},
		{"$project": bson.M{"unread": "$unreadCount." + userID}},
		{"$group": bson.M{"_id": nil, "total": bson.M{"$sum": "$unread"}}},
	}
	unreadCursor, err := database.ConversationsCollection.Aggregate(ctx, unreadPipeline)
	if err == nil {
		defer unreadCursor.Close(ctx)
		if unreadCursor.Next(ctx) {
			var result struct {
				Total int64 `bson:"total"`
			}
			if unreadCursor.Decode(&result) == nil {
				stats.UnreadMessages = result.Total
			}
		}
	}

	// Salvar no cache
	_ = cache.Set(ctx, cacheKey, stats, cache.TTLMedium)

	return stats, nil
}

// GetClientProjects retorna projetos do cliente
func GetClientProjects(ctx context.Context, userID string, limit int) ([]*ClientProject, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Pipeline com lookup para nome do arquiteto
	pipeline := []bson.M{
		{"$match": bson.M{"clientId": userObjID}},
		{"$sort": bson.M{"updatedAt": -1}},
		{"$limit": limit},
		{"$lookup": bson.M{
			"from":         "users",
			"localField":   "userId",
			"foreignField": "_id",
			"as":           "architect",
		}},
		{"$unwind": bson.M{
			"path":                       "$architect",
			"preserveNullAndEmptyArrays": true,
		}},
		{"$project": bson.M{
			"_id":           1,
			"title":         1,
			"status":        1,
			"projectStatus": 1,
			"coverImage":    1,
			"updatedAt":     1,
			"architectName": "$architect.name",
		}},
	}

	cursor, err := database.ProjectsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []*ClientProject
	for cursor.Next(ctx) {
		var result struct {
			ID            primitive.ObjectID `bson:"_id"`
			Title         string             `bson:"title"`
			Status        string             `bson:"status"`
			ProjectStatus string             `bson:"projectStatus"`
			CoverImage    string             `bson:"coverImage"`
			UpdatedAt     time.Time          `bson:"updatedAt"`
			ArchitectName string             `bson:"architectName"`
		}

		if err := cursor.Decode(&result); err != nil {
			continue
		}

		// Calcular progresso baseado no status
		progress := calculateProgress(result.ProjectStatus)

		projects = append(projects, &ClientProject{
			ID:            result.ID.Hex(),
			Title:         result.Title,
			Status:        result.ProjectStatus,
			ArchitectName: result.ArchitectName,
			CoverImage:    result.CoverImage,
			Progress:      progress,
			UpdatedAt:     result.UpdatedAt,
		})
	}

	return projects, nil
}

// calculateProgress calcula o progresso baseado no status
func calculateProgress(status string) int {
	switch status {
	case "em-andamento":
		return 50
	case "revisao":
		return 70
	case "aprovado":
		return 90
	case "concluido":
		return 100
	default:
		return 25
	}
}

// GetClientAppointments retorna agendamentos do cliente
func GetClientAppointments(ctx context.Context, userID string, limit int) ([]*UpcomingEvent, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	filter := bson.M{
		"clientId": userObjID,
		"date":     bson.M{"$gte": now},
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "date", Value: 1}, {Key: "time", Value: 1}}).
		SetLimit(int64(limit))

	cursor, err := database.EventsCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*UpcomingEvent
	for cursor.Next(ctx) {
		var e models.Event
		if err := cursor.Decode(&e); err != nil {
			continue
		}
		events = append(events, &UpcomingEvent{
			ID:       e.ID.Hex(),
			Title:    e.Title,
			Date:     e.Date,
			Time:     e.Time,
			Type:     string(e.Type),
			Status:   string(e.Status),
			Location: string(e.Location),
		})
	}

	return events, nil
}

// GetPatientStats retorna estatísticas do paciente (cache key "patient", usa meal plans).
func GetPatientStats(ctx context.Context, userID string) (*ClientStats, error) {
	cacheKey := cache.DashboardStatsKey("patient:" + userID)
	var cachedStats ClientStats
	if err := cache.Get(ctx, cacheKey, &cachedStats); err == nil {
		return &cachedStats, nil
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	stats := &ClientStats{}

	stats.ActiveProjects, _ = database.MealPlansCollection.CountDocuments(ctx, bson.M{
		"patientId": userObjID,
		"status":    bson.M{"$in": []string{string(models.MealPlanStatusActive), string(models.MealPlanStatusDraft)}},
	})
	stats.CompletedProjects, _ = database.MealPlansCollection.CountDocuments(ctx, bson.M{
		"patientId": userObjID,
		"status":    string(models.MealPlanStatusCompleted),
	})

	stats.FavoriteArchitects, _ = database.FavoritesCollection.CountDocuments(ctx, bson.M{
		"clientId": userObjID,
	})

	now := time.Now()
	stats.UpcomingMeetings, _ = database.EventsCollection.CountDocuments(ctx, bson.M{
		"clientId": userObjID,
		"date":     bson.M{"$gte": now},
		"status":   bson.M{"$nin": []string{"cancelado", "concluido"}},
	})

	unreadPipeline := []bson.M{
		{"$match": bson.M{"participants": userObjID}},
		{"$project": bson.M{"unread": "$unreadCount." + userID}},
		{"$group": bson.M{"_id": nil, "total": bson.M{"$sum": "$unread"}}},
	}
	unreadCursor, err := database.ConversationsCollection.Aggregate(ctx, unreadPipeline)
	if err == nil {
		defer unreadCursor.Close(ctx)
		if unreadCursor.Next(ctx) {
			var result struct {
				Total int64 `bson:"total"`
			}
			if unreadCursor.Decode(&result) == nil {
				stats.UnreadMessages = result.Total
			}
		}
	}
	stats.TotalMessages = 0

	_ = cache.Set(ctx, cacheKey, stats, cache.TTLMedium)
	return stats, nil
}

// GetPatientMealPlans retorna planos alimentares do paciente.
func GetPatientMealPlans(ctx context.Context, userID string, limit int) ([]*RecentMealPlan, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find().
		SetSort(bson.D{{Key: "updatedAt", Value: -1}}).
		SetLimit(int64(limit)).
		SetProjection(bson.M{
			"_id": 1, "title": 1, "status": 1, "category": 1, "updatedAt": 1,
		})

	cursor, err := database.MealPlansCollection.Find(ctx, bson.M{"patientId": userObjID}, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var list []*RecentMealPlan
	for cursor.Next(ctx) {
		var mp models.MealPlan
		if err := cursor.Decode(&mp); err != nil {
			continue
		}
		list = append(list, &RecentMealPlan{
			ID:        mp.ID.Hex(),
			Title:     mp.Title,
			Status:    string(mp.Status),
			Category:  string(mp.Category),
			UpdatedAt: mp.UpdatedAt,
		})
	}
	return list, nil
}

// GetPatientAppointments retorna agendamentos do paciente (alias de GetClientAppointments).
func GetPatientAppointments(ctx context.Context, userID string, limit int) ([]*UpcomingEvent, error) {
	return GetClientAppointments(ctx, userID, limit)
}


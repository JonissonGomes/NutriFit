package analytics

import (
	"context"
	"errors"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ============================================
// ERROS
// ============================================

var (
	ErrInvalidUserID = errors.New("ID de usuário inválido")
	ErrInvalidPeriod = errors.New("período inválido")
)

// ============================================
// FUNÇÕES DE ANALYTICS
// ============================================

// TrackEvent registra um evento de analytics
func TrackEvent(ctx context.Context, event *models.AnalyticsEvent) error {
	event.ID = primitive.NewObjectID()
	event.CreatedAt = time.Now()

	_, err := database.AnalyticsCollection.InsertOne(ctx, event)
	return err
}

// GetOverview retorna uma visão geral de analytics para um usuário
func GetOverview(ctx context.Context, userID string, startDate, endDate time.Time) (*models.AnalyticsOverview, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidUserID
	}

	overview := &models.AnalyticsOverview{
		SourceBreakdown:   []models.SourceStat{},
		DeviceBreakdown:   []models.DeviceStat{},
		TopProjects:       []models.ProjectAnalytics{},
		LocationBreakdown: []models.LocationStat{},
		DailyTrend:        []models.DailyAnalyticsStat{},
	}

	baseFilter := bson.M{
		"userId": userOID,
		"createdAt": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	// Total de visualizações de perfil
	profileViews, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"userId":    userOID,
		"eventType": models.AnalyticsEventProfileView,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err == nil {
		overview.TotalProfileViews = profileViews
	}

	// Total de visualizações de projeto
	projectViews, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"userId":    userOID,
		"eventType": models.AnalyticsEventProjectView,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err == nil {
		overview.TotalProjectViews = projectViews
	}

	// Total de cliques no contato
	contactClicks, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"userId":    userOID,
		"eventType": models.AnalyticsEventContactClick,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err == nil {
		overview.TotalContactClicks = contactClicks
	}

	// Visitantes únicos
	pipeline := []bson.M{
		{"$match": baseFilter},
		{"$group": bson.M{"_id": "$visitorId"}},
		{"$count": "total"},
	}
	cursor, err := database.AnalyticsCollection.Aggregate(ctx, pipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if total, ok := result[0]["total"].(int32); ok {
				overview.TotalUniqueVisitors = int64(total)
			}
		}
	}

	// Favoritos adicionados
	favorites, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"userId":    userOID,
		"eventType": models.AnalyticsEventFavoriteAdd,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err == nil {
		overview.TotalFavorites = favorites
	}

	// Mensagens recebidas
	messages, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"userId":    userOID,
		"eventType": models.AnalyticsEventMessageSent,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err == nil {
		overview.TotalMessages = messages
	}

	// Aparições em busca
	searchAppears, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"userId":    userOID,
		"eventType": models.AnalyticsEventSearchAppearance,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err == nil {
		overview.SearchAppearances = searchAppears
	}

	// Taxa de engajamento
	totalViews := overview.TotalProfileViews + overview.TotalProjectViews
	totalEngagements := overview.TotalContactClicks + overview.TotalMessages
	if totalViews > 0 {
		overview.EngagementRate = float64(totalEngagements) / float64(totalViews) * 100
	}

	// Breakdown por fonte
	overview.SourceBreakdown = getSourceBreakdown(ctx, userOID, startDate, endDate)

	// Breakdown por dispositivo
	overview.DeviceBreakdown = getDeviceBreakdown(ctx, userOID, startDate, endDate)

	// Breakdown por localização
	overview.LocationBreakdown = getLocationBreakdown(ctx, userOID, startDate, endDate)

	// Top projetos
	overview.TopProjects = getTopProjects(ctx, userOID, startDate, endDate)

	// Tendência diária
	overview.DailyTrend = getDailyTrend(ctx, userOID, startDate, endDate)

	return overview, nil
}

// getSourceBreakdown retorna o breakdown por fonte de tráfego
func getSourceBreakdown(ctx context.Context, userOID primitive.ObjectID, startDate, endDate time.Time) []models.SourceStat {
	pipeline := []bson.M{
		{"$match": bson.M{
			"userId":    userOID,
			"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
		}},
		{"$group": bson.M{
			"_id":   "$source",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.D{{Key: "count", Value: -1}}},
	}

	cursor, err := database.AnalyticsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return []models.SourceStat{}
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return []models.SourceStat{}
	}

	var total int64
	for _, r := range results {
		if count, ok := r["count"].(int32); ok {
			total += int64(count)
		}
	}

	stats := make([]models.SourceStat, 0, len(results))
	for _, r := range results {
		source := models.AnalyticsSourceDirect
		if s, ok := r["_id"].(string); ok {
			source = models.AnalyticsSource(s)
		}
		var count int64
		if c, ok := r["count"].(int32); ok {
			count = int64(c)
		}
		percent := 0.0
		if total > 0 {
			percent = float64(count) / float64(total) * 100
		}
		stats = append(stats, models.SourceStat{
			Source:  source,
			Count:   count,
			Percent: percent,
		})
	}

	return stats
}

// getDeviceBreakdown retorna o breakdown por dispositivo
func getDeviceBreakdown(ctx context.Context, userOID primitive.ObjectID, startDate, endDate time.Time) []models.DeviceStat {
	pipeline := []bson.M{
		{"$match": bson.M{
			"userId":    userOID,
			"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
		}},
		{"$group": bson.M{
			"_id":   "$deviceType",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.D{{Key: "count", Value: -1}}},
	}

	cursor, err := database.AnalyticsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return []models.DeviceStat{}
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return []models.DeviceStat{}
	}

	var total int64
	for _, r := range results {
		if count, ok := r["count"].(int32); ok {
			total += int64(count)
		}
	}

	stats := make([]models.DeviceStat, 0, len(results))
	for _, r := range results {
		device := "unknown"
		if d, ok := r["_id"].(string); ok && d != "" {
			device = d
		}
		var count int64
		if c, ok := r["count"].(int32); ok {
			count = int64(c)
		}
		percent := 0.0
		if total > 0 {
			percent = float64(count) / float64(total) * 100
		}
		stats = append(stats, models.DeviceStat{
			Device:  device,
			Count:   count,
			Percent: percent,
		})
	}

	return stats
}

// getLocationBreakdown retorna o breakdown por localização
func getLocationBreakdown(ctx context.Context, userOID primitive.ObjectID, startDate, endDate time.Time) []models.LocationStat {
	pipeline := []bson.M{
		{"$match": bson.M{
			"userId":    userOID,
			"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
		}},
		{"$group": bson.M{
			"_id":   bson.M{"country": "$country", "city": "$city"},
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.D{{Key: "count", Value: -1}}},
		{"$limit": 10},
	}

	cursor, err := database.AnalyticsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return []models.LocationStat{}
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return []models.LocationStat{}
	}

	var total int64
	for _, r := range results {
		if count, ok := r["count"].(int32); ok {
			total += int64(count)
		}
	}

	stats := make([]models.LocationStat, 0, len(results))
	for _, r := range results {
		country := "Unknown"
		city := ""
		if id, ok := r["_id"].(bson.M); ok {
			if c, ok := id["country"].(string); ok && c != "" {
				country = c
			}
			if ci, ok := id["city"].(string); ok {
				city = ci
			}
		}
		var count int64
		if c, ok := r["count"].(int32); ok {
			count = int64(c)
		}
		percent := 0.0
		if total > 0 {
			percent = float64(count) / float64(total) * 100
		}
		stats = append(stats, models.LocationStat{
			Country: country,
			City:    city,
			Count:   count,
			Percent: percent,
		})
	}

	return stats
}

// getTopProjects retorna os projetos mais visualizados
func getTopProjects(ctx context.Context, userOID primitive.ObjectID, startDate, endDate time.Time) []models.ProjectAnalytics {
	pipeline := []bson.M{
		{"$match": bson.M{
			"userId":    userOID,
			"eventType": models.AnalyticsEventProjectView,
			"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
		}},
		{"$group": bson.M{
			"_id":   "$targetId",
			"views": bson.M{"$sum": 1},
		}},
		{"$sort": bson.D{{Key: "views", Value: -1}}},
		{"$limit": 5},
	}

	cursor, err := database.AnalyticsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return []models.ProjectAnalytics{}
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return []models.ProjectAnalytics{}
	}

	projects := make([]models.ProjectAnalytics, 0, len(results))
	for _, r := range results {
		projectID := ""
		if id, ok := r["_id"].(string); ok {
			projectID = id
		}
		var views int64
		if v, ok := r["views"].(int32); ok {
			views = int64(v)
		}

		// Buscar título do projeto
		title := "Projeto"
		if oid, err := primitive.ObjectIDFromHex(projectID); err == nil {
			var project bson.M
			if err := database.ProjectsCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&project); err == nil {
				if t, ok := project["title"].(string); ok {
					title = t
				}
			}
		}

		projects = append(projects, models.ProjectAnalytics{
			ProjectID: projectID,
			Title:     title,
			Views:     views,
		})
	}

	return projects
}

// getDailyTrend retorna a tendência diária de analytics
func getDailyTrend(ctx context.Context, userOID primitive.ObjectID, startDate, endDate time.Time) []models.DailyAnalyticsStat {
	pipeline := []bson.M{
		{"$match": bson.M{
			"userId":    userOID,
			"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$createdAt"},
			},
			"profileViews": bson.M{
				"$sum": bson.M{
					"$cond": bson.A{
						bson.M{"$eq": bson.A{"$eventType", models.AnalyticsEventProfileView}},
						1, 0,
					},
				},
			},
			"projectViews": bson.M{
				"$sum": bson.M{
					"$cond": bson.A{
						bson.M{"$eq": bson.A{"$eventType", models.AnalyticsEventProjectView}},
						1, 0,
					},
				},
			},
			"contactClicks": bson.M{
				"$sum": bson.M{
					"$cond": bson.A{
						bson.M{"$eq": bson.A{"$eventType", models.AnalyticsEventContactClick}},
						1, 0,
					},
				},
			},
			"messages": bson.M{
				"$sum": bson.M{
					"$cond": bson.A{
						bson.M{"$eq": bson.A{"$eventType", models.AnalyticsEventMessageSent}},
						1, 0,
					},
				},
			},
		}},
		{"$sort": bson.D{{Key: "_id", Value: 1}}},
	}

	cursor, err := database.AnalyticsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return []models.DailyAnalyticsStat{}
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return []models.DailyAnalyticsStat{}
	}

	stats := make([]models.DailyAnalyticsStat, 0, len(results))
	for _, r := range results {
		date := ""
		if d, ok := r["_id"].(string); ok {
			date = d
		}
		var profileViews, projectViews, contactClicks, messages int64
		if v, ok := r["profileViews"].(int32); ok {
			profileViews = int64(v)
		}
		if v, ok := r["projectViews"].(int32); ok {
			projectViews = int64(v)
		}
		if v, ok := r["contactClicks"].(int32); ok {
			contactClicks = int64(v)
		}
		if v, ok := r["messages"].(int32); ok {
			messages = int64(v)
		}
		stats = append(stats, models.DailyAnalyticsStat{
			Date:          date,
			ProfileViews:  profileViews,
			ProjectViews:  projectViews,
			ContactClicks: contactClicks,
			Messages:      messages,
		})
	}

	return stats
}

// GetComparison retorna comparação entre dois períodos
func GetComparison(ctx context.Context, userID string, currentStart, currentEnd, previousStart, previousEnd time.Time) (*models.ComparisonStats, error) {
	current, err := GetOverview(ctx, userID, currentStart, currentEnd)
	if err != nil {
		return nil, err
	}

	previous, err := GetOverview(ctx, userID, previousStart, previousEnd)
	if err != nil {
		return nil, err
	}

	changes := models.PercentageChanges{}

	// Calcular mudanças percentuais
	changes.ProfileViews = calculatePercentChange(previous.TotalProfileViews, current.TotalProfileViews)
	changes.ProjectViews = calculatePercentChange(previous.TotalProjectViews, current.TotalProjectViews)
	changes.ContactClicks = calculatePercentChange(previous.TotalContactClicks, current.TotalContactClicks)
	changes.UniqueVisitors = calculatePercentChange(previous.TotalUniqueVisitors, current.TotalUniqueVisitors)
	changes.Favorites = calculatePercentChange(previous.TotalFavorites, current.TotalFavorites)
	changes.Messages = calculatePercentChange(previous.TotalMessages, current.TotalMessages)

	return &models.ComparisonStats{
		Current:  *current,
		Previous: *previous,
		Changes:  changes,
	}, nil
}

// calculatePercentChange calcula a mudança percentual entre dois valores
func calculatePercentChange(previous, current int64) float64 {
	if previous == 0 {
		if current > 0 {
			return 100.0
		}
		return 0.0
	}
	return (float64(current) - float64(previous)) / float64(previous) * 100
}

// GetProjectAnalytics retorna analytics detalhados de um projeto
func GetProjectAnalytics(ctx context.Context, projectID string, startDate, endDate time.Time) (*models.ProjectAnalytics, error) {
	projectOID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	// Buscar título do projeto
	var project bson.M
	err = database.ProjectsCollection.FindOne(ctx, bson.M{"_id": projectOID}).Decode(&project)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("projeto não encontrado")
		}
		return nil, err
	}

	title := "Projeto"
	if t, ok := project["title"].(string); ok {
		title = t
	}

	// Contar views
	views, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"targetId":  projectID,
		"eventType": models.AnalyticsEventProjectView,
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err != nil {
		views = 0
	}

	// Contar cliques (contato, website, etc relacionados ao projeto)
	clicks, err := database.AnalyticsCollection.CountDocuments(ctx, bson.M{
		"targetId": projectID,
		"eventType": bson.M{"$in": []models.AnalyticsEventType{
			models.AnalyticsEventContactClick,
			models.AnalyticsEventWebsiteClick,
		}},
		"createdAt": bson.M{"$gte": startDate, "$lte": endDate},
	})
	if err != nil {
		clicks = 0
	}

	return &models.ProjectAnalytics{
		ProjectID: projectID,
		Title:     title,
		Views:     views,
		Clicks:    clicks,
	}, nil
}


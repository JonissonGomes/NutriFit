package badge

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

// ============================================
// ERROS
// ============================================

var (
	ErrBadgeNotFound     = errors.New("badge não encontrado")
	ErrUserBadgeNotFound = errors.New("badge do usuário não encontrado")
	ErrBadgeAlreadyOwned = errors.New("usuário já possui este badge")
	ErrUnauthorized      = errors.New("não autorizado")
)

// ============================================
// FUNÇÕES DE BADGES
// ============================================

// GetAllBadgeDefinitions retorna todas as definições de badges
func GetAllBadgeDefinitions(ctx context.Context) ([]models.BadgeDefinition, error) {
	opts := options.Find().SetSort(bson.D{{Key: "level", Value: -1}, {Key: "points", Value: -1}})

	cursor, err := database.BadgesCollection.Find(ctx, bson.M{"isActive": true}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var badges []models.BadgeDefinition
	if err := cursor.All(ctx, &badges); err != nil {
		return nil, err
	}

	if badges == nil {
		badges = []models.BadgeDefinition{}
	}

	return badges, nil
}

// GetBadgeByID retorna um badge pelo ID
func GetBadgeByID(ctx context.Context, badgeID string) (*models.BadgeDefinition, error) {
	badgeOID, err := primitive.ObjectIDFromHex(badgeID)
	if err != nil {
		return nil, err
	}

	var badge models.BadgeDefinition
	err = database.BadgesCollection.FindOne(ctx, bson.M{"_id": badgeOID}).Decode(&badge)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrBadgeNotFound
		}
		return nil, err
	}

	return &badge, nil
}

// GetUserBadges retorna os badges de um usuário
func GetUserBadges(ctx context.Context, userID string) ([]models.UserBadge, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Buscar badges do usuário com informações do badge
	pipeline := []bson.M{
		{"$match": bson.M{"userId": userOID}},
		{"$lookup": bson.M{
			"from":         "badges",
			"localField":   "badgeId",
			"foreignField": "_id",
			"as":           "badgeInfo",
		}},
		{"$unwind": bson.M{
			"path":                       "$badgeInfo",
			"preserveNullAndEmptyArrays": true,
		}},
		{"$addFields": bson.M{
			"badge": "$badgeInfo",
		}},
		{"$project": bson.M{
			"badgeInfo": 0,
		}},
		{"$sort": bson.D{{Key: "displayOrder", Value: 1}, {Key: "awardedAt", Value: -1}}},
	}

	cursor, err := database.BadgesCollection.Aggregate(ctx, pipeline)
	if err != nil {
		// Fallback para busca simples
		cursor, err = database.BadgesCollection.Find(ctx, bson.M{"userId": userOID})
		if err != nil {
			return nil, err
		}
	}
	defer cursor.Close(ctx)

	var userBadges []models.UserBadge
	if err := cursor.All(ctx, &userBadges); err != nil {
		return nil, err
	}

	if userBadges == nil {
		userBadges = []models.UserBadge{}
	}

	return userBadges, nil
}

// GetUserBadgeSummary retorna um resumo dos badges de um usuário
func GetUserBadgeSummary(ctx context.Context, userID string) (*models.UserBadgeSummary, error) {
	badges, err := GetUserBadges(ctx, userID)
	if err != nil {
		return nil, err
	}

	summary := &models.UserBadgeSummary{
		TotalBadges: len(badges),
		TotalPoints: 0,
		Badges:      badges,
		Featured:    []models.UserBadge{},
		ByLevel:     make(map[models.BadgeLevel]int),
	}

	for _, ub := range badges {
		if ub.Badge != nil {
			summary.TotalPoints += ub.Badge.Points
			summary.ByLevel[ub.Badge.Level]++
		}
		if ub.IsDisplayed {
			summary.Featured = append(summary.Featured, ub)
		}
	}

	return summary, nil
}

// AwardBadge concede um badge a um usuário
func AwardBadge(ctx context.Context, userID, badgeID string, awardedBy *string, reason string) (*models.UserBadge, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	badgeOID, err := primitive.ObjectIDFromHex(badgeID)
	if err != nil {
		return nil, err
	}

	// Verificar se o badge existe
	var badge models.BadgeDefinition
	err = database.BadgesCollection.FindOne(ctx, bson.M{"_id": badgeOID}).Decode(&badge)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrBadgeNotFound
		}
		return nil, err
	}

	// Verificar se o usuário já possui o badge
	count, err := database.BadgesCollection.CountDocuments(ctx, bson.M{
		"userId":  userOID,
		"badgeId": badgeOID,
	})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrBadgeAlreadyOwned
	}

	userBadge := &models.UserBadge{
		ID:          primitive.NewObjectID(),
		UserID:      userOID,
		BadgeID:     badgeOID,
		Badge:       &badge,
		AwardedAt:   time.Now(),
		Reason:      reason,
		IsDisplayed: true, // Por padrão, novos badges são exibidos
		DisplayOrder: 0,
	}

	if awardedBy != nil {
		awardedByOID, err := primitive.ObjectIDFromHex(*awardedBy)
		if err == nil {
			userBadge.AwardedBy = &awardedByOID
		}
	}

	// Coleção de badges de usuários (user_badges) - armazenado na mesma collection
	_, err = database.BadgesCollection.InsertOne(ctx, userBadge)
	if err != nil {
		return nil, err
	}

	return userBadge, nil
}

// RevokeBadge remove um badge de um usuário
func RevokeBadge(ctx context.Context, userBadgeID, adminID string) error {
	userBadgeOID, err := primitive.ObjectIDFromHex(userBadgeID)
	if err != nil {
		return err
	}

	_, err = database.BadgesCollection.DeleteOne(ctx, bson.M{"_id": userBadgeOID, "userId": bson.M{"$exists": true}})
	return err
}

// UpdateBadgeDisplay atualiza a exibição de um badge
func UpdateBadgeDisplay(ctx context.Context, userBadgeID, userID string, isDisplayed bool, displayOrder int) error {
	userBadgeOID, err := primitive.ObjectIDFromHex(userBadgeID)
	if err != nil {
		return err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	result, err := database.BadgesCollection.UpdateOne(ctx,
		bson.M{"_id": userBadgeOID, "userId": userOID},
		bson.M{"$set": bson.M{
			"isDisplayed":  isDisplayed,
			"displayOrder": displayOrder,
		}},
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUserBadgeNotFound
	}

	return nil
}

// CheckAndAwardBadges verifica e concede badges automaticamente
func CheckAndAwardBadges(ctx context.Context, userID string) ([]models.UserBadge, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Buscar estatísticas do usuário
	stats, err := getUserStats(ctx, userOID)
	if err != nil {
		return nil, err
	}

	// Buscar badges existentes do usuário
	existingBadges, err := GetUserBadges(ctx, userID)
	if err != nil {
		return nil, err
	}

	existingBadgeIDs := make(map[primitive.ObjectID]bool)
	for _, ub := range existingBadges {
		existingBadgeIDs[ub.BadgeID] = true
	}

	// Buscar todas as definições de badges
	allBadges, err := GetAllBadgeDefinitions(ctx)
	if err != nil {
		return nil, err
	}

	var newBadges []models.UserBadge

	for _, badge := range allBadges {
		// Pular se já possui
		if existingBadgeIDs[badge.ID] {
			continue
		}

		// Verificar critérios
		if meetsCriteria(stats, badge.Criteria) {
			userBadge := &models.UserBadge{
				ID:           primitive.NewObjectID(),
				UserID:       userOID,
				BadgeID:      badge.ID,
				Badge:        &badge,
				AwardedAt:    time.Now(),
				Reason:       "Concedido automaticamente por atingir os critérios",
				IsDisplayed:  true,
				DisplayOrder: 0,
			}

			_, err := database.BadgesCollection.InsertOne(ctx, userBadge)
			if err == nil {
				newBadges = append(newBadges, *userBadge)
			}
		}
	}

	return newBadges, nil
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

type userStats struct {
	Projects      int
	Reviews       int
	AvgRating     float64
	Favorites     int
	Answers       int
	BestAnswers   int
	BlogPosts     int
	IsVerified    bool
	IsPremium     bool
	AvgResponseMin int
}

// getUserStats retorna estatísticas do usuário para verificar badges
func getUserStats(ctx context.Context, userOID primitive.ObjectID) (*userStats, error) {
	stats := &userStats{}

	// Contagem de projetos
	projects, err := database.ProjectsCollection.CountDocuments(ctx, bson.M{"userId": userOID, "isPublished": true})
	if err == nil {
		stats.Projects = int(projects)
	}

	// Contagem de reviews e média
	pipeline := []bson.M{
		{"$match": bson.M{"architectId": userOID}},
		{"$group": bson.M{
			"_id":       nil,
			"count":     bson.M{"$sum": 1},
			"avgRating": bson.M{"$avg": "$rating"},
		}},
	}
	cursor, err := database.ReviewsCollection.Aggregate(ctx, pipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if count, ok := result[0]["count"].(int32); ok {
				stats.Reviews = int(count)
			}
			if avg, ok := result[0]["avgRating"].(float64); ok {
				stats.AvgRating = avg
			}
		}
	}

	// Contagem de favoritos
	favorites, err := database.FavoritesCollection.CountDocuments(ctx, bson.M{"architectId": userOID})
	if err == nil {
		stats.Favorites = int(favorites)
	}

	// Contagem de respostas
	answersPipeline := []bson.M{
		{"$unwind": "$answers"},
		{"$match": bson.M{"answers.architectId": userOID}},
		{"$count": "total"},
	}
	cursor, err = database.QuestionsCollection.Aggregate(ctx, answersPipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if total, ok := result[0]["total"].(int32); ok {
				stats.Answers = int(total)
			}
		}
	}

	// Contagem de melhores respostas
	bestAnswersPipeline := []bson.M{
		{"$unwind": "$answers"},
		{"$match": bson.M{"answers.architectId": userOID, "answers.isBestAnswer": true}},
		{"$count": "total"},
	}
	cursor, err = database.QuestionsCollection.Aggregate(ctx, bestAnswersPipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if total, ok := result[0]["total"].(int32); ok {
				stats.BestAnswers = int(total)
			}
		}
	}

	// Contagem de posts de blog
	blogPosts, err := database.BlogPostsCollection.CountDocuments(ctx, bson.M{"authorId": userOID, "published": true})
	if err == nil {
		stats.BlogPosts = int(blogPosts)
	}

	// Verificar status de verificação
	var profile bson.M
	err = database.PublicProfilesCollection.FindOne(ctx, bson.M{"userId": userOID}).Decode(&profile)
	if err == nil {
		if verification, ok := profile["verification"].(bson.M); ok {
			if verified, ok := verification["verified"].(bool); ok {
				stats.IsVerified = verified
			}
		}
	}

	return stats, nil
}

// meetsCriteria verifica se as estatísticas atendem aos critérios do badge
func meetsCriteria(stats *userStats, criteria models.BadgeCriteria) bool {
	if criteria.MinProjects > 0 && stats.Projects < criteria.MinProjects {
		return false
	}
	if criteria.MinReviews > 0 && stats.Reviews < criteria.MinReviews {
		return false
	}
	if criteria.MinRating > 0 && stats.AvgRating < criteria.MinRating {
		return false
	}
	if criteria.MinFavorites > 0 && stats.Favorites < criteria.MinFavorites {
		return false
	}
	if criteria.MinAnswers > 0 && stats.Answers < criteria.MinAnswers {
		return false
	}
	if criteria.MinBestAnswers > 0 && stats.BestAnswers < criteria.MinBestAnswers {
		return false
	}
	if criteria.MinBlogPosts > 0 && stats.BlogPosts < criteria.MinBlogPosts {
		return false
	}
	if criteria.RequireVerified && !stats.IsVerified {
		return false
	}
	if criteria.RequirePremium && !stats.IsPremium {
		return false
	}

	return true
}

// InitializeBadgeDefinitions inicializa as definições de badges padrão
func InitializeBadgeDefinitions(ctx context.Context) error {
	// Verificar se já existem badges
	count, err := database.BadgesCollection.CountDocuments(ctx, bson.M{"type": bson.M{"$exists": true}, "userId": bson.M{"$exists": false}})
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Já inicializado
	}

	// Inserir badges padrão
	defaults := models.GetDefaultBadgeDefinitions()
	docs := make([]interface{}, len(defaults))
	for i, badge := range defaults {
		badge.ID = primitive.NewObjectID()
		badge.CreatedAt = time.Now()
		docs[i] = badge
	}

	_, err = database.BadgesCollection.InsertMany(ctx, docs)
	return err
}




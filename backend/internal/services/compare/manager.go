package compare

import (
	"context"
	"errors"

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
	ErrNutritionistNotFound = errors.New("nutricionista não encontrado")
	ErrTooManyNutritionists = errors.New("máximo de 4 nutricionistas para comparação")
	ErrMinNutritionists     = errors.New("mínimo de 2 nutricionistas para comparação")
)

// ============================================
// TIPOS
// ============================================

// NutritionistComparisonData representa os dados de um nutricionista para comparação
type NutritionistComparisonData struct {
	ID               string              `json:"id"`
	DisplayName      string              `json:"displayName"`
	Username         string              `json:"username"`
	AvatarURL        string              `json:"avatarURL,omitempty"`
	Bio              string              `json:"bio,omitempty"`
	Specialty        string              `json:"specialty,omitempty"`
	Specialties      []string            `json:"specialties,omitempty"`
	City             string              `json:"city,omitempty"`
	State            string              `json:"state,omitempty"`
	IsVerified       bool                `json:"isVerified"`
	MealPlansCount   int                 `json:"mealPlansCount"`
	ReviewsCount     int                 `json:"reviewsCount"`
	AverageRating    float64             `json:"averageRating"`
	FavoritesCount   int                 `json:"favoritesCount"`
	AnswersCount     int                 `json:"answersCount"`
	ResponseTime     string              `json:"responseTime,omitempty"` // "< 1h", "< 24h", etc
	YearsExperience  int                 `json:"yearsExperience,omitempty"`
	PriceRange       string              `json:"priceRange,omitempty"`
	MinPrice         float64             `json:"minPrice,omitempty"`
	MaxPrice         float64             `json:"maxPrice,omitempty"`
	ServicesCount    int                 `json:"servicesCount"`
	BadgesCount      int                 `json:"badgesCount"`
	TopBadges        []models.UserBadge  `json:"topBadges,omitempty"`
	PortfolioImages  []string            `json:"portfolioImages,omitempty"` // URLs das primeiras imagens do portfólio
	Social           *models.SocialLinks `json:"social,omitempty"`
	Website          string              `json:"website,omitempty"`
	Email            string              `json:"email,omitempty"`
	Phone            string              `json:"phone,omitempty"`
}

// ComparisonResult representa o resultado da comparação
type ComparisonResult struct {
	Nutritionists []NutritionistComparisonData `json:"nutritionists"`
	Metrics       ComparisonMetrics            `json:"metrics"`
}

// ComparisonMetrics representa métricas comparativas
type ComparisonMetrics struct {
	HighestRated     string  `json:"highestRated"`     // ID do mais bem avaliado
	MostMealPlans    string  `json:"mostMealPlans"`    // ID com mais planos alimentares
	MostReviews      string  `json:"mostReviews"`      // ID com mais reviews
	FastestResponse  string  `json:"fastestResponse"`  // ID com resposta mais rápida
	MostExperienced  string  `json:"mostExperienced"`  // ID com mais experiência
	BestValue        string  `json:"bestValue"`        // ID com melhor custo-benefício
	AverageRating    float64 `json:"averageRating"`    // Média geral
	AverageMealPlans float64 `json:"averageMealPlans"` // Média de planos alimentares
}

// ============================================
// FUNÇÕES
// ============================================

// CompareNutritionists compara múltiplos nutricionistas
func CompareNutritionists(ctx context.Context, nutritionistIDs []string) (*ComparisonResult, error) {
	if len(nutritionistIDs) < 2 {
		return nil, ErrMinNutritionists
	}
	if len(nutritionistIDs) > 4 {
		return nil, ErrTooManyNutritionists
	}

	nutritionists := make([]NutritionistComparisonData, 0, len(nutritionistIDs))

	for _, idStr := range nutritionistIDs {
		data, err := getNutritionistComparisonData(ctx, idStr)
		if err != nil {
			if errors.Is(err, ErrNutritionistNotFound) {
				continue // Pular nutricionistas não encontrados
			}
			return nil, err
		}
		nutritionists = append(nutritionists, *data)
	}

	if len(nutritionists) < 2 {
		return nil, ErrMinNutritionists
	}

	// Calcular métricas comparativas
	metrics := calculateComparisonMetrics(nutritionists)

	return &ComparisonResult{
		Nutritionists: nutritionists,
		Metrics:       metrics,
	}, nil
}

// getNutritionistComparisonData busca os dados de um nutricionista para comparação
func getNutritionistComparisonData(ctx context.Context, nutritionistID string) (*NutritionistComparisonData, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	// Buscar perfil público
	var profile models.PublicProfile
	err = database.PublicProfilesCollection.FindOne(ctx, bson.M{"userId": nutritionistOID}).Decode(&profile)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNutritionistNotFound
		}
		return nil, err
	}

	data := &NutritionistComparisonData{
		ID:          nutritionistID,
		DisplayName: profile.DisplayName,
		Username:    profile.Username,
		AvatarURL:   profile.Avatar,
		Bio:         profile.Bio,
		Specialty:   profile.Specialty,
		Specialties: profile.Specialties,
		Social:      profile.Social,
		Website:     profile.Website,
		Email:       profile.Email,
		Phone:       profile.Phone,
	}

	// Preencher localização se existir
	if profile.Location != nil && profile.Location.Address != nil {
		data.City = profile.Location.Address.City
		data.State = profile.Location.Address.State
	}

	// Preencher verificação se existir
	if profile.Verification != nil {
		data.IsVerified = profile.Verification.Verified
	}

	// Contar planos alimentares
	mealPlansCount, err := database.MealPlansCollection.CountDocuments(ctx, bson.M{
		"nutritionistId": nutritionistOID,
		"status":         bson.M{"$ne": "draft"},
	})
	if err == nil {
		data.MealPlansCount = int(mealPlansCount)
	}

	// Buscar reviews e calcular média
	reviewPipeline := []bson.M{
		{"$match": bson.M{"nutritionistId": nutritionistOID}},
		{"$group": bson.M{
			"_id":   nil,
			"count": bson.M{"$sum": 1},
			"avg":   bson.M{"$avg": "$rating"},
		}},
	}
	cursor, err := database.ReviewsCollection.Aggregate(ctx, reviewPipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if count, ok := result[0]["count"].(int32); ok {
				data.ReviewsCount = int(count)
			}
			if avg, ok := result[0]["avg"].(float64); ok {
				data.AverageRating = avg
			}
		}
	}

	// Contar favoritos
	favoritesCount, err := database.FavoritesCollection.CountDocuments(ctx, bson.M{
		"nutritionistId": nutritionistOID,
	})
	if err == nil {
		data.FavoritesCount = int(favoritesCount)
	}

	// Contar respostas
	answersPipeline := []bson.M{
		{"$unwind": "$answers"},
		{"$match": bson.M{"answers.nutritionistId": nutritionistOID}},
		{"$count": "total"},
	}
	cursor, err = database.QuestionsCollection.Aggregate(ctx, answersPipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if total, ok := result[0]["total"].(int32); ok {
				data.AnswersCount = int(total)
			}
		}
	}

	// Contar serviços
	servicesCount, err := database.ServicesCollection.CountDocuments(ctx, bson.M{
		"userId": nutritionistOID,
		"active": true,
	})
	if err == nil {
		data.ServicesCount = int(servicesCount)
	}

	// Buscar range de preços dos serviços
	pricePipeline := []bson.M{
		{"$match": bson.M{"userId": nutritionistOID, "active": true}},
		{"$group": bson.M{
			"_id":      nil,
			"minPrice": bson.M{"$min": "$price"},
			"maxPrice": bson.M{"$max": "$price"},
		}},
	}
	cursor, err = database.ServicesCollection.Aggregate(ctx, pricePipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			if minP, ok := result[0]["minPrice"].(float64); ok {
				data.MinPrice = minP
			}
			if maxP, ok := result[0]["maxPrice"].(float64); ok {
				data.MaxPrice = maxP
			}
			if data.MinPrice > 0 && data.MaxPrice > 0 {
				data.PriceRange = formatPriceRange(data.MinPrice, data.MaxPrice)
			}
		}
	}

	// Contar badges
	badgesCount, err := database.BadgesCollection.CountDocuments(ctx, bson.M{
		"userId": nutritionistOID,
	})
	if err == nil {
		data.BadgesCount = int(badgesCount)
	}

	return data, nil
}

// formatPriceRange formata o range de preços
func formatPriceRange(min, max float64) string {
	if min == max {
		return formatPrice(min)
	}
	return formatPrice(min) + " - " + formatPrice(max)
}

// formatPrice formata um preço
func formatPrice(price float64) string {
	if price >= 1000 {
		return "R$ " + formatNumber(price/1000) + "k"
	}
	return "R$ " + formatNumber(price)
}

// formatNumber formata um número
func formatNumber(n float64) string {
	if n == float64(int(n)) {
		return string(rune('0'+int(n)%10) + '0')
	}
	return string(rune('0'+int(n)%10) + '0')
}

// calculateComparisonMetrics calcula as métricas comparativas
func calculateComparisonMetrics(nutritionists []NutritionistComparisonData) ComparisonMetrics {
	metrics := ComparisonMetrics{}

	if len(nutritionists) == 0 {
		return metrics
	}

	highestRating := 0.0
	mostMealPlans := 0
	mostReviews := 0
	mostExperience := 0
	totalRating := 0.0
	totalMealPlans := 0

	for _, n := range nutritionists {
		if n.AverageRating > highestRating {
			highestRating = n.AverageRating
			metrics.HighestRated = n.ID
		}
		if n.MealPlansCount > mostMealPlans {
			mostMealPlans = n.MealPlansCount
			metrics.MostMealPlans = n.ID
		}
		if n.ReviewsCount > mostReviews {
			mostReviews = n.ReviewsCount
			metrics.MostReviews = n.ID
		}
		if n.YearsExperience > mostExperience {
			mostExperience = n.YearsExperience
			metrics.MostExperienced = n.ID
		}

		totalRating += n.AverageRating
		totalMealPlans += n.MealPlansCount
	}

	if len(nutritionists) > 0 {
		metrics.AverageRating = totalRating / float64(len(nutritionists))
		metrics.AverageMealPlans = float64(totalMealPlans) / float64(len(nutritionists))
	}

	// Best value: melhor rating com menor preço
	bestValue := ""
	bestValueScore := 0.0
	for _, n := range nutritionists {
		if n.MinPrice > 0 && n.AverageRating > 0 {
			score := n.AverageRating / n.MinPrice * 1000
			if score > bestValueScore {
				bestValueScore = score
				bestValue = n.ID
			}
		}
	}
	metrics.BestValue = bestValue

	return metrics
}


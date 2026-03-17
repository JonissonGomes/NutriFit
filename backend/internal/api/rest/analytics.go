package rest

import (
	"context"
	"net/http"
	"strings"
	"time"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/analytics"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// HANDLERS DE ANALYTICS
// ============================================

// getAnalyticsOverview retorna uma visão geral de analytics do usuário
func getAnalyticsOverview(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Parse das datas do período
	periodStr := c.DefaultQuery("period", "30d")
	startDate, endDate := parsePeriod(periodStr)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	overview, err := analytics.GetOverview(ctx, userID.(string), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar analytics: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, overview)
}

// getAnalyticsComparison retorna comparação entre dois períodos
func getAnalyticsComparison(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Parse das datas do período
	periodStr := c.DefaultQuery("period", "30d")
	currentStart, currentEnd := parsePeriod(periodStr)

	// Calcular período anterior
	duration := currentEnd.Sub(currentStart)
	previousEnd := currentStart.Add(-time.Second)
	previousStart := previousEnd.Add(-duration)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	comparison, err := analytics.GetComparison(ctx, userID.(string), currentStart, currentEnd, previousStart, previousEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar comparação: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, comparison)
}

// getMealPlanAnalytics retorna analytics de um plano alimentar (rota /meal-plans/:id).
func getMealPlanAnalytics(c *gin.Context) {
	getProjectAnalytics(c)
}

// getProjectAnalytics retorna analytics de um projeto específico
func getProjectAnalytics(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do projeto é obrigatório"})
		return
	}

	// Verificar se o projeto pertence ao usuário
	projectOID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do projeto inválido"})
		return
	}

	// TODO: Verificar ownership do projeto

	_ = projectOID
	_ = userID

	// Parse das datas do período
	periodStr := c.DefaultQuery("period", "30d")
	startDate, endDate := parsePeriod(periodStr)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	projectAnalytics, err := analytics.GetProjectAnalytics(ctx, projectID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar analytics do projeto: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, projectAnalytics)
}

// trackAnalyticsEvent registra um evento de analytics
func trackAnalyticsEvent(c *gin.Context) {
	var req models.TrackEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	userOID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	// Extrair informações do visitante
	visitorID := ""
	visitorRole := ""
	if authUserID, exists := c.Get("userID"); exists {
		visitorID = authUserID.(string)
		if role, exists := c.Get("userRole"); exists {
			visitorRole = role.(string)
		}
	} else {
		// Visitante anônimo - usar IP + User-Agent como identificador
		visitorID = generateVisitorID(c)
	}

	// Detectar dispositivo
	deviceType := detectDeviceType(c.GetHeader("User-Agent"))

	// Detectar fonte
	source := detectSource(req.Source, req.Referrer)

	event := &models.AnalyticsEvent{
		UserID:      userOID,
		VisitorID:   visitorID,
		VisitorRole: visitorRole,
		EventType:   req.EventType,
		TargetID:    req.TargetID,
		TargetType:  req.TargetType,
		Source:      source,
		Referrer:    req.Referrer,
		UserAgent:   c.GetHeader("User-Agent"),
		DeviceType:  deviceType,
		SearchQuery: req.SearchQuery,
		Metadata:    req.Metadata,
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	if err := analytics.TrackEvent(ctx, event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar evento"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true})
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// parsePeriod converte uma string de período em datas de início e fim
func parsePeriod(period string) (time.Time, time.Time) {
	now := time.Now()
	endDate := now

	switch period {
	case "7d":
		return now.AddDate(0, 0, -7), endDate
	case "30d":
		return now.AddDate(0, 0, -30), endDate
	case "90d":
		return now.AddDate(0, 0, -90), endDate
	case "1y":
		return now.AddDate(-1, 0, 0), endDate
	case "today":
		startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		return startOfDay, endDate
	case "yesterday":
		yesterday := now.AddDate(0, 0, -1)
		startOfDay := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
		endOfDay := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 23, 59, 59, 999999999, yesterday.Location())
		return startOfDay, endOfDay
	case "this_week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		startOfWeek := now.AddDate(0, 0, -weekday+1)
		startOfWeek = time.Date(startOfWeek.Year(), startOfWeek.Month(), startOfWeek.Day(), 0, 0, 0, 0, startOfWeek.Location())
		return startOfWeek, endDate
	case "this_month":
		startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		return startOfMonth, endDate
	default:
		return now.AddDate(0, 0, -30), endDate
	}
}

// generateVisitorID gera um ID para visitantes anônimos
func generateVisitorID(c *gin.Context) string {
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	// Criar um hash simples do IP + UserAgent
	return ip + "-" + userAgent[:min(20, len(userAgent))]
}

// min retorna o menor de dois inteiros
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// detectDeviceType detecta o tipo de dispositivo a partir do User-Agent
func detectDeviceType(userAgent string) string {
	ua := strings.ToLower(userAgent)
	if strings.Contains(ua, "mobile") || strings.Contains(ua, "android") || strings.Contains(ua, "iphone") {
		return "mobile"
	}
	if strings.Contains(ua, "tablet") || strings.Contains(ua, "ipad") {
		return "tablet"
	}
	return "desktop"
}

// detectSource detecta a fonte do tráfego
func detectSource(source models.AnalyticsSource, referrer string) models.AnalyticsSource {
	if source != "" {
		return source
	}

	if referrer == "" {
		return models.AnalyticsSourceDirect
	}

	referrerLower := strings.ToLower(referrer)

	// Redes sociais
	socialDomains := []string{"facebook", "twitter", "instagram", "linkedin", "pinterest", "tiktok", "youtube"}
	for _, domain := range socialDomains {
		if strings.Contains(referrerLower, domain) {
			return models.AnalyticsSourceSocial
		}
	}

	// Buscadores
	searchDomains := []string{"google", "bing", "yahoo", "duckduckgo", "baidu"}
	for _, domain := range searchDomains {
		if strings.Contains(referrerLower, domain) {
			return models.AnalyticsSourceSearch
		}
	}

	// Email
	if strings.Contains(referrerLower, "mail") || strings.Contains(referrerLower, "email") {
		return models.AnalyticsSourceEmail
	}

	// Tráfego interno
	if strings.Contains(referrerLower, "nufit") || strings.Contains(referrerLower, "localhost") {
		return models.AnalyticsSourceInternal
	}

	return models.AnalyticsSourceReferral
}




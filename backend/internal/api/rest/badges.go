package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/services/badge"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE BADGES
// ============================================

// getAllBadges retorna todas as definições de badges
func getAllBadges(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	badges, err := badge.GetAllBadgeDefinitions(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar badges: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, badges)
}

// getBadgeByID retorna um badge pelo ID
func getBadgeByID(c *gin.Context) {
	badgeID := c.Param("id")
	if badgeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do badge é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	b, err := badge.GetBadgeByID(ctx, badgeID)
	if err != nil {
		if err == badge.ErrBadgeNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Badge não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar badge: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, b)
}

// getMyBadges retorna os badges do usuário autenticado
func getMyBadges(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	badges, err := badge.GetUserBadges(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar badges: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, badges)
}

// getMyBadgeSummary retorna um resumo dos badges do usuário autenticado
func getMyBadgeSummary(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	summary, err := badge.GetUserBadgeSummary(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar resumo de badges: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// getUserBadges retorna os badges de um usuário específico
func getUserBadges(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	badges, err := badge.GetUserBadges(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar badges: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, badges)
}

// checkAndAwardBadges verifica e concede badges automaticamente
func checkAndAwardBadges(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	newBadges, err := badge.CheckAndAwardBadges(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar badges: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"newBadges": newBadges,
		"count":     len(newBadges),
	})
}

// updateBadgeDisplay atualiza a exibição de um badge
func updateBadgeDisplay(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	badgeID := c.Param("id")
	if badgeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do badge é obrigatório"})
		return
	}

	var req struct {
		IsDisplayed  bool `json:"isDisplayed"`
		DisplayOrder int  `json:"displayOrder"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := badge.UpdateBadgeDisplay(ctx, badgeID, userID.(string), req.IsDisplayed, req.DisplayOrder)
	if err != nil {
		if err == badge.ErrUserBadgeNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Badge não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar badge: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ============================================
// HANDLERS DE ADMIN
// ============================================

// awardBadgeToUser concede um badge a um usuário (admin)
func awardBadgeToUser(c *gin.Context) {
	adminID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// TODO: Verificar se é admin

	var req struct {
		UserID  string `json:"userId" binding:"required"`
		BadgeID string `json:"badgeId" binding:"required"`
		Reason  string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	adminIDStr := adminID.(string)
	userBadge, err := badge.AwardBadge(ctx, req.UserID, req.BadgeID, &adminIDStr, req.Reason)
	if err != nil {
		if err == badge.ErrBadgeNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Badge não encontrado"})
			return
		}
		if err == badge.ErrBadgeAlreadyOwned {
			c.JSON(http.StatusConflict, gin.H{"error": "Usuário já possui este badge"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao conceder badge: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, userBadge)
}

// revokeBadgeFromUser remove um badge de um usuário (admin)
func revokeBadgeFromUser(c *gin.Context) {
	adminID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// TODO: Verificar se é admin

	userBadgeID := c.Param("id")
	if userBadgeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do badge é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := badge.RevokeBadge(ctx, userBadgeID, adminID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao revogar badge: " + err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// initializeBadges inicializa as definições de badges padrão (admin)
func initializeBadges(c *gin.Context) {
	// TODO: Verificar se é admin

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	err := badge.InitializeBadgeDefinitions(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao inicializar badges: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Badges inicializados com sucesso"})
}

// getUserBadgesPublic retorna os badges de um usuário (público)
func getUserBadgesPublic(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Retorna apenas badges exibidos
	badges, err := badge.GetUserBadges(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar badges: " + err.Error()})
		return
	}

	// Filtrar apenas os exibidos
	displayed := make([]any, 0)
	for _, b := range badges {
		if b.IsDisplayed {
			displayed = append(displayed, b)
		}
	}

	c.JSON(http.StatusOK, displayed)
}

// Temporariamente não usado, mas necessário para compatibilidade
var _ = strconv.Itoa




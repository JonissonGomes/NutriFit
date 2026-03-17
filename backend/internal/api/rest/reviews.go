package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/review"
	"nufit/backend/internal/services/security"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// HANDLERS DE AVALIAÇÕES
// ============================================

// createReview cria uma nova avaliação
func createReview(c *gin.Context) {
	patientID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		NutritionistID string `json:"nutritionistId" binding:"required"`
		MealPlanID     string `json:"mealPlanId,omitempty"`
		Rating         int    `json:"rating" binding:"required,min=1,max=5"`
		Comment        string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Avaliação deve ser entre 1 e 5."})
		return
	}

	// Decodificar IDs opacos
	nutritionistID, err := security.DecodeUserID(req.NutritionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de nutricionista inválido"})
		return
	}

	nutritionistObjID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de nutricionista inválido"})
		return
	}

	patientObjID, err := primitive.ObjectIDFromHex(patientID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno"})
		return
	}

	rev := &models.Review{
		NutritionistID: nutritionistObjID,
		PatientID:      patientObjID,
		Rating:         req.Rating,
		Comment:        req.Comment,
	}

	// Decodificar mealPlanId se fornecido
	if req.MealPlanID != "" {
		mealPlanObjID, err := primitive.ObjectIDFromHex(req.MealPlanID)
		if err == nil {
			rev.MealPlanID = &mealPlanObjID
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	createdReview, err := review.CreateReview(ctx, rev)
	if err != nil {
		switch err {
		case review.ErrAlreadyReviewed:
			c.JSON(http.StatusConflict, gin.H{"error": "Você já avaliou este nutricionista"})
		case review.ErrCannotReviewSelf:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível avaliar a si mesmo"})
		case review.ErrNutritionistNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Nutricionista não encontrado"})
		case review.ErrInvalidRating:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Avaliação deve ser entre 1 e 5"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar avaliação"})
		}
		return
	}

	c.JSON(http.StatusCreated, createdReview)
}

// getNutritionistReviews lista avaliações de um nutricionista
func getNutritionistReviews(c *gin.Context) {
	opaqueNutritionistID := c.Param("nutritionistId")
	nutritionistID, err := security.DecodeUserID(opaqueNutritionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de nutricionista inválido"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	reviews, total, err := review.GetReviewsByNutritionist(ctx, nutritionistID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar avaliações"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       reviews,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// getNutritionistRatingStats obtém estatísticas de avaliação de um nutricionista
func getNutritionistRatingStats(c *gin.Context) {
	opaqueNutritionistID := c.Param("nutritionistId")
	nutritionistID, err := security.DecodeUserID(opaqueNutritionistID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de nutricionista inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	stats, err := review.GetNutritionistRatingStats(ctx, nutritionistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// updateReview atualiza uma avaliação
func updateReview(c *gin.Context) {
	patientID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	opaqueReviewID := c.Param("id")
	reviewID, err := security.DecodeReviewID(opaqueReviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de avaliação inválido"})
		return
	}

	var req struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updates := &models.Review{
		Rating:  req.Rating,
		Comment: req.Comment,
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	updatedReview, err := review.UpdateReview(ctx, reviewID, patientID.(string), updates)
	if err != nil {
		switch err {
		case review.ErrUnauthorized:
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para editar esta avaliação"})
		case review.ErrInvalidRating:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Avaliação deve ser entre 1 e 5"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar avaliação"})
		}
		return
	}

	c.JSON(http.StatusOK, updatedReview)
}

// deleteReview deleta uma avaliação
func deleteReview(c *gin.Context) {
	clientID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	opaqueReviewID := c.Param("id")
	reviewID, err := security.DecodeReviewID(opaqueReviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de avaliação inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err = review.DeleteReview(ctx, reviewID, clientID.(string))
	if err != nil {
		if err == review.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para deletar esta avaliação"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar avaliação"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Avaliação excluída com sucesso"})
}

// markReviewHelpful marca uma avaliação como útil
func markReviewHelpful(c *gin.Context) {
	opaqueReviewID := c.Param("id")
	reviewID, err := security.DecodeReviewID(opaqueReviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de avaliação inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err = review.MarkReviewHelpful(ctx, reviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar avaliação como útil"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Avaliação marcada como útil"})
}

// getMyReviews lista avaliações feitas pelo usuário autenticado
func getMyReviews(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	reviews, total, err := review.GetMyReviews(ctx, userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar avaliações"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  reviews,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}


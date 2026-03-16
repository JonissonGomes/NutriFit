package rest

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/food_diary"
)

func getFoodDiaryEntries(c *gin.Context) {
	patientID := c.Param("patientId")

	var startDate, endDate *time.Time
	if startStr := c.Query("startDate"); startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = &t
		}
	}
	if endStr := c.Query("endDate"); endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = &t
		}
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	entries, err := food_diary.GetEntries(c.Request.Context(), patientID, startDate, endDate, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar diário alimentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": entries})
}

func createFoodDiaryEntry(c *gin.Context) {
	var entry models.FoodDiaryEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := food_diary.CreateEntry(c.Request.Context(), entry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar registro"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func uploadFoodDiaryPhoto(c *gin.Context) {
	// TODO: Implementar upload de foto usando Cloudinary
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func analyzeFoodDiaryPhoto(c *gin.Context) {
	// TODO: Implementar com integração Gemini Vision
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func addNutritionistComment(c *gin.Context) {
	entryID := c.Param("id")

	var req struct {
		Comment string `json:"comment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comentário inválido"})
		return
	}

	err := food_diary.AddNutritionistComment(c.Request.Context(), entryID, req.Comment)
	if err != nil {
		if err == food_diary.ErrEntryNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registro não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar comentário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comentário adicionado com sucesso"})
}

package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/anamnesis"
	"nufit/backend/internal/services/ai"
)

func listAnamnesisTemplates(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	templates, err := anamnesis.ListTemplates(c.Request.Context(), userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar templates"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": templates})
}

func createAnamnesisTemplate(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var template models.FormTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := anamnesis.CreateTemplate(c.Request.Context(), userIDStr, template)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar template"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func getAnamnesis(c *gin.Context) {
	patientID := c.Param("patientId")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	anam, err := anamnesis.GetAnamnesis(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		if err == anamnesis.ErrAnamnesisNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anamnese não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar anamnese"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": anam})
}

func submitAnamnesisAnswers(c *gin.Context) {
	patientID := c.Param("patientId")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	// Buscar anamnese primeiro
	anam, err := anamnesis.GetAnamnesis(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anamnese não encontrada"})
		return
	}

	var req struct {
		Answers []models.AnamnesisAnswer `json:"answers" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updated, err := anamnesis.SubmitAnswers(c.Request.Context(), anam.ID.Hex(), req.Answers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar respostas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func generateAnamnesisAISummary(c *gin.Context) {
	patientID := c.Param("patientId")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	// Buscar última anamnese do paciente para este nutricionista
	anam, err := anamnesis.GetAnamnesis(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		if err == anamnesis.ErrAnamnesisNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anamnese não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar anamnese"})
		return
	}

	summary, err := ai.GenerateAnamnesisSummary(c.Request.Context(), anam.ID.Hex())
	if err != nil {
		if err == ai.ErrAIUnavailable {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "IA não disponível"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar resumo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"summary": summary}})
}

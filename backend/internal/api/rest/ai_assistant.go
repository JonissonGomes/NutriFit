package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/ai"
)

func chatWithAIAssistant(c *gin.Context) {
	userID, _ := c.Get("userID")
	patientID := userID.(string)

	var req struct {
		Question string `json:"question" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pergunta inválida"})
		return
	}

	answer, err := ai.AnswerPatientQuestion(c.Request.Context(), req.Question, patientID)
	if err != nil {
		if err == ai.ErrAIUnavailable {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "IA não disponível"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar pergunta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"answer": answer}})
}

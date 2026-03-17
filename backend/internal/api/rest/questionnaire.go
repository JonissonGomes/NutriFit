package rest

import (
	"net/http"
	"strconv"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/questionnaire"
	"nufit/backend/internal/services/security"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func getQuestionnaires(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "me" {
		if uid, ok := c.Get("userID"); ok {
			patientID = uid.(string)
		}
	} else if decoded, err := security.DecodeUserID(patientID); err == nil {
		patientID = decoded
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	items, err := questionnaire.ListByPatient(c.Request.Context(), patientID, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao carregar questionários"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createQuestionnaire(c *gin.Context) {
	var req models.Questionnaire
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := questionnaire.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar questionário"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateQuestionnaire(c *gin.Context) {
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	updates := bson.M{}
	for k, v := range req {
		updates[k] = v
	}

	updated, err := questionnaire.Update(c.Request.Context(), id, updates)
	if err != nil {
		if err == questionnaire.ErrQuestionnaireNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Questionário não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar questionário"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteQuestionnaire(c *gin.Context) {
	id := c.Param("id")
	if err := questionnaire.Delete(c.Request.Context(), id); err != nil {
		if err == questionnaire.ErrQuestionnaireNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Questionário não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar questionário"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Questionário removido"})
}

func submitQuestionnaireAnswers(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Answers []models.AnamnesisAnswer `json:"answers" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Respostas inválidas"})
		return
	}

	updated, err := questionnaire.SubmitAnswers(c.Request.Context(), id, req.Answers)
	if err != nil {
		if err == questionnaire.ErrQuestionnaireNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Questionário não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar respostas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

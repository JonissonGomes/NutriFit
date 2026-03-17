package rest

import (
	"net/http"
	"strconv"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/lab_exam"
	"arck-design/backend/internal/services/security"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func getLabExams(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "me" {
		if uid, ok := c.Get("userID"); ok {
			patientID = uid.(string)
		}
	} else if decoded, err := security.DecodeUserID(patientID); err == nil {
		patientID = decoded
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	items, err := lab_exam.ListByPatient(c.Request.Context(), patientID, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao carregar exames"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createLabExam(c *gin.Context) {
	var req models.LabExam
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	created, err := lab_exam.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar exame"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateLabExam(c *gin.Context) {
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

	updated, err := lab_exam.Update(c.Request.Context(), id, updates)
	if err != nil {
		if err == lab_exam.ErrLabExamNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exame não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar exame"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteLabExam(c *gin.Context) {
	id := c.Param("id")
	if err := lab_exam.Delete(c.Request.Context(), id); err != nil {
		if err == lab_exam.ErrLabExamNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exame não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar exame"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Exame removido"})
}

func analyzeLabExamWithAI(c *gin.Context) {
	// IA: manter como “não implementado” até o analyzer existir de fato
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Análise por IA em desenvolvimento"})
}

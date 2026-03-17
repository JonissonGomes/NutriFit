package rest

import (
	"net/http"
	"strconv"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/anthropometric"
	"nufit/backend/internal/services/security"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func getAnthropometricRecords(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "me" {
		if uid, ok := c.Get("userID"); ok {
			patientID = uid.(string)
		}
	} else if decoded, err := security.DecodeUserID(patientID); err == nil {
		patientID = decoded
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	items, err := anthropometric.ListByPatient(c.Request.Context(), patientID, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao carregar avaliações antropométricas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createAnthropometricRecord(c *gin.Context) {
	var req models.Anthropometric
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := anthropometric.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar avaliação"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateAnthropometricRecord(c *gin.Context) {
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

	updated, err := anthropometric.Update(c.Request.Context(), id, updates)
	if err != nil {
		if err == anthropometric.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registro não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar avaliação"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteAnthropometricRecord(c *gin.Context) {
	id := c.Param("id")
	if err := anthropometric.Delete(c.Request.Context(), id); err != nil {
		if err == anthropometric.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registro não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar avaliação"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Registro removido"})
}

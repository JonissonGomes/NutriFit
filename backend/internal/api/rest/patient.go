package rest

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/services/patient"
	"go.mongodb.org/mongo-driver/bson"
)

func listPatients(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	patients, total, err := patient.ListPatients(c.Request.Context(), userIDStr, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar pacientes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": patients,
		"total": total,
		"page": page,
		"limit": limit,
	})
}

func createPatient(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req patient.Patient
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	createdPatient, err := patient.CreatePatient(c.Request.Context(), userIDStr, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar paciente"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": createdPatient})
}

func getPatient(c *gin.Context) {
	patientID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	p, err := patient.GetPatient(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		if err == patient.ErrPatientNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar paciente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": p})
}

func updatePatient(c *gin.Context) {
	patientID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updates := bson.M{}
	for k, v := range req {
		updates[k] = v
	}

	updatedPatient, err := patient.UpdatePatient(c.Request.Context(), patientID, userIDStr, updates)
	if err != nil {
		if err == patient.ErrPatientNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar paciente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updatedPatient})
}

func deletePatient(c *gin.Context) {
	patientID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	err := patient.DeletePatient(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		if err == patient.ErrPatientNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover paciente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Paciente removido com sucesso"})
}

func importPatients(c *gin.Context) {
	// TODO: Implementar importação de pacientes de planilhas ou outros sistemas
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

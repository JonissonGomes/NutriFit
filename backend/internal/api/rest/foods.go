package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/food"
	"nufit/backend/internal/services/medical_record"
)

func searchFoods(c *gin.Context) {
	q := c.Query("q")
	limit := 20
	foods, err := food.SearchFoods(c.Request.Context(), q, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar alimentos"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": foods})
}

func getMedicalRecord(c *gin.Context) {
	userID, _ := c.Get("userID")
	patientID := c.Param("patientId")
	record, err := medical_record.GetPatientRecord(c.Request.Context(), userID.(string), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar prontuário"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": record})
}

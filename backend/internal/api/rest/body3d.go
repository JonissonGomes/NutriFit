package rest

import (
	"net/http"

	"nufit/backend/internal/services/body3d"
	"github.com/gin-gonic/gin"
)

func analyzeBody3D(c *gin.Context) {
	var req struct {
		PatientID string   `json:"patientId" binding:"required"`
		HeightCm  float64  `json:"heightCm" binding:"required"`
		WeightKg  float64  `json:"weightKg" binding:"required"`
		Photos    []string `json:"photos,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	report, err := body3d.AnalyzeBody3D(c.Request.Context(), req.PatientID, req.HeightCm, req.WeightKg, req.Photos)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

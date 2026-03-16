package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func analyzeBody3D(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

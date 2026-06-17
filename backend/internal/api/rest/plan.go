package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/plan"
)

func getPlanSummary(c *gin.Context) {
	userID, _ := c.Get("userID")
	summary, err := plan.PlanSummary(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar plano"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": summary})
}

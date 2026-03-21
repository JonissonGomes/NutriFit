package rest

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/predefined_meal"
)

func listPredefinedMeals(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	group := strings.TrimSpace(c.Query("group"))
	items, err := predefined_meal.List(c.Request.Context(), q, group, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar refeições pré-cadastradas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

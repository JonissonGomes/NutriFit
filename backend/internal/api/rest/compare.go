package rest

import (
	"context"
	"net/http"
	"strings"
	"time"

	"nufit/backend/internal/services/compare"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE COMPARAÇÃO
// ============================================

// compareNutritionists compara múltiplos nutricionistas
func compareNutritionists(c *gin.Context) {
	// Receber IDs via query param (separados por vírgula) ou JSON body
	var nutritionistIDs []string

	// Tentar do query param primeiro
	idsParam := c.Query("ids")
	if idsParam != "" {
		nutritionistIDs = strings.Split(idsParam, ",")
		// Limpar espaços
		for i, id := range nutritionistIDs {
			nutritionistIDs[i] = strings.TrimSpace(id)
		}
	} else {
		// Tentar do body
		var req struct {
			NutritionistIDs []string `json:"nutritionistIds"`
		}
		if err := c.ShouldBindJSON(&req); err == nil {
			nutritionistIDs = req.NutritionistIDs
		}
	}

	if len(nutritionistIDs) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "É necessário pelo menos 2 nutricionistas para comparação"})
		return
	}

	if len(nutritionistIDs) > 4 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Máximo de 4 nutricionistas para comparação"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	result, err := compare.CompareNutritionists(ctx, nutritionistIDs)
	if err != nil {
		if err == compare.ErrMinNutritionists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nutricionistas insuficientes para comparação"})
			return
		}
		if err == compare.ErrTooManyNutritionists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Máximo de 4 nutricionistas para comparação"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao comparar nutricionistas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}




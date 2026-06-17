package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/meal_plan_template"
	"nufit/backend/internal/services/plan"
)

func listMealPlanTemplates(c *gin.Context) {
	userID, _ := c.Get("userID")
	items, err := meal_plan_template.List(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar modelos"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createMealPlanTemplate(c *gin.Context) {
	userID, _ := c.Get("userID")
	var tpl models.MealPlanTemplate
	if err := c.ShouldBindJSON(&tpl); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	created, err := meal_plan_template.Create(c.Request.Context(), userID.(string), tpl)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar modelo"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func getMealPlanTemplate(c *gin.Context) {
	tpl, err := meal_plan_template.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Modelo não encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tpl})
}

func requireTemplatesPlan(c *gin.Context) {
	userID, _ := c.Get("userID")
	if err := plan.HasFeature(c.Request.Context(), userID.(string), plan.FeatureTemplates); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": err.Error()})
		c.Abort()
		return
	}
	c.Next()
}

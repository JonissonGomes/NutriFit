package rest

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/meal_plan"
	"arck-design/backend/internal/services/food"
	"go.mongodb.org/mongo-driver/bson"
)

func listMealPlans(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	patientID := c.Query("patientId")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	var patientIDPtr *string
	if patientID != "" {
		patientIDPtr = &patientID
	}

	mealPlans, total, err := meal_plan.ListMealPlans(c.Request.Context(), userIDStr, patientIDPtr, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar planos alimentares"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": mealPlans,
		"total": total,
		"page": page,
		"limit": limit,
	})
}

func createMealPlan(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req models.MealPlan
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := meal_plan.CreateMealPlan(c.Request.Context(), userIDStr, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar plano alimentar"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func getMealPlan(c *gin.Context) {
	mealPlanID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	mp, err := meal_plan.GetMealPlan(c.Request.Context(), mealPlanID, userIDStr)
	if err != nil {
		if err == meal_plan.ErrMealPlanNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plano alimentar não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar plano alimentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mp})
}

func updateMealPlan(c *gin.Context) {
	mealPlanID := c.Param("id")
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

	updated, err := meal_plan.UpdateMealPlan(c.Request.Context(), mealPlanID, userIDStr, updates)
	if err != nil {
		if err == meal_plan.ErrMealPlanNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plano alimentar não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar plano alimentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteMealPlan(c *gin.Context) {
	mealPlanID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	err := meal_plan.DeleteMealPlan(c.Request.Context(), mealPlanID, userIDStr)
	if err != nil {
		if err == meal_plan.ErrMealPlanNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plano alimentar não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover plano alimentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Plano alimentar removido com sucesso"})
}

func updateMealPlanStatus(c *gin.Context) {
	mealPlanID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req struct {
		Status models.MealPlanStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status inválido"})
		return
	}

	updated, err := meal_plan.UpdateMealPlan(c.Request.Context(), mealPlanID, userIDStr, bson.M{"status": req.Status})
	if err != nil {
		if err == meal_plan.ErrMealPlanNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plano alimentar não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func getMealPlanStats(c *gin.Context) {
	// TODO: Implementar estatísticas do plano
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func generateMealPlanWithAI(c *gin.Context) {
	// TODO: Implementar com integração Gemini
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func analyzeMealPlanWithAI(c *gin.Context) {
	// TODO: Implementar com integração Gemini
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func getFoodSubstitutions(c *gin.Context) {
	mealPlanID := c.Param("id")
	foodID := c.Param("foodId")

	substitutions, err := food.GetSubstitutions(c.Request.Context(), foodID, mealPlanID)
	if err != nil {
		if err == food.ErrFoodNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Alimento não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar substituições"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": substitutions})
}

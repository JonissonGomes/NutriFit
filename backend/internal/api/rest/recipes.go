package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/recipe"
)

func listMyRecipes(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRoleAny, _ := c.Get("userRole")
	if userRole, _ := userRoleAny.(string); userRole == string(models.RolePaciente) {
		items, err := recipe.ListForPatient(c.Request.Context(), userID.(string), 100)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar receitas"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": items})
		return
	}
	items, err := recipe.ListByNutritionist(c.Request.Context(), userID.(string), 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar receitas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func listPublicRecipesByNutritionist(c *gin.Context) {
	nutritionistID := c.Param("nutritionistId")
	items, err := recipe.ListPublicByNutritionist(c.Request.Context(), nutritionistID, 24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar receitas públicas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createRecipe(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req models.Recipe
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	if req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Título é obrigatório"})
		return
	}
	created, err := recipe.Create(c.Request.Context(), userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar receita"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateRecipe(c *gin.Context) {
	userID, _ := c.Get("userID")
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	updates := bson.M{}
	for k, v := range req {
		switch k {
		case "title", "description", "ingredients", "steps", "mealGroups", "filters", "calories", "isPublic":
			updates[k] = v
		case "patientIds":
			if ids, ok := v.([]interface{}); ok {
				var out []primitive.ObjectID
				for _, raw := range ids {
					if s, ok := raw.(string); ok {
						if oid, err := primitive.ObjectIDFromHex(s); err == nil {
							out = append(out, oid)
						}
					}
				}
				updates[k] = out
			}
		case "mealPlanIds":
			if ids, ok := v.([]interface{}); ok {
				var out []primitive.ObjectID
				for _, raw := range ids {
					if s, ok := raw.(string); ok {
						if oid, err := primitive.ObjectIDFromHex(s); err == nil {
							out = append(out, oid)
						}
					}
				}
				updates[k] = out
			}
		}
	}
	updated, err := recipe.Update(c.Request.Context(), id, userID.(string), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar receita"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteRecipe(c *gin.Context) {
	userID, _ := c.Get("userID")
	id := c.Param("id")
	if err := recipe.Delete(c.Request.Context(), id, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover receita"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Receita removida"})
}

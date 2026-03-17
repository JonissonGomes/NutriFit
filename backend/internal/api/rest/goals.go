package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/goal"
	"arck-design/backend/internal/services/security"
	"go.mongodb.org/mongo-driver/bson"
)

func getPatientGoals(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "me" {
		if uid, ok := c.Get("userID"); ok {
			patientID = uid.(string)
		}
	} else if decoded, err := security.DecodeUserID(patientID); err == nil {
		patientID = decoded
	}

	goals, err := goal.GetPatientGoals(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar metas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": goals})
}

func createGoal(c *gin.Context) {
	var req models.Goal
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := goal.CreateGoal(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar meta"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateGoal(c *gin.Context) {
	goalID := c.Param("id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updates := bson.M{}
	for k, v := range req {
		updates[k] = v
	}

	updated, err := goal.UpdateGoal(c.Request.Context(), goalID, updates)
	if err != nil {
		if err == goal.ErrGoalNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar meta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteGoal(c *gin.Context) {
	goalID := c.Param("id")

	err := goal.DeleteGoal(c.Request.Context(), goalID)
	if err != nil {
		if err == goal.ErrGoalNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover meta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Meta removida com sucesso"})
}

func addGoalCheckIn(c *gin.Context) {
	goalID := c.Param("id")

	var checkIn models.GoalCheckIn
	if err := c.ShouldBindJSON(&checkIn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updated, err := goal.AddCheckIn(c.Request.Context(), goalID, checkIn)
	if err != nil {
		if err == goal.ErrGoalNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar check-in"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

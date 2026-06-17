package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/notification"
)

func registerPushToken(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req struct {
		Token string `json:"token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token inválido"})
		return
	}
	if err := notification.RegisterPushToken(c.Request.Context(), userID.(string), req.Token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar push"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Token registrado"})
}

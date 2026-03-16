package rest

import (
	"context"
	"net/http"
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/settings"
	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE CONFIGURAÇÕES
// ============================================

// getSettings obtém as configurações do usuário
func getSettings(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	s, err := settings.GetSettings(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar configurações"})
		return
	}

	c.JSON(http.StatusOK, s)
}

// updateNotifications atualiza configurações de notificações
func updateNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var notifications models.NotificationSettings
	if err := c.ShouldBindJSON(&notifications); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	s, err := settings.UpdateNotifications(ctx, userID.(string), &notifications)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar notificações"})
		return
	}

	c.JSON(http.StatusOK, s)
}

// updatePreferences atualiza preferências do usuário
func updatePreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var preferences models.Preferences
	if err := c.ShouldBindJSON(&preferences); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	s, err := settings.UpdatePreferences(ctx, userID.(string), &preferences)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar preferências"})
		return
	}

	c.JSON(http.StatusOK, s)
}

// updatePrivacy atualiza configurações de privacidade
func updatePrivacy(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var privacy models.PrivacySettings
	if err := c.ShouldBindJSON(&privacy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	s, err := settings.UpdatePrivacy(ctx, userID.(string), &privacy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar privacidade"})
		return
	}

	c.JSON(http.StatusOK, s)
}

// ============================================
// HANDLERS DE PERFIL
// ============================================

// getProfile obtém dados do perfil do usuário
func getProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	profile, err := settings.GetProfile(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar perfil"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// updateProfile atualiza dados do perfil do usuário
func updateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	profile, err := settings.UpdateProfile(ctx, userID.(string), data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar perfil"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// ============================================
// HANDLERS DE SEGURANÇA
// ============================================

// changePassword altera a senha do usuário
func changePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Senha atual e nova senha são obrigatórias."})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := settings.ChangePassword(ctx, userID.(string), req.CurrentPassword, req.NewPassword)
	if err != nil {
		switch err {
		case settings.ErrInvalidPassword:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Senha atual incorreta"})
		case settings.ErrPasswordTooWeak:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nova senha muito fraca. Use pelo menos 8 caracteres."})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao alterar senha"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Senha alterada com sucesso"})
}

// ============================================
// HANDLERS DE CONTA
// ============================================

// deleteAccount desativa/remove a conta do usuário
func deleteAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Senha é obrigatória para excluir a conta"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := settings.DeleteAccount(ctx, userID.(string), req.Password)
	if err != nil {
		switch err {
		case settings.ErrInvalidPassword:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Senha incorreta"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao excluir conta"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Conta excluída com sucesso"})
}




package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/services/notification"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE NOTIFICAÇÕES
// ============================================

// listNotifications lista notificações do usuário
func listNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	unreadOnlyStr := c.Query("unreadOnly")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}

	unreadOnly := unreadOnlyStr == "true"

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	notifications, total, err := notification.GetUserNotifications(ctx, userID.(string), page, limit, unreadOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar notificações"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       notifications,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// getUnreadNotificationCount retorna contagem de notificações não lidas
func getUnreadNotificationCount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	count, err := notification.GetUnreadCount(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar contagem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unreadCount": count})
}

// markNotificationAsRead marca uma notificação como lida
func markNotificationAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	notificationID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := notification.MarkAsRead(ctx, notificationID, userID.(string))
	if err != nil {
		if err == notification.ErrNotificationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Notificação não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar como lida"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notificação marcada como lida"})
}

// markAllNotificationsAsRead marca todas as notificações como lidas
func markAllNotificationsAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := notification.MarkAllAsRead(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar notificações como lidas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todas as notificações marcadas como lidas"})
}

// deleteNotification deleta uma notificação
func deleteNotification(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	notificationID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := notification.DeleteNotification(ctx, notificationID, userID.(string))
	if err != nil {
		if err == notification.ErrNotificationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Notificação não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar notificação"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notificação deletada"})
}

// ============================================
// PREFERÊNCIAS DE NOTIFICAÇÃO
// ============================================

// getNotificationPreferences obtém preferências de notificação
func getNotificationPreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	prefs, err := notification.GetUserPreferences(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar preferências"})
		return
	}

	c.JSON(http.StatusOK, prefs)
}

// updateNotificationPreferences atualiza preferências de notificação
func updateNotificationPreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := notification.UpdateUserPreferences(ctx, userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar preferências"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Preferências atualizadas com sucesso"})
}




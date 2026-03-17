package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/message"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE MENSAGENS
// ============================================

// listConversations lista todas as conversas do usuário
func listConversations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	conversations, err := message.GetConversations(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar conversas"})
		return
	}

	c.JSON(http.StatusOK, conversations)
}

// getConversation obtém uma conversa específica
func getConversation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	conversation, err := message.GetConversationByID(ctx, conversationID, userID.(string))
	if err != nil {
		if err == message.ErrConversationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Conversa não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar conversa"})
		return
	}

	c.JSON(http.StatusOK, conversation)
}

// getMessages obtém mensagens de uma conversa
func getMessages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	// Paginação
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	messages, total, err := message.GetMessages(ctx, conversationID, userID.(string), page, limit)
	if err != nil {
		if err == message.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para acessar esta conversa"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar mensagens"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       messages,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// sendMessage envia uma nova mensagem
func sendMessage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		ReceiverID  string                     `json:"receiverId" binding:"required"`
		Text        string                     `json:"text"`
		Attachments []models.MessageAttachment `json:"attachments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Validar que há texto ou anexos
	if req.Text == "" && len(req.Attachments) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mensagem deve ter texto ou anexos"})
		return
	}

	// Sanitizar texto (básico)
	if len(req.Text) > 5000 {
		req.Text = req.Text[:5000]
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	msg, err := message.SendMessage(ctx, userID.(string), req.ReceiverID, req.Text, req.Attachments)
	if err != nil {
		switch err {
		case message.ErrInvalidReceiver:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Destinatário inválido"})
		case message.ErrEmptyMessage:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mensagem não pode estar vazia"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar mensagem"})
		}
		return
	}

	c.JSON(http.StatusCreated, msg)
}

// markAsRead marca mensagens como lidas
func markAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := message.MarkAsRead(ctx, conversationID, userID.(string))
	if err != nil {
		if err == message.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar como lida"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mensagens marcadas como lidas"})
}

// deleteMessage deleta uma mensagem
func deleteMessage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da mensagem é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := message.DeleteMessage(ctx, messageID, userID.(string))
	if err != nil {
		if err == message.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para deletar esta mensagem"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar mensagem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mensagem deletada"})
}

// getUnreadCount obtém contagem de mensagens não lidas
func getUnreadCount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	count, err := message.GetUnreadCount(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar contagem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unreadCount": count})
}

// startConversation inicia ou obtém uma conversa com outro usuário
func startConversation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		ReceiverID string `json:"receiverId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do destinatário é obrigatório"})
		return
	}

	if userID.(string) == req.ReceiverID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível iniciar conversa consigo mesmo"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	conversation, err := message.GetOrCreateConversation(ctx, userID.(string), req.ReceiverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conversa"})
		return
	}

	c.JSON(http.StatusOK, conversation)
}

// deleteConversation deleta uma conversa
func deleteConversation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da conversa é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := message.DeleteConversation(ctx, conversationID, userID.(string))
	if err != nil {
		if err == message.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para deletar esta conversa"})
			return
		}
		if err == message.ErrConversationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Conversa não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar conversa"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Conversa deletada com sucesso"})
}



package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/event"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// HANDLERS DE EVENTOS
// ============================================

// listEvents lista todos os eventos do usuário
func listEvents(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Parâmetros de query
	status := c.Query("status")
	eventType := c.Query("type")
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	filters := event.EventFilters{
		Status: status,
		Type:   eventType,
		Page:   page,
		Limit:  limit,
	}

	// Parse datas
	if startDateStr != "" {
		if t, err := time.Parse("2006-01-02", startDateStr); err == nil {
			filters.StartDate = t
		}
	}
	if endDateStr != "" {
		if t, err := time.Parse("2006-01-02", endDateStr); err == nil {
			filters.EndDate = t
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	events, total, err := event.GetEventsByUser(ctx, userID.(string), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       events,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// createEvent cria um novo evento
func createEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		ClientID        string `json:"clientId"`
		ProjectID       string `json:"projectId"`
		Title           string `json:"title" binding:"required"`
		Description     string `json:"description"`
		Date            string `json:"date" binding:"required"` // YYYY-MM-DD
		Time            string `json:"time" binding:"required"` // HH:MM
		Duration        int    `json:"duration" binding:"required,min=15"`
		Location        string `json:"location" binding:"required"`
		LocationAddress string `json:"locationAddress"`
		Type            string `json:"type" binding:"required"`
		Reminder        *models.EventReminder `json:"reminder"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Título, data, hora, duração, local e tipo são obrigatórios."})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	// Parse da data
	eventDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de data inválido. Use YYYY-MM-DD."})
		return
	}

	evt := &models.Event{
		UserID:          userObjID,
		Title:           req.Title,
		Description:     req.Description,
		Date:            eventDate,
		Time:            req.Time,
		Duration:        req.Duration,
		Location:        models.EventLocation(req.Location),
		LocationAddress: req.LocationAddress,
		Type:            models.EventType(req.Type),
		Reminder:        req.Reminder,
		RequestedBy:     "arquiteto",
	}

	// Parse clientId se fornecido
	if req.ClientID != "" {
		if clientObjID, err := primitive.ObjectIDFromHex(req.ClientID); err == nil {
			evt.ClientID = &clientObjID
		}
	}

	// Parse projectId se fornecido
	if req.ProjectID != "" {
		if projectObjID, err := primitive.ObjectIDFromHex(req.ProjectID); err == nil {
			evt.ProjectID = &projectObjID
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	createdEvent, err := event.CreateEvent(ctx, evt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar evento"})
		return
	}

	c.JSON(http.StatusCreated, createdEvent)
}

// getEvent retorna um evento específico
func getEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do evento é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	evt, err := event.GetEventByID(ctx, eventID, userID.(string))
	if err != nil {
		if err == event.ErrEventNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Evento não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar evento"})
		return
	}

	c.JSON(http.StatusOK, evt)
}

// updateEvent atualiza um evento
func updateEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do evento é obrigatório"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Campos permitidos para atualização
	allowedFields := map[string]bool{
		"title":           true,
		"description":     true,
		"date":            true,
		"time":            true,
		"duration":        true,
		"location":        true,
		"locationAddress": true,
		"type":            true,
		"reminder":        true,
		"clientId":        true,
		"projectId":       true,
	}

	updates := make(map[string]interface{})
	for key, value := range req {
		if allowedFields[key] {
			// Tratar conversão de data
			if key == "date" {
				if dateStr, ok := value.(string); ok {
					if t, err := time.Parse("2006-01-02", dateStr); err == nil {
						updates[key] = t
						continue
					}
				}
			}
			updates[key] = value
		}
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum campo válido para atualização"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	updatedEvent, err := event.UpdateEvent(ctx, eventID, userID.(string), updates)
	if err != nil {
		if err == event.ErrEventNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Evento não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar evento"})
		return
	}

	c.JSON(http.StatusOK, updatedEvent)
}

// deleteEvent remove um evento
func deleteEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do evento é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := event.DeleteEvent(ctx, eventID, userID.(string))
	if err != nil {
		if err == event.ErrEventNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Evento não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar evento"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Evento excluído com sucesso"})
}

// updateEventStatus atualiza o status de um evento
func updateEventStatus(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do evento é obrigatório"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status é obrigatório"})
		return
	}

	// Validar status
	validStatuses := map[string]bool{
		"confirmado": true,
		"pendente":   true,
		"concluido":  true,
		"cancelado":  true,
	}

	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status inválido. Use: confirmado, pendente, concluido ou cancelado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	updatedEvent, err := event.UpdateEventStatus(ctx, eventID, userID.(string), models.EventStatus(req.Status))
	if err != nil {
		if err == event.ErrEventNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Evento não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar status do evento"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status atualizado para " + req.Status,
		"event":   updatedEvent,
	})
}

// getUpcomingEvents retorna os próximos eventos
func getUpcomingEvents(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if limit < 1 || limit > 20 {
		limit = 5
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	events, err := event.GetUpcomingEvents(ctx, userID.(string), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	c.JSON(http.StatusOK, events)
}




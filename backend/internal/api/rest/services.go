package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// HANDLERS DE SERVIÇOS
// ============================================

// listServices lista todos os serviços do nutricionista
func listServices(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Parâmetros de query
	activeOnlyStr := c.DefaultQuery("active", "false")
	activeOnly := activeOnlyStr == "true"
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	services, total, err := service.GetServicesByUser(ctx, userID.(string), activeOnly, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       services,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// createService cria um novo serviço
func createService(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		Price       float64  `json:"price" binding:"required,min=0"`
		Duration    string   `json:"duration" binding:"required"`
		Category    string   `json:"category" binding:"required"`
		Features    []string `json:"features"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Nome, preço, duração e categoria são obrigatórios."})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	svc := &models.Service{
		UserID:      userObjID,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Duration:    req.Duration,
		Category:    models.ServiceCategory(req.Category),
		Features:    req.Features,
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	createdService, err := service.CreateService(ctx, svc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar serviço"})
		return
	}

	c.JSON(http.StatusCreated, createdService)
}

// getService retorna um serviço específico
func getService(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do serviço é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	svc, err := service.GetServiceByID(ctx, serviceID, userID.(string))
	if err != nil {
		if err == service.ErrServiceNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviço"})
		return
	}

	c.JSON(http.StatusOK, svc)
}

// updateService atualiza um serviço
func updateService(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do serviço é obrigatório"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Campos permitidos para atualização
	allowedFields := map[string]bool{
		"name":         true,
		"description":  true,
		"price":        true,
		"duration":     true,
		"category":     true,
		"features":     true,
		"availability": true,
		"pricing":      true,
	}

	updates := make(map[string]interface{})
	for key, value := range req {
		if allowedFields[key] {
			updates[key] = value
		}
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum campo válido para atualização"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	updatedService, err := service.UpdateService(ctx, serviceID, userID.(string), updates)
	if err != nil {
		if err == service.ErrServiceNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar serviço"})
		return
	}

	c.JSON(http.StatusOK, updatedService)
}

// deleteService remove um serviço
func deleteService(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do serviço é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := service.DeleteService(ctx, serviceID, userID.(string))
	if err != nil {
		if err == service.ErrServiceNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar serviço"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Serviço excluído com sucesso"})
}

// toggleServiceActive ativa/desativa um serviço
func toggleServiceActive(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do serviço é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	updatedService, err := service.ToggleServiceActive(ctx, serviceID, userID.(string))
	if err != nil {
		if err == service.ErrServiceNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao alterar status do serviço"})
		return
	}

	status := "ativado"
	if !updatedService.Active {
		status = "desativado"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço " + status + " com sucesso",
		"service": updatedService,
	})
}

// getServiceStats retorna estatísticas dos serviços
func getServiceStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	stats, err := service.GetServiceStats(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ============================================
// SERVIÇOS PÚBLICOS (para pacientes)
// ============================================

// getPublicNutritionistServices retorna serviços ativos de um nutricionista (visão pública)
func getPublicNutritionistServices(c *gin.Context) {
	nutritionistID := c.Param("nutritionistId")
	if nutritionistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do nutricionista é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	services, err := service.GetPublicServicesByNutritionist(ctx, nutritionistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}

	c.JSON(http.StatusOK, services)
}




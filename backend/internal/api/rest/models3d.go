package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/model3d"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE ARQUIVOS 3D
// ============================================

// uploadModel3D faz upload de um arquivo 3D
func uploadModel3D(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Receber arquivo
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não fornecido"})
		return
	}

	// Receber metadados
	title := c.PostForm("title")
	if title == "" {
		title = file.Filename
	}

	req := models.UploadModelFileRequest{
		ProjectID:   c.PostForm("projectId"),
		Title:       title,
		Description: c.PostForm("description"),
		Category:    c.PostForm("category"),
		IsPublic:    c.PostForm("isPublic") == "true",
	}

	// Tags vêm como string separada por vírgulas
	tagsStr := c.PostForm("tags")
	if tagsStr != "" {
		req.Tags = splitTags(tagsStr)
	}

	// Timeout maior para uploads grandes (10 minutos)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Minute)
	defer cancel()

	modelFile, err := model3d.Upload(ctx, userID.(string), file, req)
	if err != nil {
		if err == model3d.ErrFileTooLarge {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande (máximo 100MB)"})
			return
		}
		if err == model3d.ErrInvalidFormat {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de arquivo não suportado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fazer upload: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, modelFile)
}

// getModel3D retorna um arquivo 3D por ID
func getModel3D(c *gin.Context) {
	modelID := c.Param("id")
	if modelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do modelo é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	modelFile, err := model3d.GetByID(ctx, modelID, true)
	if err != nil {
		if err == model3d.ErrModelNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo 3D não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar arquivo 3D"})
		return
	}

	c.JSON(http.StatusOK, modelFile)
}

// getPublicModel3D retorna um arquivo 3D por ID (rota pública - apenas modelos públicos)
func getPublicModel3D(c *gin.Context) {
	modelID := c.Param("id")
	if modelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do modelo é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	modelFile, err := model3d.GetByID(ctx, modelID, true)
	if err != nil {
		if err == model3d.ErrModelNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo 3D não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar arquivo 3D"})
		return
	}

	// Verificar se o modelo é público
	if !modelFile.IsPublic {
		c.JSON(http.StatusForbidden, gin.H{"error": "Este modelo não está disponível publicamente"})
		return
	}

	// Verificar se o modelo está pronto
	if modelFile.Status != "ready" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Modelo ainda não está pronto para visualização"})
		return
	}

	c.JSON(http.StatusOK, modelFile)
}

// listModels3D lista arquivos 3D
func listModels3D(c *gin.Context) {
	userID, _ := c.Get("userID")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filters := models.ModelFileFilters{
		ProjectID: c.Query("projectId"),
		Format:    models.ModelFileFormat(c.Query("format")),
		Status:    models.ModelFileStatus(c.Query("status")),
		Category:  c.Query("category"),
		Search:    c.Query("search"),
		Page:      page,
		Limit:     limit,
	}

	// Se for usuário autenticado, mostrar seus arquivos
	// Se tiver filtro de usuário, usar esse
	// Se não, mostrar apenas públicos
	if userIDFilter := c.Query("userId"); userIDFilter != "" {
		filters.UserID = userIDFilter
	} else if userID != nil {
		filters.UserID = userID.(string)
	} else {
		isPublic := true
		filters.IsPublic = &isPublic
	}

	if isPublicStr := c.Query("isPublic"); isPublicStr != "" {
		isPublic := isPublicStr == "true"
		filters.IsPublic = &isPublic
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	result, err := model3d.List(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar arquivos 3D"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// updateModel3D atualiza um arquivo 3D
func updateModel3D(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	modelID := c.Param("id")
	if modelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do modelo é obrigatório"})
		return
	}

	var req models.UpdateModelFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	modelFile, err := model3d.Update(ctx, modelID, userID.(string), req)
	if err != nil {
		if err == model3d.ErrModelNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo 3D não encontrado"})
			return
		}
		if err == model3d.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para editar este arquivo"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar arquivo 3D"})
		return
	}

	c.JSON(http.StatusOK, modelFile)
}

// deleteModel3D deleta um arquivo 3D
func deleteModel3D(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	modelID := c.Param("id")
	if modelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do modelo é obrigatório"})
		return
	}

	userRole, _ := c.Get("userRole")
	isAdmin := userRole == "admin"

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := model3d.Delete(ctx, modelID, userID.(string), isAdmin)
	if err != nil {
		if err == model3d.ErrModelNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo 3D não encontrado"})
			return
		}
		if err == model3d.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para deletar este arquivo"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar arquivo 3D"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// getModel3DsByProject retorna arquivos 3D de um projeto
func getModel3DsByProject(c *gin.Context) {
	projectID := c.Param("projectId")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do projeto é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	models, err := model3d.GetByProject(ctx, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar arquivos 3D do projeto"})
		return
	}

	c.JSON(http.StatusOK, models)
}

// getModel3DStats retorna estatísticas de arquivos 3D do usuário
func getModel3DStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	stats, err := model3d.GetUserStats(ctx, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// downloadModel3D registra download e retorna URL
func downloadModel3D(c *gin.Context) {
	modelID := c.Param("id")
	if modelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do modelo é obrigatório"})
		return
	}

	format := c.Query("format") // original ou web

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	modelFile, err := model3d.GetByID(ctx, modelID, false)
	if err != nil {
		if err == model3d.ErrModelNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo 3D não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar arquivo 3D"})
		return
	}

	// Incrementar downloads
	_ = model3d.IncrementDownloads(ctx, modelID)

	// Retornar URL apropriada
	if format == "web" && modelFile.WebURL != "" {
		c.JSON(http.StatusOK, gin.H{
			"url":    modelFile.WebURL,
			"format": modelFile.WebFormat,
			"size":   modelFile.WebSize,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"url":    modelFile.OriginalURL,
			"format": modelFile.OriginalFormat,
			"size":   modelFile.OriginalSize,
		})
	}
}

// getSupportedFormats retorna os formatos suportados
func getSupportedFormats(c *gin.Context) {
	formats := models.SupportedModelFormats()
	categories := models.ModelCategories()

	c.JSON(http.StatusOK, gin.H{
		"formats":    formats,
		"categories": categories,
	})
}

// retryModel3DProcessing retenta o processamento de um arquivo
func retryModel3DProcessing(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	modelID := c.Param("id")
	if modelID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do modelo é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Verificar ownership
	modelFile, err := model3d.GetByID(ctx, modelID, false)
	if err != nil {
		if err == model3d.ErrModelNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo 3D não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar arquivo 3D"})
		return
	}

	if modelFile.UserID.Hex() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para reprocessar este arquivo"})
		return
	}

	// TODO: Iniciar reprocessamento
	c.JSON(http.StatusOK, gin.H{"message": "Reprocessamento iniciado"})
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// splitTags divide uma string de tags em um slice
func splitTags(tagsStr string) []string {
	tags := []string{}
	for _, tag := range splitString(tagsStr, ",") {
		trimmed := trimSpace(tag)
		if trimmed != "" {
			tags = append(tags, trimmed)
		}
	}
	return tags
}

func splitString(s, sep string) []string {
	result := []string{}
	start := 0
	for i := 0; i < len(s); i++ {
		if i+len(sep) <= len(s) && s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
			i += len(sep) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n') {
		end--
	}
	return s[start:end]
}



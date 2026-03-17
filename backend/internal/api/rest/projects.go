package rest

import (
	"context"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/api/dto"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/cloudinary"
	"nufit/backend/internal/services/image"
	"nufit/backend/internal/services/project"
	"nufit/backend/internal/services/security"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func listProjects(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	// Parse query parameters
	status := c.Query("status")
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	projects, total, err := getProjectsByUser(userIDStr, status, category, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar projetos"})
		return
	}

	// Usar DTO seguro que não expõe IDs internos
	response := dto.NewProjectListPaginatedResponse(projects, int(total), page, limit)
	c.JSON(http.StatusOK, response)
}

func createProject(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Category    string `json:"category" binding:"required"`
		Location    string `json:"location"`
		AccessType  string `json:"accessType"`
		Tags        []string `json:"tags"`
		Specs       *models.ProjectSpecs `json:"specs"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Título e categoria são obrigatórios."})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro de autenticação"})
		return
	}

	proj := &models.Project{
		UserID:      userObjID,
		Title:       req.Title,
		Description: req.Description,
		Category:    models.ProjectCategory(req.Category),
		Location:    req.Location,
		Status:      models.ProjectStatusDraft,
		AccessType:  models.AccessType(req.AccessType),
		Tags:        req.Tags,
		Specs:       req.Specs,
		Views:       0,
		FilesCount:  0,
		Featured:    false,
	}

	createdProject, err := createProjectInDB(proj)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar projeto"})
		return
	}

	// Usar DTO seguro
	response := dto.NewProjectResponse(createdProject)
	c.JSON(http.StatusCreated, response)
}

func getProject(c *gin.Context) {
	projectToken := c.Param("id")
	userID, _ := c.Get("userID")

	// Decodificar token para obter ID real
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	proj, err := getProjectByID(projectID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	// Usar DTO seguro
	response := dto.NewProjectResponse(proj)
	c.JSON(http.StatusOK, response)
}

func updateProject(c *gin.Context) {
	projectToken := c.Param("id")
	userID, _ := c.Get("userID")

	// Decodificar token para obter ID real
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updatedProject, err := updateProjectInDB(projectID, userID.(string), req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado ou sem permissão"})
		return
	}

	// Usar DTO seguro
	response := dto.NewProjectResponse(updatedProject)
	c.JSON(http.StatusOK, response)
}

func deleteProject(c *gin.Context) {
	projectToken := c.Param("id")
	userID, _ := c.Get("userID")

	// Decodificar token para obter ID real
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	err = deleteProjectFromDB(projectID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado ou sem permissão"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Projeto excluído com sucesso"})
}

func updateProjectVisibility(c *gin.Context) {
	projectToken := c.Param("id")
	userID, _ := c.Get("userID")

	// Decodificar token para obter ID real
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	var req struct {
		AccessType string `json:"accessType" binding:"required"`
		Password   string `json:"password,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de acesso é obrigatório"})
		return
	}

	proj, err := updateProjectVisibilityInDB(projectID, userID.(string), req.AccessType, req.Password)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado ou sem permissão"})
		return
	}

	// Usar DTO seguro
	response := dto.NewProjectResponse(proj)
	c.JSON(http.StatusOK, response)
}

func uploadProjectCover(c *gin.Context) {
	// Verify authentication - userID must exist from authMiddleware
	userID, exists := c.Get("userID")
	if !exists || userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Autenticação necessária"})
		c.Abort()
		return
	}

	userIDStr, ok := userID.(string)
	if !ok || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Erro de autenticação"})
		c.Abort()
		return
	}

	projectToken := c.Param("id")
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo é obrigatório (campo: file)"})
		return
	}

	if fileHeader.Size <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo inválido"})
		return
	}
	if fileHeader.Size > image.MaxImageSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande. O tamanho máximo é 10MB."})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao abrir arquivo"})
		return
	}
	defer src.Close()

	data, err := image.ReadImageFromReader(src, image.MaxImageSize)
	if err != nil {
		if err == image.ErrImageTooLarge {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande. O tamanho máximo é 10MB."})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler arquivo"})
		return
	}

	if err := image.ValidateImage(data, image.MaxImageSize); err != nil {
		errMsg := "Erro ao validar imagem"
		switch err {
		case image.ErrInvalidFormat, image.ErrUnsupportedFormat:
			errMsg = "Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP."
		case image.ErrImageTooLarge:
			errMsg = "Arquivo muito grande. O tamanho máximo é 10MB."
		default:
			errMsg = "Erro ao validar imagem: " + err.Error()
		}
		status := http.StatusBadRequest
		if err == image.ErrImageTooLarge {
			status = http.StatusRequestEntityTooLarge
		}
		c.JSON(status, gin.H{"error": errMsg})
		return
	}

	ext := filepath.Ext(fileHeader.Filename)
	publicID := "nufit/projects/" + projectID + "/cover" + ext

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	up, err := cloudinary.UploadImage(ctx, data, publicID, "nufit/projects")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fazer upload da imagem"})
		return
	}

	projectObjID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Projeto inválido"})
		return
	}
	userObjID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro de autenticação"})
		return
	}

	res, err := database.ProjectsCollection.UpdateOne(
		ctx,
		bson.M{"_id": projectObjID, "userId": userObjID},
		bson.M{"$set": bson.M{"coverImage": up.SecureURL, "updatedAt": time.Now()}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar projeto"})
		return
	}
	if res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado ou sem permissão"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"coverImage": up.SecureURL}})
}

func getProjectStats(c *gin.Context) {
	projectToken := c.Param("id")
	userID, _ := c.Get("userID")

	// Decodificar token para obter ID real
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	stats, err := getProjectStatsFromDB(projectID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado ou sem permissão"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func getProjectImages(c *gin.Context) {
	projectToken := c.Param("id")
	userID, _ := c.Get("userID")

	// Decodificar token para obter ID real
	projectID, err := security.DecodeProjectID(projectToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado"})
		return
	}

	images, err := getProjectImagesFromDB(projectID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Projeto não encontrado ou sem permissão"})
		return
	}

	// TODO: Retornar DTOs seguros para imagens
	c.JSON(http.StatusOK, images)
}

// Helper functions
func getProjectsByUser(userID, status, category string, page, limit int) ([]*models.Project, int, error) {
	projects, total, err := project.GetProjectsByUser(userID, status, category, page, limit)
	return projects, int(total), err
}

func createProjectInDB(proj *models.Project) (*models.Project, error) {
	return project.CreateProject(proj)
}

func getProjectByID(projectID, userID string) (*models.Project, error) {
	return project.GetProjectByID(projectID, userID)
}

func updateProjectInDB(projectID, userID string, req interface{}) (*models.Project, error) {
	updates := make(map[string]interface{})
	
	// Extract fields from request struct
	reqMap := req.(map[string]interface{})
	if title, ok := reqMap["title"].(string); ok && title != "" {
		updates["title"] = title
	}
	if desc, ok := reqMap["description"].(string); ok && desc != "" {
		updates["description"] = desc
	}
	if cat, ok := reqMap["category"].(string); ok && cat != "" {
		updates["category"] = cat
	}
	if loc, ok := reqMap["location"].(string); ok && loc != "" {
		updates["location"] = loc
	}
	if tags, ok := reqMap["tags"].([]string); ok {
		updates["tags"] = tags
	}
	if specs, ok := reqMap["specs"].(*models.ProjectSpecs); ok {
		updates["specs"] = specs
	}

	return project.UpdateProject(projectID, userID, updates)
}

func deleteProjectFromDB(projectID, userID string) error {
	return project.DeleteProject(projectID, userID)
}

func updateProjectVisibilityInDB(projectID, userID, accessType, password string) (*models.Project, error) {
	return project.UpdateProjectVisibility(projectID, userID, accessType, password)
}

func getProjectStatsFromDB(projectID, userID string) (map[string]interface{}, error) {
	return project.GetProjectStats(projectID, userID)
}

func getProjectImagesFromDB(projectID, userID string) ([]*models.Image, error) {
	return project.GetProjectImages(projectID, userID)
}

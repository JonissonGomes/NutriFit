package rest

import (
	"context"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/services/image"
)

func uploadImage(c *gin.Context) {
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

	projectID := c.PostForm("projectId")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do projeto é obrigatório"})
		return
	}

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo é obrigatório"})
		return
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao abrir arquivo"})
		return
	}
	defer src.Close()

	// Read file data
	fileData, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler arquivo"})
		return
	}

	// Upload image
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	uploadedImage, err := image.UploadImage(ctx, fileData, file.Filename, projectID, userIDStr)
	if err != nil {
		// Mensagens de erro em português
		errMsg := "Erro ao fazer upload da imagem"
		switch err.Error() {
		case "invalid image format":
			errMsg = "Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP."
		case "file too large":
			errMsg = "Arquivo muito grande. O tamanho máximo é 10MB."
		case "image dimensions too large":
			errMsg = "Dimensões da imagem muito grandes."
		case "storage limit exceeded":
			errMsg = "Limite de armazenamento excedido. Atualize seu plano para continuar."
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	c.JSON(http.StatusCreated, uploadedImage)
}

func uploadImagesBatch(c *gin.Context) {
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

	// TODO: Implement batch image upload
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func getImage(c *gin.Context) {
	// TODO: Implement get image
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func getImageURLs(c *gin.Context) {
	// TODO: Implement get image URLs
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func updateImage(c *gin.Context) {
	// TODO: Implement update image
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func deleteImage(c *gin.Context) {
	// TODO: Implement delete image
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

func reprocessImage(c *gin.Context) {
	// TODO: Implement reprocess image
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Funcionalidade em desenvolvimento"})
}

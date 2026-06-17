package rest

import (
	"net/http"
	"path/filepath"
	"strings"

	"nufit/backend/internal/services/storage"

	"github.com/gin-gonic/gin"
)

// serveMediaFile entrega arquivos do R2 quando não há URL pública configurada.
func serveMediaFile(c *gin.Context) {
	key := strings.TrimPrefix(c.Param("filepath"), "/")
	key = strings.TrimLeft(strings.ReplaceAll(key, "\\", "/"), "/")
	if key == "" || strings.Contains(key, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Caminho inválido"})
		return
	}

	data, err := storage.ReadObject(c.Request.Context(), key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo não encontrado"})
		return
	}

	contentType := "application/octet-stream"
	if ext := strings.ToLower(filepath.Ext(key)); ext != "" {
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".webp":
			contentType = "image/webp"
		case ".pdf":
			contentType = "application/pdf"
		case ".pptx":
			contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
		}
	}

	c.Header("Cache-Control", "public, max-age=86400")
	c.Data(http.StatusOK, contentType, data)
}

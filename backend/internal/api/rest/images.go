package rest

import (
	"context"
	"errors"
	"net/http"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/services/cloudinary"
	"arck-design/backend/internal/services/image"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

	if file.Size <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo inválido"})
		return
	}
	if file.Size > image.MaxImageSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande. O tamanho máximo é 10MB."})
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
	fileData, err := image.ReadImageFromReader(src, image.MaxImageSize)
	if err != nil {
		if errors.Is(err, image.ErrImageTooLarge) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande. O tamanho máximo é 10MB."})
			return
		}
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
		switch {
		case errors.Is(err, image.ErrInvalidFormat), errors.Is(err, image.ErrUnsupportedFormat):
			errMsg = "Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP."
		case errors.Is(err, image.ErrImageTooLarge):
			errMsg = "Arquivo muito grande. O tamanho máximo é 10MB."
		case errors.Is(err, image.ErrInvalidDimensions):
			errMsg = "Dimensões da imagem muito grandes."
		}
		if errors.Is(err, image.ErrImageTooLarge) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": errMsg})
			return
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

	projectID := c.PostForm("projectId")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do projeto é obrigatório"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "FormData inválido"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		files = form.File["file"]
	}
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivos são obrigatórios (campo: files)"})
		return
	}
	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Máximo de 10 imagens por envio"})
		return
	}

	type itemResult struct {
		Filename string      `json:"filename"`
		Data     interface{} `json:"data,omitempty"`
		Error    string      `json:"error,omitempty"`
	}

	results := make([]itemResult, 0, len(files))
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	for _, fh := range files {
		if fh == nil {
			continue
		}
		r := itemResult{Filename: fh.Filename}

		if fh.Size <= 0 {
			r.Error = "Arquivo inválido"
			results = append(results, r)
			continue
		}
		if fh.Size > image.MaxImageSize {
			r.Error = "Arquivo muito grande. O tamanho máximo é 10MB."
			results = append(results, r)
			continue
		}

		src, err := fh.Open()
		if err != nil {
			r.Error = "Erro ao abrir arquivo"
			results = append(results, r)
			continue
		}

		data, err := image.ReadImageFromReader(src, image.MaxImageSize)
		_ = src.Close()
		if err != nil {
			if errors.Is(err, image.ErrImageTooLarge) {
				r.Error = "Arquivo muito grande. O tamanho máximo é 10MB."
			} else {
				r.Error = "Erro ao ler arquivo"
			}
			results = append(results, r)
			continue
		}

		up, err := image.UploadImage(ctx, data, fh.Filename, projectID, userIDStr)
		if err != nil {
			switch {
			case errors.Is(err, image.ErrInvalidFormat), errors.Is(err, image.ErrUnsupportedFormat):
				r.Error = "Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP."
			case errors.Is(err, image.ErrImageTooLarge):
				r.Error = "Arquivo muito grande. O tamanho máximo é 10MB."
			case errors.Is(err, image.ErrInvalidDimensions):
				r.Error = "Dimensões da imagem muito grandes."
			default:
				r.Error = "Erro ao fazer upload da imagem"
			}
			results = append(results, r)
			continue
		}

		r.Data = up
		results = append(results, r)
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

func getImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Autenticação necessária"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Erro de autenticação"})
		return
	}

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var img bson.M
	err = database.ImagesCollection.FindOne(c.Request.Context(), bson.M{"_id": objID, "userId": userObjID}).Decode(&img)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Imagem não encontrada"})
		return
	}

	c.JSON(http.StatusOK, img)
}

func getImageURLs(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Autenticação necessária"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Erro de autenticação"})
		return
	}

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var img struct {
		URLs interface{} `bson:"urls" json:"urls"`
	}
	err = database.ImagesCollection.FindOne(c.Request.Context(), bson.M{"_id": objID, "userId": userObjID}).Decode(&img)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Imagem não encontrada"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": img.URLs})
}

func updateImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Autenticação necessária"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Erro de autenticação"})
		return
	}

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Caption  *string `json:"caption"`
		Position *int    `json:"position"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updates := bson.M{}
	if req.Caption != nil {
		updates["caption"] = *req.Caption
	}
	if req.Position != nil {
		updates["position"] = *req.Position
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum campo para atualizar"})
		return
	}
	updates["updatedAt"] = time.Now()

	res, err := database.ImagesCollection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objID, "userId": userObjID},
		bson.M{"$set": updates},
	)
	if err != nil || res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Imagem não encontrada"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func deleteImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Autenticação necessária"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Erro de autenticação"})
		return
	}

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var img struct {
		PublicID string `bson:"publicId"`
	}
	err = database.ImagesCollection.FindOne(c.Request.Context(), bson.M{"_id": objID, "userId": userObjID}).Decode(&img)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Imagem não encontrada"})
		return
	}

	_ = cloudinary.DeleteImage(c.Request.Context(), img.PublicID)

	_, err = database.ImagesCollection.DeleteOne(c.Request.Context(), bson.M{"_id": objID, "userId": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover imagem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func reprocessImage(c *gin.Context) {
	c.JSON(http.StatusBadRequest, gin.H{"error": "Reprocessamento não é necessário no momento (imagem é processada no upload)."})
}

package rest

import (
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/food_diary"
	"nufit/backend/internal/services/cloudinary"
	"nufit/backend/internal/services/security"
	"nufit/backend/internal/services/ai"
	"nufit/backend/internal/services/image"
	"go.mongodb.org/mongo-driver/bson"
)

func getFoodDiaryEntries(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "me" {
		if uid, ok := c.Get("userID"); ok {
			patientID = uid.(string)
		}
	} else {
		// aceitar ID opaco (usr_*)
		if decoded, err := security.DecodeUserID(patientID); err == nil {
			patientID = decoded
		}
	}

	var startDate, endDate *time.Time
	if startStr := c.Query("startDate"); startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = &t
		}
	}
	if endStr := c.Query("endDate"); endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = &t
		}
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	entries, err := food_diary.GetEntries(c.Request.Context(), patientID, startDate, endDate, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar diário alimentar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": entries})
}

func createFoodDiaryEntry(c *gin.Context) {
	var entry models.FoodDiaryEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	created, err := food_diary.CreateEntry(c.Request.Context(), entry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar registro"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func uploadFoodDiaryPhoto(c *gin.Context) {
	entryID := c.Param("id")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado (campo: file)"})
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

	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao abrir arquivo"})
		return
	}
	defer f.Close()

	buf, err := image.ReadImageFromReader(f, image.MaxImageSize)
	if err != nil {
		if err == image.ErrImageTooLarge {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande. O tamanho máximo é 10MB."})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler arquivo"})
		return
	}

	if err := image.ValidateImage(buf, image.MaxImageSize); err != nil {
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
	publicID := "nufit/food_diary/" + entryID + "/photo" + ext

	up, err := cloudinary.UploadImage(c.Request.Context(), buf, publicID, "nufit/food_diary")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fazer upload da foto"})
		return
	}

	updated, err := food_diary.UpdateEntry(c.Request.Context(), entryID, bson.M{"photoUrl": up.SecureURL})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar registro com foto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func analyzeFoodDiaryPhoto(c *gin.Context) {
	entryID := c.Param("id")

	entry, err := food_diary.GetEntry(c.Request.Context(), entryID)
	if err != nil {
		if err == food_diary.ErrEntryNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registro não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar registro"})
		return
	}
	if entry.PhotoURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Registro não possui foto"})
		return
	}

	client := ai.NewGeminiClient()
	if client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "IA não disponível"})
		return
	}

	prompt := "Analise a foto da refeição e responda em português com: (1) lista de alimentos prováveis, (2) estimativa aproximada de calorias, (3) observações nutricionais rápidas. Seja conservador e diga quando não tiver certeza."
	text, err := client.AnalyzeImage(c.Request.Context(), entry.PhotoURL, prompt)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}

	analysis := models.AIAnalysis{
		Classification: models.AIClassificationAttention,
		Foods:          []string{},
		Calories:       0,
		Confidence:     0.35,
		Notes:          text,
		AnalyzedAt:     time.Now(),
	}

	if err := food_diary.UpdateAIAnalysis(c.Request.Context(), entryID, analysis); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar análise"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": analysis})
}

func addNutritionistComment(c *gin.Context) {
	entryID := c.Param("id")

	var req struct {
		Comment string `json:"comment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comentário inválido"})
		return
	}

	err := food_diary.AddNutritionistComment(c.Request.Context(), entryID, req.Comment)
	if err != nil {
		if err == food_diary.ErrEntryNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Registro não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar comentário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comentário adicionado com sucesso"})
}

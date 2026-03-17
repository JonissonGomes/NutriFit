package rest

import (
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/food_diary"
	"arck-design/backend/internal/services/cloudinary"
	"arck-design/backend/internal/services/security"
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

	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao abrir arquivo"})
		return
	}
	defer f.Close()

	buf := make([]byte, fileHeader.Size)
	_, err = f.Read(buf)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler arquivo"})
		return
	}

	ext := filepath.Ext(fileHeader.Filename)
	publicID := "nutrifit/food_diary/" + entryID + "/photo" + ext

	up, err := cloudinary.UploadImage(c.Request.Context(), buf, publicID, "nutrifit/food_diary")
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
	// TODO: Implementar com integração Gemini Vision
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Análise por IA em desenvolvimento"})
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

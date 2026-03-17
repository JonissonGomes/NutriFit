package rest

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/lab_exam"
	"nufit/backend/internal/services/security"
	"nufit/backend/internal/services/cloudinary"
	"nufit/backend/internal/services/ai"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func getLabExams(c *gin.Context) {
	patientID := c.Param("patientId")
	if patientID == "me" {
		if uid, ok := c.Get("userID"); ok {
			patientID = uid.(string)
		}
	} else if decoded, err := security.DecodeUserID(patientID); err == nil {
		patientID = decoded
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	items, err := lab_exam.ListByPatient(c.Request.Context(), patientID, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao carregar exames"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createLabExam(c *gin.Context) {
	var req models.LabExam
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	created, err := lab_exam.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar exame"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateLabExam(c *gin.Context) {
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	updates := bson.M{}
	for k, v := range req {
		updates[k] = v
	}

	updated, err := lab_exam.Update(c.Request.Context(), id, updates)
	if err != nil {
		if err == lab_exam.ErrLabExamNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exame não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar exame"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteLabExam(c *gin.Context) {
	id := c.Param("id")
	if err := lab_exam.Delete(c.Request.Context(), id); err != nil {
		if err == lab_exam.ErrLabExamNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exame não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar exame"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Exame removido"})
}

func uploadLabExamFile(c *gin.Context) {
	id := c.Param("id")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado (campo: file)"})
		return
	}

	// salvar temporariamente (UploadRaw usa filePath)
	tmpDir := os.TempDir()
	tmpPath := filepath.Join(tmpDir, "nufit_lab_exam_"+id+filepath.Ext(fileHeader.Filename))
	if err := c.SaveUploadedFile(fileHeader, tmpPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar arquivo"})
		return
	}
	defer os.Remove(tmpPath)

	up, err := cloudinary.UploadRaw(c.Request.Context(), tmpPath, "nufit/lab_exams")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fazer upload do exame"})
		return
	}

	updated, err := lab_exam.Update(c.Request.Context(), id, bson.M{"fileUrl": up.SecureURL})
	if err != nil {
		if err == lab_exam.ErrLabExamNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exame não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar exame"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func analyzeLabExamWithAI(c *gin.Context) {
	id := c.Param("id")

	exam, err := lab_exam.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == lab_exam.ErrLabExamNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exame não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar exame"})
		return
	}

	client := ai.NewGeminiClient()
	if client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "IA não disponível"})
		return
	}

	prompt := "Você é um nutricionista. Analise os resultados do exame (texto) e retorne: resumo, achados principais, recomendações nutricionais. Seja cuidadoso e ressalte limites. Texto:\n\n" + exam.RawText
	if exam.RawText == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exame sem texto (rawText). Envie rawText via PUT ou implemente extração OCR/PDF."})
		return
	}

	system := "Responda em português e em tópicos curtos. Evite diagnósticos definitivos."
	out, err := client.GenerateText(c.Request.Context(), prompt, system)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}

	analysis := models.LabExamAIAnalysis{
		Summary:          out,
		Findings:         []string{},
		Recommendations:  []string{},
		Concerns:         []string{},
		AnalyzedAt:       time.Now(),
	}

	updated, err := lab_exam.Update(c.Request.Context(), id, bson.M{"aiAnalysis": analysis})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar análise"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

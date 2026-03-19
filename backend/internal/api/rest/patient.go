package rest

import (
	"encoding/csv"
	"net/http"
	"strings"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/patient"
	"nufit/backend/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func listPatients(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	patients, total, err := patient.ListPatients(c.Request.Context(), userIDStr, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar pacientes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": patients,
		"total": total,
		"page": page,
		"limit": limit,
	})
}

func createPatient(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req struct {
		UserID string `json:"userId,omitempty"`
		Name   string `json:"name"`
		Email  string `json:"email,omitempty"`
		Phone  string `json:"phone,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	p := patient.Patient{
		Name:  strings.TrimSpace(req.Name),
		Email: strings.TrimSpace(req.Email),
		Phone: strings.TrimSpace(req.Phone),
	}
	if p.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nome é obrigatório"})
		return
	}

	if req.UserID != "" {
		if oid, err := primitive.ObjectIDFromHex(req.UserID); err == nil {
			p.PlatformUserID = &oid
		}
	}

	createdPatient, err := patient.CreatePatient(c.Request.Context(), userIDStr, p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar paciente"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": createdPatient})
}

func getPatient(c *gin.Context) {
	patientID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	p, err := patient.GetPatient(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		if err == patient.ErrPatientNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar paciente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": p})
}

func updatePatient(c *gin.Context) {
	patientID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	updates := bson.M{}
	for k, v := range req {
		updates[k] = v
	}

	updatedPatient, err := patient.UpdatePatient(c.Request.Context(), patientID, userIDStr, updates)
	if err != nil {
		if err == patient.ErrPatientNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar paciente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updatedPatient})
}

func deletePatient(c *gin.Context) {
	patientID := c.Param("id")
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

	err := patient.DeletePatient(c.Request.Context(), patientID, userIDStr)
	if err != nil {
		if err == patient.ErrPatientNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover paciente"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Paciente removido com sucesso"})
}

func importPatients(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr := userID.(string)

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

	reader := csv.NewReader(f)
	reader.FieldsPerRecord = -1
	rows, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV inválido"})
		return
	}
	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV sem dados"})
		return
	}

	// Cabeçalho esperado (flexível): name,email,phone,dateOfBirth,gender,address,notes,isActive
	header := make(map[string]int)
	for i, h := range rows[0] {
		header[strings.ToLower(strings.TrimSpace(h))] = i
	}

	get := func(row []string, key string) string {
		idx, ok := header[key]
		if !ok || idx < 0 || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}

	created := 0
	skipped := 0
	var errorsList []string

	for i := 1; i < len(rows); i++ {
		row := rows[i]
		name := get(row, "name")
		email := get(row, "email")
		phone := get(row, "phone")

		if name == "" {
			skipped++
			continue
		}

		var dobPtr *time.Time
		if dob := get(row, "dateofbirth"); dob != "" {
			if t, parseErr := time.Parse("2006-01-02", dob); parseErr == nil {
				dobPtr = &t
			}
		}

		p := patient.Patient{
			Name:        name,
			Email:       email,
			Phone:       phone,
			Gender:      get(row, "gender"),
			Address:     get(row, "address"),
			Notes:       get(row, "notes"),
			DateOfBirth: dobPtr,
		}

		if _, err := patient.CreatePatient(c.Request.Context(), userIDStr, p); err != nil {
			errorsList = append(errorsList, "linha "+strconv.Itoa(i+1)+": "+err.Error())
			continue
		}
		created++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Importação concluída",
		"created": created,
		"skipped": skipped,
		"errors":  errorsList,
	})
}

type platformPatientResult struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email,omitempty"`
	Phone  string `json:"phone,omitempty"`
	Avatar string `json:"avatar,omitempty"`
}

// searchPlatformPatients busca pacientes já cadastrados na plataforma por nome/email.
// Útil para o profissional adicionar rapidamente alguém na sua lista de pacientes.
func searchPlatformPatients(c *gin.Context) {
	query := strings.TrimSpace(c.Query("query"))
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Informe query"})
		return
	}

	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 25 {
			limit = parsed
		}
	}

	// Usar regex no formato $regex/$options para máxima compatibilidade
	// (evita problemas de serialização dependendo do driver/versão).
	regexFilter := bson.M{"$regex": query, "$options": "i"}
	filter := bson.M{
		"role": string(models.RolePaciente),
		"$or": []bson.M{
			{"name": regexFilter},
			{"email": regexFilter},
		},
	}

	opts := options.Find().
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "updatedAt", Value: -1}, {Key: "createdAt", Value: -1}}).
		SetProjection(bson.M{"name": 1, "email": 1, "phone": 1, "avatar": 1})

	cur, err := database.UsersCollection.Find(c.Request.Context(), filter, opts)
	if err != nil {
		// Em dev, esse log ajuda a identificar index/serialização/estrutura de dados.
		utils.Debug("searchPlatformPatients error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar pacientes na plataforma"})
		return
	}
	defer cur.Close(c.Request.Context())

	type userDoc struct {
		ID     primitive.ObjectID `bson:"_id"`
		Name   string             `bson:"name"`
		Email  string             `bson:"email"`
		Phone  string             `bson:"phone,omitempty"`
		Avatar string             `bson:"avatar,omitempty"`
	}

	var docs []userDoc
	if err := cur.All(c.Request.Context(), &docs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler resultados"})
		return
	}

	out := make([]platformPatientResult, 0, len(docs))
	for _, d := range docs {
		out = append(out, platformPatientResult{
			ID:     d.ID.Hex(),
			Name:   d.Name,
			Email:  d.Email,
			Phone:  d.Phone,
			Avatar: d.Avatar,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": out})
}

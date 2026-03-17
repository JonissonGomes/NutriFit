package rest

import (
	"encoding/csv"
	"net/http"
	"strings"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/services/patient"
	"go.mongodb.org/mongo-driver/bson"
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

	var req patient.Patient
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	createdPatient, err := patient.CreatePatient(c.Request.Context(), userIDStr, req)
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

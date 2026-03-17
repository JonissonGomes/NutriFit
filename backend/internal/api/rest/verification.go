package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============================================
// HANDLERS DE VERIFICAÇÃO - ARQUITETO
// ============================================

// getVerificationStatus retorna o status de verificação do nutricionista
func getVerificationStatus(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var profile models.PublicProfile
	err = database.PublicProfilesCollection.FindOne(ctx, bson.M{"userId": userObjID}).Decode(&profile)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
		return
	}

	status := map[string]interface{}{
		"verified":       false,
		"cauVerified":    false,
		"documentsCount": 0,
		"pendingReview":  false,
	}

	if profile.Verification != nil {
		status["verified"] = profile.Verification.Verified
		status["cauVerified"] = profile.Verification.CAUVerified
		status["cauNumber"] = profile.Verification.CAUNumber
		status["documentsCount"] = len(profile.Verification.Documents)
		status["verifiedAt"] = profile.Verification.VerifiedAt
		// Se tem documentos mas não está verificado, está pendente
		status["pendingReview"] = len(profile.Verification.Documents) > 0 && !profile.Verification.Verified
	}

	c.JSON(http.StatusOK, status)
}

// uploadVerificationDocument faz upload de documento para verificação
func uploadVerificationDocument(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		Type string `json:"type" binding:"required"` // cau, identity
		URL  string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo e URL do documento são obrigatórios"})
		return
	}

	if req.Type != "cau" && req.Type != "identity" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de documento inválido. Use 'cau' ou 'identity'"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Verificar se perfil existe
	var profile models.PublicProfile
	err = database.PublicProfilesCollection.FindOne(ctx, bson.M{"userId": userObjID}).Decode(&profile)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado. Crie seu perfil primeiro."})
		return
	}

	// Criar documento
	newDoc := models.VerificationDocument{
		Type:       req.Type,
		URL:        req.URL,
		VerifiedAt: time.Now(), // Data de upload, não de verificação
	}

	// Atualizar ou criar verificação
	update := bson.M{
		"$push": bson.M{
			"verification.documents": newDoc,
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	// Se verificação não existe, inicializar
	if profile.Verification == nil {
		update = bson.M{
			"$set": bson.M{
				"verification": bson.M{
					"verified":    false,
					"cauVerified": false,
					"documents":   []models.VerificationDocument{newDoc},
				},
				"updatedAt": time.Now(),
			},
		}
	}

	_, err = database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"userId": userObjID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar documento"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Documento enviado com sucesso. Aguarde a análise da equipe.",
	})
}

// ============================================
// HANDLERS DE VERIFICAÇÃO - ADMIN
// ============================================

// listPendingVerifications lista verificações pendentes
func listPendingVerifications(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Filtro: tem documentos mas não está verificado
	filter := bson.M{
		"verification.documents": bson.M{"$exists": true, "$ne": []interface{}{}},
		"verification.verified":  false,
	}

	// Contar total
	total, err := database.PublicProfilesCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao contar verificações"})
		return
	}

	// Buscar
	skip := int64((page - 1) * limit)
	findOptions := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: 1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := database.PublicProfilesCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar verificações"})
		return
	}
	defer cursor.Close(ctx)

	var profiles []models.PublicProfile
	if err = cursor.All(ctx, &profiles); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao decodificar verificações"})
		return
	}

	// Mapear para resposta
	result := make([]map[string]interface{}, len(profiles))
	for i, p := range profiles {
		result[i] = map[string]interface{}{
			"profileId":      p.ID,
			"userId":         p.UserID,
			"username":       p.Username,
			"displayName":    p.DisplayName,
			"avatar":         p.Avatar,
			"cau":            p.CAU,
			"verification":   p.Verification,
			"createdAt":      p.CreatedAt,
		}
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       result,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// getVerificationDetails obtém detalhes de uma verificação pendente
func getVerificationDetails(c *gin.Context) {
	profileID := c.Param("id")

	profileObjID, err := primitive.ObjectIDFromHex(profileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de perfil inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var profile models.PublicProfile
	err = database.PublicProfilesCollection.FindOne(ctx, bson.M{"_id": profileObjID}).Decode(&profile)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
		return
	}

	c.JSON(http.StatusOK, map[string]interface{}{
		"profile":      profile,
		"verification": profile.Verification,
	})
}

// approveVerification aprova a verificação de um nutricionista
func approveVerification(c *gin.Context) {
	adminID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	profileID := c.Param("id")

	profileObjID, err := primitive.ObjectIDFromHex(profileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de perfil inválido"})
		return
	}

	adminObjID, err := primitive.ObjectIDFromHex(adminID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de admin inválido"})
		return
	}

	var req struct {
		VerifyCAU bool   `json:"verifyCAU"`
		Notes     string `json:"notes"`
	}
	c.ShouldBindJSON(&req)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	now := time.Now()

	update := bson.M{
		"$set": bson.M{
			"verification.verified":   true,
			"verification.cauVerified": req.VerifyCAU,
			"verification.verifiedAt": now,
			"verification.verifiedBy": adminObjID,
			"updatedAt":               now,
		},
	}

	result, err := database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"_id": profileObjID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao aprovar verificação"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
		return
	}

	// TODO: Registrar ação de admin
	// TODO: Enviar notificação para o nutricionista

	c.JSON(http.StatusOK, gin.H{
		"message": "Verificação aprovada com sucesso",
	})
}

// rejectVerification rejeita a verificação de um nutricionista
func rejectVerification(c *gin.Context) {
	adminID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	profileID := c.Param("id")

	profileObjID, err := primitive.ObjectIDFromHex(profileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de perfil inválido"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Motivo da rejeição é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Limpar documentos e marcar como não verificado
	update := bson.M{
		"$set": bson.M{
			"verification.verified":    false,
			"verification.cauVerified": false,
			"verification.documents":   []interface{}{},
			"updatedAt":                time.Now(),
		},
	}

	result, err := database.PublicProfilesCollection.UpdateOne(
		ctx,
		bson.M{"_id": profileObjID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao rejeitar verificação"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
		return
	}

	// TODO: Registrar ação de admin com razão
	// TODO: Enviar notificação para o nutricionista com o motivo
	_ = adminID // Usado para log de auditoria

	c.JSON(http.StatusOK, gin.H{
		"message": "Verificação rejeitada",
		"reason":  req.Reason,
	})
}




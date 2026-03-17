package rest

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/api/dto"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/auth"
	"nufit/backend/internal/services/cfm"
	"nufit/backend/internal/utils"
)

func register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Verifique os campos obrigatórios."})
		return
	}

	user, tokens, err := auth.Register(&req)
	if err != nil {
		errMsg := "Erro ao criar conta"
		switch err.Error() {
		case "user already exists":
			errMsg = "Este e-mail já está cadastrado"
		case "este CRN/CRM já está cadastrado na plataforma":
			errMsg = err.Error()
		default:
			if strings.HasPrefix(err.Error(), "CRN") || strings.HasPrefix(err.Error(), "CRM") || strings.Contains(err.Error(), "obrigatório") || strings.Contains(err.Error(), "formato") {
				errMsg = err.Error()
			}
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	// Usar DTO seguro que não expõe IDs internos
	response := dto.NewAuthPayloadResponse(user, tokens.AccessToken, tokens.RefreshToken)
	c.JSON(http.StatusCreated, response)
}

func login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	user, tokens, err := auth.Login(req.Email, req.Password)
	if err != nil {
		errMsg := "E-mail ou senha incorretos"
		if err.Error() == "password login not available for this user" {
			errMsg = "Faça login com o mesmo método utilizado no cadastro (e-mail e senha)."
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": errMsg})
		return
	}

	// Usar DTO seguro que não expõe IDs internos
	response := dto.NewAuthPayloadResponse(user, tokens.AccessToken, tokens.RefreshToken)
	c.JSON(http.StatusOK, response)
}

func refreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token de atualização não fornecido"})
		return
	}

	newAccessToken, err := auth.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada. Faça login novamente."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken": newAccessToken,
	})
}

func logout(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	err := auth.RevokeRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao encerrar sessão"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sessão encerrada com sucesso"})
}

func validateCRM(c *gin.Context) {
	uf := strings.TrimSpace(strings.ToUpper(c.Query("uf")))
	number := strings.TrimSpace(c.Query("number"))
	if uf == "" || number == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetros uf e number são obrigatórios"})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 12*time.Second)
	defer cancel()
	valid, err := cfm.NewClient().ValidateCRM(ctx, uf, number)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "Não foi possível verificar no portal do CFM no momento"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"valid": valid, "error": ""})
}

func checkRegistrationAvailable(c *gin.Context) {
	regType := strings.TrimSpace(c.Query("type"))
	number := strings.TrimSpace(c.Query("number"))
	utils.Debug("[auth] check-registration: type=%q number=%q", regType, number)
	if regType != "CRN" && regType != "CRM" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetro type deve ser CRN ou CRM"})
		return
	}
	if number == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetro number é obrigatório"})
		return
	}
	available, err := auth.CheckProfessionalRegistrationAvailable(regType, number)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar disponibilidade"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"available": available})
}

func getMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	user, err := auth.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Usar DTO seguro que não expõe IDs internos
	response := dto.NewUserResponse(user)
	c.JSON(http.StatusOK, response)
}

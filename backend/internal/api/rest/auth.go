package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/api/dto"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/auth"
)

func register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Verifique os campos obrigatórios."})
		return
	}

	user, tokens, err := auth.Register(req.Email, req.Password, req.Name, models.UserRole(req.Role))
	if err != nil {
		// Mensagens de erro em português
		errMsg := "Erro ao criar conta"
		if err.Error() == "user already exists" {
			errMsg = "Este e-mail já está cadastrado"
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

	user, tokens, err := auth.Login(req.Email, req.Password, models.UserRole(req.Type))
	if err != nil {
		// Mensagens de erro em português
		errMsg := "E-mail ou senha incorretos"
		if err.Error() == "invalid user role" {
			errMsg = "Tipo de conta não corresponde ao cadastro. Verifique se selecionou o tipo correto."
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": errMsg})
		return
	}

	// Usar DTO seguro que não expõe IDs internos
	response := dto.NewAuthPayloadResponse(user, tokens.AccessToken, tokens.RefreshToken)
	c.JSON(http.StatusOK, response)
}

// OAuth Google - Temporariamente desabilitado
// func oauthGoogle(c *gin.Context) {
// 	var req models.OAuthGoogleRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}
//
// 	user, tokens, err := auth.OAuthGoogle(req.Code)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}
//
// 	response := dto.NewAuthPayloadResponse(user, tokens.AccessToken, tokens.RefreshToken)
// 	c.JSON(http.StatusOK, response)
// }

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

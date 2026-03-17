package dto

import (
	"time"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/security"
)

// ============================================
// DTOs PARA USUÁRIOS
// ============================================
//
// Estes DTOs são usados para retornar dados aos clientes
// sem expor informações sensíveis como IDs internos.
//

// UserResponse é a resposta pública de um usuário
type UserResponse struct {
	// Token opaco em vez de ID
	Token string `json:"id"`
	
	// Dados públicos
	Name         string  `json:"name"`
	Email        string  `json:"email"`
	Role         string  `json:"role"`
	Avatar       string  `json:"avatar,omitempty"`
	Plan         string  `json:"plan"`
	
	// Estatísticas (sem valores exatos quando apropriado)
	StorageUsedPercent float64 `json:"storageUsedPercent"`
	
	// Timestamps
	CreatedAt time.Time `json:"createdAt"`
}

// AuthPayloadResponse é a resposta de autenticação
type AuthPayloadResponse struct {
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	User         UserResponse `json:"user"`
}

// NewUserResponse cria uma resposta segura de usuário
func NewUserResponse(user *models.User) UserResponse {
	token, _ := security.EncodeUserID(user.ID.Hex())
	
	// Calcular percentual de uso ao invés de valores exatos
	storagePercent := 0.0
	if user.StorageLimit > 0 {
		storagePercent = float64(user.StorageUsed) / float64(user.StorageLimit) * 100
	}
	
	return UserResponse{
		Token:              token,
		Name:               user.Name,
		Email:              user.Email,
		Role:               string(user.Role),
		Avatar:             user.Avatar,
		Plan:               string(user.Plan),
		StorageUsedPercent: storagePercent,
		CreatedAt:          user.CreatedAt,
	}
}

// NewAuthPayloadResponse cria uma resposta segura de autenticação
func NewAuthPayloadResponse(user *models.User, accessToken, refreshToken string) AuthPayloadResponse {
	return AuthPayloadResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         NewUserResponse(user),
	}
}

// UserPublicResponse é a resposta pública mínima de um usuário (para listagens)
type UserPublicResponse struct {
	Token  string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar,omitempty"`
	Role   string `json:"role"`
}

// NewUserPublicResponse cria uma resposta pública mínima
func NewUserPublicResponse(user *models.User) UserPublicResponse {
	token, _ := security.EncodeUserID(user.ID.Hex())
	
	return UserPublicResponse{
		Token:  token,
		Name:   user.Name,
		Avatar: user.Avatar,
		Role:   string(user.Role),
	}
}




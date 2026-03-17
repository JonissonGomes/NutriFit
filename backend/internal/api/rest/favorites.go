package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"nufit/backend/internal/services/favorite"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE FAVORITOS
// ============================================

// listFavorites lista os nutricionistas favoritos do paciente
func listFavorites(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

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

	favorites, total, err := favorite.GetFavorites(ctx, userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar favoritos"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       favorites,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// addFavorite adiciona um nutricionista aos favoritos
func addFavorite(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	architectID := c.Param("architectId")
	if architectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do nutricionista é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	fav, err := favorite.AddFavorite(ctx, userID.(string), architectID)
	if err != nil {
		switch err {
		case favorite.ErrAlreadyFavorited:
			c.JSON(http.StatusConflict, gin.H{"error": "Arquiteto já está nos favoritos"})
		case favorite.ErrSelfFavorite:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível favoritar a si mesmo"})
		case favorite.ErrInvalidData:
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar favorito"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Arquiteto adicionado aos favoritos",
		"favorite": fav,
	})
}

// removeFavorite remove um nutricionista dos favoritos
func removeFavorite(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	architectID := c.Param("architectId")
	if architectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do nutricionista é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := favorite.RemoveFavorite(ctx, userID.(string), architectID)
	if err != nil {
		switch err {
		case favorite.ErrNotFavorited:
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquiteto não está nos favoritos"})
		case favorite.ErrInvalidData:
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover favorito"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Arquiteto removido dos favoritos"})
}

// checkFavorite verifica se um nutricionista está nos favoritos
func checkFavorite(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	architectID := c.Param("architectId")
	if architectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do nutricionista é obrigatório"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	isFavorited, err := favorite.IsFavorited(ctx, userID.(string), architectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar favorito"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isFavorite": isFavorited})
}



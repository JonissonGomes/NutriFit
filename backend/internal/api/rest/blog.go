package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/blog"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE BLOG
// ============================================

// listBlogPosts lista posts do blog com filtros
func listBlogPosts(c *gin.Context) {
	var filters models.BlogPostFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetros inválidos"})
		return
	}

	// Se não for autenticado, mostrar apenas publicados
	if _, exists := c.Get("userID"); !exists {
		published := true
		filters.Published = &published
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	result, err := blog.ListPosts(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar posts"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// getBlogPostBySlug busca um post pelo slug
func getBlogPostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	post, err := blog.GetPostBySlug(ctx, slug, true) // Incrementar views
	if err != nil {
		if err == blog.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar post"})
		return
	}

	// Verificar se o post está publicado (se não for o autor)
	userID, _ := c.Get("userID")
	if !post.Published && (userID == nil || userID.(string) != post.AuthorID.Hex()) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// createBlogPost cria um novo post
func createBlogPost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Verificar se é arquiteto
	userRole, _ := c.Get("userRole")
	if userRole != "nutricionista" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Apenas nutricionistas podem criar posts"})
		return
	}

	userName, _ := c.Get("userName")
	userNameStr := ""
	if userName != nil {
		userNameStr = userName.(string)
	}

	userAvatar, _ := c.Get("userAvatar")
	userAvatarStr := ""
	if userAvatar != nil {
		userAvatarStr = userAvatar.(string)
	}

	userUsername, _ := c.Get("userUsername")
	userUsernameStr := ""
	if userUsername != nil {
		userUsernameStr = userUsername.(string)
	}

	userSpecialty, _ := c.Get("userSpecialty")
	userSpecialtyStr := ""
	if userSpecialty != nil {
		userSpecialtyStr = userSpecialty.(string)
	}

	var req models.CreateBlogPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	post, err := blog.CreatePost(ctx, userID.(string), userNameStr, userAvatarStr, userUsernameStr, userSpecialtyStr, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar post"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

// updateBlogPost atualiza um post
func updateBlogPost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	postID := c.Param("id")

	var req models.UpdateBlogPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	post, err := blog.UpdatePost(ctx, postID, userID.(string), req)
	if err != nil {
		if err == blog.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
			return
		}
		if err == blog.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para editar este post"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// deleteBlogPost deleta um post
func deleteBlogPost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	userRole, _ := c.Get("userRole")
	isAdmin := userRole == "admin"

	postID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := blog.DeletePost(ctx, postID, userID.(string), isAdmin)
	if err != nil {
		if err == blog.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
			return
		}
		if err == blog.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para deletar este post"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deletado com sucesso"})
}

// likeBlogPost curte um post
func likeBlogPost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	postID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	post, err := blog.LikePost(ctx, postID, userID.(string))
	if err != nil {
		if err == blog.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
			return
		}
		if err == blog.ErrAlreadyLiked {
			c.JSON(http.StatusConflict, gin.H{"error": "Você já curtiu este post"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao curtir post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// unlikeBlogPost remove a curtida de um post
func unlikeBlogPost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	postID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	post, err := blog.UnlikePost(ctx, postID, userID.(string))
	if err != nil {
		if err == blog.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover curtida"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// getBlogCategories retorna as categorias disponíveis
func getBlogCategories(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	categories, err := blog.GetCategories(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar categorias"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// getFeaturedBlogPosts retorna os posts em destaque
func getFeaturedBlogPosts(c *gin.Context) {
	limit := 5
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	posts, err := blog.GetFeaturedPosts(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar posts em destaque"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

// getPopularBlogPosts retorna os posts mais populares
func getPopularBlogPosts(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	posts, err := blog.GetPopularPosts(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar posts populares"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

// getRecentBlogPosts retorna os posts mais recentes
func getRecentBlogPosts(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	posts, err := blog.GetRecentPosts(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar posts recentes"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

// getBlogPostsByAuthor retorna os posts de um autor
func getBlogPostsByAuthor(c *gin.Context) {
	authorID := c.Param("authorId")

	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	posts, err := blog.GetPostsByAuthor(ctx, authorID, limit, true) // Apenas publicados
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar posts do autor"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

// getRelatedBlogPosts retorna posts relacionados
func getRelatedBlogPosts(c *gin.Context) {
	postID := c.Param("postId")

	limit := 5
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	posts, err := blog.GetRelatedPosts(ctx, postID, limit)
	if err != nil {
		if err == blog.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar posts relacionados"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

// getBlogStats retorna estatísticas do blog
func getBlogStats(c *gin.Context) {
	userID := ""
	if id, exists := c.Get("userID"); exists {
		userID = id.(string)
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	stats, err := blog.GetBlogStats(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// getMyBlogPosts retorna os posts do usuário autenticado
func getMyBlogPosts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	posts, err := blog.GetPostsByAuthor(ctx, userID.(string), limit, false) // Incluir rascunhos
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar seus posts"})
		return
	}

	c.JSON(http.StatusOK, posts)
}


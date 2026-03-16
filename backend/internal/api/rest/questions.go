package rest

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/question"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE PERGUNTAS AO ESPECIALISTA
// ============================================

// listQuestions lista perguntas com filtros
func listQuestions(c *gin.Context) {
	var filters models.QuestionFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetros inválidos"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	result, err := question.ListQuestions(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar perguntas"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// getQuestionByID busca uma pergunta por ID
func getQuestionByID(c *gin.Context) {
	id := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.GetQuestionByID(ctx, id)
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar pergunta"})
		return
	}

	c.JSON(http.StatusOK, questionResult)
}

// createQuestion cria uma nova pergunta
func createQuestion(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	userName, _ := c.Get("userName")
	userNameStr := ""
	if userName != nil {
		userNameStr = userName.(string)
	}

	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.CreateQuestion(ctx, userID.(string), userNameStr, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar pergunta"})
		return
	}

	c.JSON(http.StatusCreated, questionResult)
}

// updateQuestion atualiza uma pergunta
func updateQuestion(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	questionID := c.Param("id")

	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.UpdateQuestion(ctx, questionID, userID.(string), req)
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		if err == question.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para editar esta pergunta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar pergunta"})
		return
	}

	c.JSON(http.StatusOK, questionResult)
}

// deleteQuestion deleta uma pergunta
func deleteQuestion(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	userRole, _ := c.Get("userRole")
	isAdmin := userRole == "admin"

	questionID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := question.DeleteQuestion(ctx, questionID, userID.(string), isAdmin)
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		if err == question.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para deletar esta pergunta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar pergunta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pergunta deletada com sucesso"})
}

// closeQuestion fecha uma pergunta
func closeQuestion(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	questionID := c.Param("id")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.CloseQuestion(ctx, questionID, userID.(string))
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		if err == question.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para fechar esta pergunta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fechar pergunta"})
		return
	}

	c.JSON(http.StatusOK, questionResult)
}

// addAnswer adiciona uma resposta a uma pergunta
func addAnswer(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	// Verificar se é arquiteto
	userRole, _ := c.Get("userRole")
	if userRole != "arquiteto" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Apenas arquitetos podem responder perguntas"})
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

	questionID := c.Param("id")

	var req models.CreateAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.AddAnswer(ctx, questionID, userID.(string), userNameStr, userAvatarStr, req.Content)
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		if err == question.ErrCannotAnswerOwn {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode responder sua própria pergunta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar resposta"})
		return
	}

	c.JSON(http.StatusCreated, questionResult)
}

// markBestAnswer marca uma resposta como a melhor
func markBestAnswer(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	questionID := c.Param("id")
	answerID := c.Param("answerId")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.MarkBestAnswer(ctx, questionID, answerID, userID.(string))
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		if err == question.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Apenas o autor da pergunta pode marcar a melhor resposta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar melhor resposta"})
		return
	}

	c.JSON(http.StatusOK, questionResult)
}

// markAnswerHelpful marca uma resposta como útil
func markAnswerHelpful(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return
	}

	questionID := c.Param("id")
	answerID := c.Param("answerId")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questionResult, err := question.MarkAnswerHelpful(ctx, questionID, answerID, userID.(string))
	if err != nil {
		if err == question.ErrQuestionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pergunta não encontrada"})
			return
		}
		if err == question.ErrAlreadyMarkedHelpful {
			c.JSON(http.StatusConflict, gin.H{"error": "Você já marcou esta resposta como útil"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar resposta como útil"})
		return
	}

	c.JSON(http.StatusOK, questionResult)
}

// getQuestionStats retorna estatísticas de perguntas
func getQuestionStats(c *gin.Context) {
	userID := ""
	if id, exists := c.Get("userID"); exists {
		userID = id.(string)
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	stats, err := question.GetQuestionStats(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// getPopularQuestions retorna as perguntas mais populares
func getPopularQuestions(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questions, err := question.GetPopularQuestions(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar perguntas populares"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

// getQuestionsByArchitect retorna perguntas respondidas por um arquiteto
func getQuestionsByArchitect(c *gin.Context) {
	architectID := c.Param("architectId")

	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	questions, err := question.GetQuestionsByArchitect(ctx, architectID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar perguntas do arquiteto"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

package rest

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/cloudinary"
	"nufit/backend/internal/services/image"
	"nufit/backend/internal/services/recipe"
)

type recipeUpsertRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Ingredients []string `json:"ingredients"`
	Steps       []string `json:"steps"`
	MealGroups  []string `json:"mealGroups"`
	Filters     []string `json:"filters"`
	Calories    float64  `json:"calories"`
	IsPublic    bool     `json:"isPublic"`
	PatientIDs  []string `json:"patientIds"`
	MealPlanIDs []string `json:"mealPlanIds"`
}

func toObjectIDs(ids []string) []primitive.ObjectID {
	out := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids {
		v := strings.TrimSpace(id)
		if v == "" {
			continue
		}
		if oid, err := primitive.ObjectIDFromHex(v); err == nil {
			out = append(out, oid)
		}
	}
	return out
}

func listMyRecipes(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRoleAny, _ := c.Get("userRole")
	if userRole, _ := userRoleAny.(string); userRole == string(models.RolePaciente) {
		items, err := recipe.ListForPatient(c.Request.Context(), userID.(string), 100)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar receitas"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": items})
		return
	}
	items, err := recipe.ListByNutritionist(c.Request.Context(), userID.(string), 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar receitas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func listPublicRecipesByNutritionist(c *gin.Context) {
	nutritionistID := c.Param("nutritionistId")
	items, err := recipe.ListPublicByNutritionist(c.Request.Context(), nutritionistID, 24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar receitas públicas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func createRecipe(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req recipeUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Título é obrigatório"})
		return
	}
	in := models.Recipe{
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Ingredients: req.Ingredients,
		Steps:       req.Steps,
		MealGroups:  req.MealGroups,
		Filters:     req.Filters,
		Calories:    req.Calories,
		IsPublic:    req.IsPublic,
		PatientIDs:  toObjectIDs(req.PatientIDs),
		MealPlanIDs: toObjectIDs(req.MealPlanIDs),
	}
	created, err := recipe.Create(c.Request.Context(), userID.(string), in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar receita"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": created})
}

func updateRecipe(c *gin.Context) {
	userID, _ := c.Get("userID")
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	updates := bson.M{}
	for key, value := range req {
		switch key {
		case "title", "description":
			if s, ok := value.(string); ok {
				updates[key] = strings.TrimSpace(s)
			}
		case "ingredients", "steps", "mealGroups", "filters", "calories", "isPublic":
			updates[key] = value
		case "patientIds", "mealPlanIds":
			if arr, ok := value.([]interface{}); ok {
				ids := make([]string, 0, len(arr))
				for _, item := range arr {
					if s, ok := item.(string); ok {
						ids = append(ids, s)
					}
				}
				if key == "patientIds" {
					updates[key] = toObjectIDs(ids)
				} else {
					updates[key] = toObjectIDs(ids)
				}
			}
		}
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum campo válido para atualizar"})
		return
	}
	updated, err := recipe.Update(c.Request.Context(), id, userID.(string), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar receita"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func deleteRecipe(c *gin.Context) {
	userID, _ := c.Get("userID")
	id := c.Param("id")
	if err := recipe.Delete(c.Request.Context(), id, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover receita"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Receita removida"})
}

func uploadRecipeImage(c *gin.Context) {
	userID, _ := c.Get("userID")
	id := c.Param("id")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado (campo: file)"})
		return
	}
	if fileHeader.Size <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo inválido"})
		return
	}
	if fileHeader.Size > image.MaxImageSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Arquivo muito grande. O tamanho máximo é 10MB."})
		return
	}

	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao abrir arquivo"})
		return
	}
	defer f.Close()

	buf, err := image.ReadImageFromReader(f, image.MaxImageSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao ler arquivo"})
		return
	}
	if err := image.ValidateImage(buf, image.MaxImageSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Imagem inválida. Use JPEG, PNG, GIF ou WebP até 10MB."})
		return
	}

	publicID := "nufit/recipes/" + id + "/" + time.Now().Format("20060102150405.000000000")
	up, err := cloudinary.UploadImage(c.Request.Context(), buf, publicID, "nufit/recipes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fazer upload da imagem"})
		return
	}

	updated, err := recipe.AddImageURL(c.Request.Context(), id, userID.(string), up.SecureURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

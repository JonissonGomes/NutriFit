package rest

import (
	"net/http"
	"strconv"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// requireAdmin verifica role admin; uso opcional pois o grupo /admin já usa RequireRole.
func requireAdmin(c *gin.Context) bool {
	role, _ := c.Get("userRole")
	if roleStr, ok := role.(string); ok && (roleStr == string(models.RoleSuperAdmin) || roleStr == string(models.RoleAdmin)) {
		return true
	}
	c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito ao admin"})
	return false
}

type AdminNutritionistRow struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Email     string          `json:"email"`
	Plan      models.PlanType `json:"plan"`
	CreatedAt string          `json:"createdAt"`
	UpdatedAt string          `json:"updatedAt"`
}

type AdminUserRow struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Email     string          `json:"email"`
	Role      models.UserRole `json:"role"`
	Plan      models.PlanType `json:"plan"`
	Status    string          `json:"status"`
	CreatedAt string          `json:"createdAt"`
	UpdatedAt string          `json:"updatedAt"`
}

func listUsersAdmin(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 20
	}

	search := c.Query("search")
	role := c.Query("role")
	plan := c.Query("plan")
	status := c.Query("status")

	var andConditions []bson.M
	if role != "" {
		andConditions = append(andConditions, bson.M{"role": role})
	}
	if plan != "" {
		andConditions = append(andConditions, bson.M{"plan": plan})
	}
	if status == "suspended" {
		andConditions = append(andConditions, bson.M{"adminMetadata.status": "suspended"})
	} else if status == "active" {
		andConditions = append(andConditions, bson.M{
			"$or": []bson.M{
				{"adminMetadata.status": bson.M{"$in": []string{"", "active"}}},
				{"adminMetadata": bson.M{"$exists": false}},
			},
		})
	}
	if search != "" {
		andConditions = append(andConditions, bson.M{
			"$or": []bson.M{
				{"name": bson.M{"$regex": search, "$options": "i"}},
				{"email": bson.M{"$regex": search, "$options": "i"}},
			},
		})
	}
	filter := bson.M{}
	if len(andConditions) > 0 {
		filter["$and"] = andConditions
	}

	ctx := c.Request.Context()
	total, err := database.UsersCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao contar usuários"})
		return
	}

	skip := int64((page - 1) * limit)
	limit64 := int64(limit)
	cur, err := database.UsersCollection.Find(ctx, filter, &options.FindOptions{
		Skip:  &skip,
		Limit: &limit64,
		Sort:  bson.M{"createdAt": -1},
		Projection: bson.M{
			"passwordHash": 0,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar usuários"})
		return
	}
	defer cur.Close(ctx)

	var users []models.User
	if err := cur.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler usuários"})
		return
	}

	rows := make([]AdminUserRow, 0, len(users))
	for _, u := range users {
		status := "active"
		if u.AdminMetadata != nil && u.AdminMetadata.Status != "" {
			status = u.AdminMetadata.Status
		}
		rows = append(rows, AdminUserRow{
			ID:        u.ID.Hex(),
			Name:      u.Name,
			Email:     u.Email,
			Role:      u.Role,
			Plan:      u.Plan,
			Status:    status,
			CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: u.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  rows,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func updateUserStatusAdmin(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required,oneof=active suspended"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status inválido. Use active ou suspended."})
		return
	}
	ctx := c.Request.Context()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	res, err := database.UsersCollection.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$set": bson.M{
			"updatedAt":             time.Now(),
			"adminMetadata.status":  req.Status,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar status"})
		return
	}
	if res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Status atualizado", "status": req.Status})
}

func updateUserPlanAdmin(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}
	id := c.Param("id")
	var req struct {
		Plan models.PlanType `json:"plan" binding:"required,oneof=free starter professional business"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plano inválido"})
		return
	}
	ctx := c.Request.Context()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	_, err = database.UsersCollection.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$set": bson.M{
			"plan":      req.Plan,
			"updatedAt": time.Now(),
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar plano"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Plano atualizado"})
}

func adminOverview(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	ctx := c.Request.Context()
	totalUsers, _ := database.UsersCollection.CountDocuments(ctx, bson.M{})
	totalNutritionists, _ := database.UsersCollection.CountDocuments(ctx, bson.M{"role": models.RoleNutricionista})
	totalPatients, _ := database.UsersCollection.CountDocuments(ctx, bson.M{"role": models.RolePaciente})

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"totalUsers":        totalUsers,
			"totalNutritionists": totalNutritionists,
			"totalPatients":     totalPatients,
		},
	})
}

func listNutritionistsAdmin(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	search := c.Query("search")
	filter := bson.M{"role": models.RoleNutricionista}
	if search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"email": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	ctx := c.Request.Context()
	total, err := database.UsersCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao contar nutricionistas"})
		return
	}

	skip := int64((page - 1) * limit)
	limit64 := int64(limit)
	cur, err := database.UsersCollection.Find(ctx, filter, &options.FindOptions{
		Skip:  &skip,
		Limit: &limit64,
		Sort:  bson.M{"createdAt": -1},
		Projection: bson.M{
			"passwordHash": 0,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar nutricionistas"})
		return
	}
	defer cur.Close(ctx)

	var users []models.User
	if err := cur.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler nutricionistas"})
		return
	}

	rows := make([]AdminNutritionistRow, 0, len(users))
	for _, u := range users {
		rows = append(rows, AdminNutritionistRow{
			ID:        u.ID.Hex(),
			Name:      u.Name,
			Email:     u.Email,
			Plan:      u.Plan,
			CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: u.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  rows,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}


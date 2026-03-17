package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Roles com acesso total (bypass de permissões granulares).
var fullAdminRoles = map[string]bool{
	string(models.RoleSuperAdmin): true,
	string(models.RoleAdmin):     true,
}

// RequireRole retorna middleware que exige que o usuário tenha um dos roles informados.
// Deve ser usado após authMiddleware().
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool)
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *gin.Context) {
		roleVal, exists := c.Get("userRole")
		if !exists || roleVal == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito"})
			c.Abort()
			return
		}
		role, ok := roleVal.(string)
		if !ok || !allowed[role] {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito ao perfil autorizado"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequirePermission retorna middleware que exige a permissão (recurso.ação).
// super_admin e admin têm bypass. Outros roles: carrega User.Permissions do DB e valida.
// Recursos conhecidos: users, verifications, billing, settings. Ações: view, edit, delete, approve, reject.
func RequirePermission(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, _ := c.Get("userRole")
		if roleStr, ok := roleVal.(string); ok && fullAdminRoles[roleStr] {
			c.Next()
			return
		}

		userIDVal, exists := c.Get("userID")
		if !exists || userIDVal == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito"})
			c.Abort()
			return
		}
		userID, ok := userIDVal.(string)
		if !ok || userID == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito"})
			c.Abort()
			return
		}

		oid, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito"})
			c.Abort()
			return
		}

		var u models.User
		err = database.UsersCollection.FindOne(c.Request.Context(), bson.M{"_id": oid}).Decode(&u)
		if err != nil || u.Permissions == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para esta ação"})
			c.Abort()
			return
		}

		var res *models.ResourcePermissions
		switch resource {
		case "users":
			res = u.Permissions.Users
		case "verifications":
			res = u.Permissions.Verifications
		case "settings":
			res = u.Permissions.Settings
		case "moderation":
			res = u.Permissions.Moderation
		case "analytics":
			res = u.Permissions.Analytics
		default:
			c.JSON(http.StatusForbidden, gin.H{"error": "Recurso não reconhecido"})
			c.Abort()
			return
		}

		if res == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para este recurso"})
			c.Abort()
			return
		}

		allowed := false
		switch action {
		case "view":
			allowed = res.View
		case "edit":
			allowed = res.Edit
		case "delete":
			allowed = res.Delete
		case "approve":
			allowed = res.Approve
		case "reject":
			allowed = res.Reject
		case "ban":
			allowed = res.Ban
		default:
			c.JSON(http.StatusForbidden, gin.H{"error": "Ação não reconhecida"})
			c.Abort()
			return
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para esta ação"})
			c.Abort()
			return
		}
		c.Next()
	}
}

package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/shopping_list"
)

func getShoppingList(c *gin.Context) {
	mealPlanID := c.Param("mealPlanId")

	list, err := shopping_list.GetShoppingList(c.Request.Context(), mealPlanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar lista de compras"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

func toggleShoppingListItem(c *gin.Context) {
	listID := c.Param("id")
	itemID := c.Param("itemId")

	err := shopping_list.ToggleItem(c.Request.Context(), listID, itemID)
	if err != nil {
		if err == shopping_list.ErrShoppingListNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Lista não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item atualizado com sucesso"})
}

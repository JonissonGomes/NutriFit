package shopping_list

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrShoppingListNotFound = errors.New("lista de compras não encontrada")
)

type ShoppingListItem struct {
	ID          string `bson:"id" json:"id"`
	Name        string `bson:"name" json:"name"`
	Category    string `bson:"category" json:"category"`
	Quantity    string `bson:"quantity" json:"quantity"`
	Unit        string `bson:"unit" json:"unit"`
	Checked     bool   `bson:"checked" json:"checked"`
}

type ShoppingList struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	MealPlanID primitive.ObjectID `bson:"mealPlanId" json:"mealPlanId"`
	Items     []ShoppingListItem  `bson:"items" json:"items"`
	CreatedAt time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time           `bson:"updatedAt" json:"updatedAt"`
}

// GenerateShoppingList gera uma lista de compras a partir de um plano alimentar
func GenerateShoppingList(ctx context.Context, mealPlanID string) (*ShoppingList, error) {
	mealPlanOID, err := primitive.ObjectIDFromHex(mealPlanID)
	if err != nil {
		return nil, err
	}

	// Buscar plano alimentar
	var mealPlan models.MealPlan
	err = database.MealPlansCollection.FindOne(ctx, bson.M{"_id": mealPlanOID}).Decode(&mealPlan)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("plano alimentar não encontrado")
		}
		return nil, err
	}

	// Agrupar alimentos por categoria
	foodMap := make(map[string]map[string]float64) // category -> foodName -> totalQuantity

	for _, meal := range mealPlan.Meals {
		for _, food := range meal.Foods {
			category := "Outros"
			if food.Name != "" {
				// Determinar categoria básica (pode ser melhorado)
				nameLower := strings.ToLower(food.Name)
				switch {
				case strings.Contains(nameLower, "fruta") || strings.Contains(nameLower, "banana") || strings.Contains(nameLower, "maçã"):
					category = "Frutas"
				case strings.Contains(nameLower, "verdura") || strings.Contains(nameLower, "legume") || strings.Contains(nameLower, "salada"):
					category = "Verduras e Legumes"
				case strings.Contains(nameLower, "carne") || strings.Contains(nameLower, "frango") || strings.Contains(nameLower, "peixe"):
					category = "Carnes"
				case strings.Contains(nameLower, "leite") || strings.Contains(nameLower, "queijo") || strings.Contains(nameLower, "iogurte"):
					category = "Laticínios"
				case strings.Contains(nameLower, "arroz") || strings.Contains(nameLower, "feijão") || strings.Contains(nameLower, "macarrão"):
					category = "Cereais e Grãos"
				}

				if foodMap[category] == nil {
					foodMap[category] = make(map[string]float64)
				}
				foodMap[category][food.Name] += food.Quantity
			}
		}
	}

	// Converter para lista de itens
	var items []ShoppingListItem
	itemID := 1
	for category, foods := range foodMap {
		for name, quantity := range foods {
			items = append(items, ShoppingListItem{
				ID:       fmt.Sprintf("%d", itemID),
				Name:     name,
				Category: category,
				Quantity: fmt.Sprintf("%.1f", quantity),
				Unit:     "g",
				Checked:  false,
			})
			itemID++
		}
	}

	shoppingList := &ShoppingList{
		ID:         primitive.NewObjectID(),
		MealPlanID: mealPlanOID,
		Items:      items,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// Salvar ou atualizar lista
	trueValue := true
	_, err = database.ShoppingListsCollection.ReplaceOne(
		ctx,
		bson.M{"mealPlanId": mealPlanOID},
		shoppingList,
		&options.ReplaceOptions{Upsert: &trueValue},
	)
	if err != nil {
		return nil, err
	}

	return shoppingList, nil
}

// GetShoppingList busca lista de compras de um plano
func GetShoppingList(ctx context.Context, mealPlanID string) (*ShoppingList, error) {
	mealPlanOID, err := primitive.ObjectIDFromHex(mealPlanID)
	if err != nil {
		return nil, err
	}

	var list ShoppingList
	err = database.ShoppingListsCollection.FindOne(ctx, bson.M{"mealPlanId": mealPlanOID}).Decode(&list)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			// Gerar lista se não existir
			return GenerateShoppingList(ctx, mealPlanID)
		}
		return nil, err
	}

	return &list, nil
}

// ToggleItem marca/desmarca um item da lista
func ToggleItem(ctx context.Context, listID string, itemID string) error {
	listOID, err := primitive.ObjectIDFromHex(listID)
	if err != nil {
		return err
	}

	var list ShoppingList
	err = database.ShoppingListsCollection.FindOne(ctx, bson.M{"_id": listOID}).Decode(&list)
	if err != nil {
		return ErrShoppingListNotFound
	}

	// Atualizar item
	for i := range list.Items {
		if list.Items[i].ID == itemID {
			list.Items[i].Checked = !list.Items[i].Checked
			break
		}
	}

	list.UpdatedAt = time.Now()

	_, err = database.ShoppingListsCollection.ReplaceOne(ctx, bson.M{"_id": listOID}, list)
	return err
}

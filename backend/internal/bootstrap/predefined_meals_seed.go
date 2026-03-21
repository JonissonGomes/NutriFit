package bootstrap

import (
	"context"
	"strings"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
)

// SeedPredefinedMeals cria a coleção com refeições pré-cadastradas apenas quando vazia.
func SeedPredefinedMeals(ctx context.Context) (int, error) {
	count, err := database.PredefinedMealsCollection.CountDocuments(ctx, map[string]any{})
	if err != nil {
		return 0, err
	}
	if count > 0 {
		return 0, nil
	}

	now := time.Now()
	docs := make([]any, 0, len(defaultPredefinedMeals))
	for _, item := range defaultPredefinedMeals {
		groups := make([]string, 0, len(item.MealGroups))
		for _, g := range item.MealGroups {
			v := strings.TrimSpace(strings.ToLower(g))
			if v != "" {
				groups = append(groups, v)
			}
		}
		filters := make([]string, 0, len(item.Filters))
		for _, f := range item.Filters {
			v := strings.TrimSpace(f)
			if v != "" {
				filters = append(filters, v)
			}
		}
		docs = append(docs, models.PredefinedMeal{
			Name:       strings.TrimSpace(item.Name),
			Calories:   item.Calories,
			MealGroups: groups,
			Filters:    filters,
			CreatedAt:  now,
			UpdatedAt:  now,
		})
	}
	if len(docs) == 0 {
		return 0, nil
	}
	if _, err := database.PredefinedMealsCollection.InsertMany(ctx, docs); err != nil {
		return 0, err
	}
	return len(docs), nil
}

var defaultPredefinedMeals = []models.PredefinedMeal{
	{
		Name:       "Abacate + aveia",
		Calories:   113.8392,
		MealGroups: []string{"breakfast", "ceia", "dinner"},
		Filters:    []string{"Baixo teor de gordura", "Sem leite", "Sem glúten", "Low carb", "Baixo teor de potássio", "Vegana", "Rica em fibras", "Com frutas", "Pastosa", "Baixo teor de sódio", "Vegetariana"},
	},
	{
		Name:       "Abacaxi + ovo cozido",
		Calories:   105.9917,
		MealGroups: []string{"breakfast", "ceia", "snack"},
		Filters:    []string{"Baixo teor de gordura", "Sem leite", "Sem glúten", "Hiperproteica", "Low carb", "Baixo teor de potássio", "Com frutas", "Baixo teor de sódio", "Vegetariana"},
	},
	{
		Name:       "Abacaxi com linhaça e canela",
		Calories:   125.52,
		MealGroups: []string{"ceia", "snack"},
		Filters:    []string{"Baixo teor de gordura", "Sem leite", "Sem glúten", "Baixo teor de potássio", "Vegana", "Rica em fibras", "Com frutas", "Baixo teor de sódio", "Vegetariana", "Rica em ferro"},
	},
	{
		Name:       "Abobrinha recheada caprese + salada verde com manga",
		Calories:   188.19,
		MealGroups: []string{"lunch", "dinner"},
		Filters:    []string{"Baixo teor de gordura", "Sem leite", "Sem glúten", "Hiperproteica", "Low carb", "Baixo teor de potássio", "Vegana", "Rica em fibras", "Com frutas", "Com vegetais", "Baixo teor de sódio", "Vegetariana", "Rica em ferro"},
	},
	{
		Name:       "Abobrinha recheada com carne moída",
		Calories:   409.69,
		MealGroups: []string{"lunch", "dinner"},
		Filters:    []string{"Sem glúten", "Hiperproteica", "Low carb", "Com vegetais", "Baixo teor de sódio", "Rica em ferro"},
	},
	{
		Name:       "Abobrinha recheada com carne moída + arroz de couve-flor",
		Calories:   306.455,
		MealGroups: []string{"lunch", "dinner"},
		Filters:    []string{"Sem leite", "Sem glúten", "Hiperproteica", "Low carb", "Rica em fibras", "Com vegetais", "Baixo teor de sódio", "Rica em ferro"},
	},
	{
		Name:       "Abobrinha recheada vegana",
		Calories:   264.7,
		MealGroups: []string{"lunch", "dinner"},
		Filters:    []string{"Sem leite", "Sem glúten", "Hiperproteica", "Low carb", "Baixo teor de potássio", "Vegana", "Com vegetais", "Vegetariana", "Rica em ferro"},
	},
	{
		Name:       "Açaí + morango",
		Calories:   117.537,
		MealGroups: []string{"breakfast", "ceia", "snack"},
		Filters:    []string{"Baixo teor de gordura", "Sem leite", "Sem glúten", "Baixo teor de potássio", "Vegana", "Com frutas", "Baixo teor de sódio", "Vegetariana"},
	},
	{
		Name:       "Açaí + morango + banana + suco de laranja + coco",
		Calories:   204.9242,
		MealGroups: []string{"breakfast", "ceia", "snack"},
		Filters:    []string{"Baixo teor de gordura", "Sem leite", "Sem glúten", "Baixo teor de potássio", "Rica em fibras", "Com frutas", "Baixo teor de sódio", "Vegetariana", "Rica em ferro"},
	},
	{
		Name:       "Açaí com amendoim",
		Calories:   412.78,
		MealGroups: []string{"breakfast", "ceia", "snack"},
		Filters:    []string{"Sem leite", "Sem glúten", "Baixo teor de potássio", "Vegana", "Rica em fibras", "Com frutas", "Baixo teor de sódio", "Vegetariana", "Rica em ferro"},
	},
}

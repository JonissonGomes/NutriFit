package ai

import (
	"context"

	"nufit/backend/internal/models"
	"nufit/backend/internal/services/food"
)

// MealPlanAnalysisResult resultado da análise de um plano alimentar
type MealPlanAnalysisResult struct {
	VarietyScore    float64   `json:"varietyScore"`    // 0-1
	VarietyIssues   []string  `json:"varietyIssues"`
	Substitutions   map[string][]models.Food `json:"substitutions"` // foodID -> []substitutes
}

// AnalyzeMealPlanVariety analisa a variedade de um plano alimentar
func AnalyzeMealPlanVariety(ctx context.Context, mealPlan models.MealPlan) (*MealPlanAnalysisResult, error) {
	client := NewGeminiClient()
	if client == nil {
		return nil, ErrAIUnavailable
	}

	// Contar alimentos únicos
	foodCount := make(map[string]int)
	for _, meal := range mealPlan.Meals {
		for _, food := range meal.Foods {
			foodCount[food.Name]++
		}
	}

	// Calcular score de variedade (quanto mais alimentos únicos, melhor)
	totalFoods := 0
	uniqueFoods := len(foodCount)
	for _, count := range foodCount {
		totalFoods += count
	}

	varietyScore := float64(uniqueFoods) / float64(totalFoods)
	if varietyScore > 1.0 {
		varietyScore = 1.0
	}

	var issues []string
	if varietyScore < 0.3 {
		issues = append(issues, "Baixa variedade de alimentos detectada. Considere diversificar mais o cardápio.")
	}

	result := &MealPlanAnalysisResult{
		VarietyScore:  varietyScore,
		VarietyIssues: issues,
		Substitutions: make(map[string][]models.Food),
	}

	return result, nil
}

// SuggestSubstitutions sugere substituições para um alimento
func SuggestSubstitutions(ctx context.Context, foodID string, mealPlan models.MealPlan) ([]models.Food, error) {
	_ = mealPlan
	return food.GetSubstitutions(ctx, foodID, "")
}

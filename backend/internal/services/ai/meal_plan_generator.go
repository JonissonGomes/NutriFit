package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"nufit/backend/internal/models"
)

// MealPlanParams parâmetros para geração de plano alimentar
type MealPlanParams struct {
	Calories      float64
	Proteins      float64
	Carbohydrates float64
	Fats          float64
	Restrictions  []string
	Preferences   []string
	MealsPerDay   int
}

// GenerateMealPlanDraft gera um rascunho de plano alimentar usando IA
func GenerateMealPlanDraft(ctx context.Context, params MealPlanParams) (*models.MealPlan, error) {
	client := NewGeminiClient()
	if client == nil {
		return nil, ErrAIUnavailable
	}

	systemInstruction := `Você é um nutricionista experiente. Gere um plano alimentar completo e balanceado em formato JSON estruturado.
O plano deve incluir todas as refeições do dia com alimentos específicos, quantidades e informações nutricionais.`

	prompt := fmt.Sprintf(`Gere um plano alimentar com as seguintes especificações:
- Calorias totais: %.0f kcal
- Proteínas: %.1f g
- Carboidratos: %.1f g
- Gorduras: %.1f g
- Refeições por dia: %d
- Restrições: %v
- Preferências: %v

Formato esperado: JSON com array de refeições, cada uma contendo tipo, horário, alimentos com quantidades e macros.`,
		params.Calories, params.Proteins, params.Carbohydrates, params.Fats,
		params.MealsPerDay, params.Restrictions, params.Preferences)

	response, err := client.GenerateText(ctx, prompt, systemInstruction)
	if err != nil {
		return nil, err
	}

	meals, err := parseMealsFromLLMResponse(response)
	if err != nil {
		return nil, fmt.Errorf("falha ao interpretar resposta da IA: %w", err)
	}

	now := time.Now()
	mp := &models.MealPlan{
		Title:       "Rascunho (IA)",
		Description: "Gerado automaticamente por IA",
		Category:    models.CategorySaude,
		Status:      models.MealPlanStatusDraft,
		Meals:       meals,
		IsTemplate:  false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	return mp, nil
}

type mealDraftPayload struct {
	Meals []models.Meal `json:"meals"`
}

// parseMealsFromLLMResponse tenta extrair um JSON com refeições de uma resposta textual do LLM.
func parseMealsFromLLMResponse(raw string) ([]models.Meal, error) {
	s := strings.TrimSpace(raw)

	// remover blocos ```json ... ```
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	s = strings.TrimSpace(s)

	// tentar como payload { meals: [...] }
	var payload mealDraftPayload
	if err := json.Unmarshal([]byte(s), &payload); err == nil && len(payload.Meals) > 0 {
		return payload.Meals, nil
	}

	// tentar como array [...]
	var meals []models.Meal
	if err := json.Unmarshal([]byte(s), &meals); err == nil && len(meals) > 0 {
		return meals, nil
	}

	// fallback: extrair o primeiro bloco JSON
	start := strings.IndexAny(s, "[{")
	end := strings.LastIndexAny(s, "]}")
	if start >= 0 && end > start {
		sub := strings.TrimSpace(s[start : end+1])
		if err := json.Unmarshal([]byte(sub), &payload); err == nil && len(payload.Meals) > 0 {
			return payload.Meals, nil
		}
		if err := json.Unmarshal([]byte(sub), &meals); err == nil && len(meals) > 0 {
			return meals, nil
		}
	}

	return nil, fmt.Errorf("resposta não contém JSON válido de refeições")
}

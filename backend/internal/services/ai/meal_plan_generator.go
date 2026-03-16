package ai

import (
	"context"
	"fmt"

	"arck-design/backend/internal/models"
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

	// TODO: Parsear resposta JSON e converter para models.MealPlan
	// Por enquanto retorna erro indicando que precisa ser implementado
	return nil, fmt.Errorf("parsing de resposta JSON ainda não implementado: %s", response)
}

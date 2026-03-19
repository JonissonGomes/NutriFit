package ai

import (
	"bytes"
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

	systemInstruction := `Você é um nutricionista experiente.
Responda APENAS JSON válido (sem markdown, sem texto extra).
Formato obrigatório:
{
  "meals": [
    {
      "type": "cafe-manha|lanche-manha|almoco|lanche-tarde|jantar|ceia",
      "time": "HH:MM",
      "foods": [
        {"name":"string","quantity":number,"unit":"g|ml|un"}
      ],
      "notes":"string opcional"
    }
  ]
}`

	prompt := fmt.Sprintf(`Gere um plano alimentar com as seguintes especificações:
- Calorias totais: %.0f kcal
- Proteínas: %.1f g
- Carboidratos: %.1f g
- Gorduras: %.1f g
- Refeições por dia: %d
- Restrições: %v
- Preferências: %v

Formato esperado: JSON seguindo EXATAMENTE o formato informado em system instruction.`,
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

type mealDraftPayloadPT struct {
	Refeicoes []models.Meal `json:"refeicoes"`
}

// parseMealsFromLLMResponse tenta extrair um JSON com refeições de uma resposta textual do LLM.
func parseMealsFromLLMResponse(raw string) ([]models.Meal, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return nil, fmt.Errorf("resposta vazia")
	}

	candidates := []string{s}

	// Extrai blocos cercados por ```...``` (com ou sem linguagem).
	if strings.Contains(s, "```") {
		parts := strings.Split(s, "```")
		for i := 1; i < len(parts); i += 2 {
			block := strings.TrimSpace(parts[i])
			block = strings.TrimPrefix(block, "json")
			block = strings.TrimSpace(block)
			if block != "" {
				candidates = append(candidates, block)
			}
		}
	}

	// Fallback: extrair trecho entre primeiro {/[ e último }/].
	start := strings.IndexAny(s, "[{")
	end := strings.LastIndexAny(s, "]}")
	if start >= 0 && end > start {
		sub := strings.TrimSpace(s[start : end+1])
		if sub != "" {
			candidates = append(candidates, sub)
		}
	}

	for _, c := range candidates {
		if meals := tryParseMealsCandidate(c); len(meals) > 0 {
			return normalizeMeals(meals), nil
		}
	}

	return nil, fmt.Errorf("resposta não contém JSON válido de refeições")
}

func tryParseMealsCandidate(candidate string) []models.Meal {
	decoder := json.NewDecoder(bytes.NewBufferString(candidate))
	decoder.UseNumber()

	// 1) payload padrão {"meals":[...]}
	var payload mealDraftPayload
	if err := decoder.Decode(&payload); err == nil && len(payload.Meals) > 0 {
		return payload.Meals
	}

	// Reset decoder por tentativa.
	decoder = json.NewDecoder(bytes.NewBufferString(candidate))
	decoder.UseNumber()

	// 2) payload PT {"refeicoes":[...]}
	var payloadPT mealDraftPayloadPT
	if err := decoder.Decode(&payloadPT); err == nil && len(payloadPT.Refeicoes) > 0 {
		return payloadPT.Refeicoes
	}

	decoder = json.NewDecoder(bytes.NewBufferString(candidate))
	decoder.UseNumber()

	// 3) array direto [...]
	var meals []models.Meal
	if err := decoder.Decode(&meals); err == nil && len(meals) > 0 {
		return meals
	}

	return nil
}

func normalizeMeals(meals []models.Meal) []models.Meal {
	out := make([]models.Meal, 0, len(meals))
	for _, m := range meals {
		mealType := strings.TrimSpace(string(m.Type))
		switch mealType {
		case "":
			m.Type = models.MealTypeAlmoco
		case "cafe", "cafe-da-manha", "café", "café-da-manhã":
			m.Type = models.MealTypeCafeManha
		case "lanche-da-manha", "lanche manhã":
			m.Type = models.MealTypeLancheManha
		case "lanche-da-tarde", "lanche tarde":
			m.Type = models.MealTypeLancheTarde
		default:
			m.Type = models.MealType(mealType)
		}

		if strings.TrimSpace(m.Time) == "" {
			m.Time = "12:00"
		}

		for i := range m.Foods {
			if strings.TrimSpace(m.Foods[i].Name) == "" {
				m.Foods[i].Name = "Alimento"
			}
			if m.Foods[i].Quantity <= 0 {
				m.Foods[i].Quantity = 100
			}
			if strings.TrimSpace(m.Foods[i].Unit) == "" {
				m.Foods[i].Unit = "g"
			}
		}

		out = append(out, m)
	}
	return out
}

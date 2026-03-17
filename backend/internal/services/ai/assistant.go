package ai

import (
	"context"
	"fmt"
	"strings"

	"nufit/backend/internal/services/meal_plan"
)

// AnswerPatientQuestion responde uma pergunta do paciente usando IA
func AnswerPatientQuestion(ctx context.Context, question string, patientID string) (string, error) {
	client := NewGeminiClient()
	if client == nil {
		return "", ErrAIUnavailable
	}

	// Buscar plano alimentar ativo do paciente
	mealPlans, _, err := meal_plan.ListMealPlans(ctx, "", &patientID, 1, 1)
	if err != nil {
		return "", err
	}

	var mealPlanContext strings.Builder
	if len(mealPlans) > 0 {
		mp := mealPlans[0]
		mealPlanContext.WriteString("Plano alimentar do paciente:\n")
		mealPlanContext.WriteString(fmt.Sprintf("Categoria: %s\n", mp.Category))
		if mp.TotalMacros != nil {
			mealPlanContext.WriteString(fmt.Sprintf("Calorias: %.0f kcal\n", mp.TotalMacros.Calories))
		}
		if len(mp.Restrictions) > 0 {
			mealPlanContext.WriteString(fmt.Sprintf("Restrições: %s\n", strings.Join(mp.Restrictions, ", ")))
		}
	}

	systemInstruction := `Você é um assistente virtual de nutrição. Responda perguntas dos pacientes de forma clara, objetiva e baseada no plano alimentar deles.
Para perguntas simples sobre o plano (ex: "O que posso comer no lanche?"), consulte o plano e responda diretamente.
Para perguntas complexas ou que requerem avaliação clínica, instrua o paciente a contatar o nutricionista.
Seja sempre educado, profissional e encorajador.`

	prompt := fmt.Sprintf(`%s

Pergunta do paciente: %s

Responda de forma clara e objetiva. Se a pergunta for complexa ou requerer avaliação clínica, instrua o paciente a contatar o nutricionista.`,
		mealPlanContext.String(), question)

	answer, err := client.GenerateText(ctx, prompt, systemInstruction)
	if err != nil {
		return "", err
	}

	return answer, nil
}

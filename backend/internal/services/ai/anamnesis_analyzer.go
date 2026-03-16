package ai

import (
	"context"
	"fmt"
	"strings"

	"arck-design/backend/internal/services/anamnesis"
)

// GenerateAnamnesisSummary gera um resumo inteligente de uma anamnese
func GenerateAnamnesisSummary(ctx context.Context, anamnesisID string) (string, error) {
	client := NewGeminiClient()
	if client == nil {
		return "", ErrAIUnavailable
	}

	// Buscar anamnese
	anam, err := anamnesis.GetAnamnesisByID(ctx, anamnesisID)
	if err != nil {
		return "", err
	}

	// Construir texto da anamnese a partir das respostas
	var anamnesisText strings.Builder
	if anam.FormTemplate != nil {
		for _, question := range anam.FormTemplate.Questions {
			anamnesisText.WriteString(fmt.Sprintf("%s: ", question.Label))
			// Buscar resposta correspondente
			for _, answer := range anam.Answers {
				if answer.QuestionID == question.ID {
					anamnesisText.WriteString(fmt.Sprintf("%v\n", answer.Value))
					break
				}
			}
		}
	}

	systemInstruction := `Você é um nutricionista experiente. Analise a anamnese fornecida e gere um resumo estruturado em tópicos:
1. Pontos Críticos (alergias, patologias, medicações)
2. Padrões Comportamentais (hábitos alimentares, rotina)
3. Possíveis Deficiências Nutricionais
4. Objetivos do Paciente

Seja objetivo e direto.`

	prompt := fmt.Sprintf("Analise a seguinte anamnese e gere um resumo estruturado:\n\n%s", anamnesisText.String())

	summary, err := client.GenerateText(ctx, prompt, systemInstruction)
	if err != nil {
		return "", err
	}

	// Atualizar resumo na anamnese
	err = anamnesis.UpdateAISummary(ctx, anamnesisID, summary)
	if err != nil {
		return summary, err // Retornar summary mesmo se falhar ao salvar
	}

	return summary, nil
}

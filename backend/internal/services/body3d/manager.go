package body3d

import (
	"context"
	"errors"
	"time"

	"nufit/backend/internal/models"
)

var (
	ErrBody3DUnavailable = errors.New("body3d indisponível (integração não configurada)")
)

// AnalyzeBody3D é um placeholder funcional: gera um relatório básico.
// Quando a integração com IA/API externa existir, substituir esta implementação.
func AnalyzeBody3D(ctx context.Context, patientID string, heightCm, weightKg float64, photos []string) (*models.Body3DReport, error) {
	_ = ctx
	_ = patientID

	if heightCm <= 0 || weightKg <= 0 {
		return nil, errors.New("altura e peso são obrigatórios para análise básica")
	}

	h := heightCm / 100.0
	bmi := weightKg / (h * h)

	report := &models.Body3DReport{
		BodyFatPercent: 0,
		MuscleMass:     0,
		FatMass:        0,
		Circumferences: nil,
		MetabolicRisk:  "indefinido",
		BMI:            bmi,
		Confidence:     0.2,
		GeneratedAt:    time.Now(),
	}

	// Mesmo sem processamento, se houver fotos, aumentamos levemente a confiança do placeholder.
	if len(photos) >= 2 {
		report.Confidence = 0.3
	}

	return report, nil
}


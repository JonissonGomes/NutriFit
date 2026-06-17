package plan

import (
	"context"
	"errors"
	"fmt"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrPlanLimitReached = errors.New("limite do plano atingido")
	ErrFeatureNotInPlan = errors.New("recurso não disponível no seu plano")
)

// Feature identifica capacidades controladas por plano.
type Feature string

const (
	FeatureAI              Feature = "ai"
	FeatureUnlimitedPatients Feature = "unlimited_patients"
	FeatureTemplates         Feature = "templates"
	FeatureCustomDomain      Feature = "custom_domain"
	FeatureAdvancedAI        Feature = "advanced_ai"
)

const freePlanMaxPatients = 5

// Limits define limites por plano.
type Limits struct {
	MaxPatients      int  // -1 = ilimitado
	AIEnabled        bool
	TemplatesEnabled bool
	CustomDomain     bool
	AdvancedAI       bool
}

var planLimits = map[models.PlanType]Limits{
	models.PlanFree: {
		MaxPatients:      freePlanMaxPatients,
		AIEnabled:        false,
		TemplatesEnabled: false,
		CustomDomain:     false,
		AdvancedAI:       false,
	},
	models.PlanStarter: {
		MaxPatients:      -1,
		AIEnabled:        true,
		TemplatesEnabled: false,
		CustomDomain:     false,
		AdvancedAI:       false,
	},
	models.PlanProfessional: {
		MaxPatients:      -1,
		AIEnabled:        true,
		TemplatesEnabled: true,
		CustomDomain:     false,
		AdvancedAI:       false,
	},
	models.PlanBusiness: {
		MaxPatients:      -1,
		AIEnabled:        true,
		TemplatesEnabled: true,
		CustomDomain:     true,
		AdvancedAI:       true,
	},
}

func GetLimits(plan models.PlanType) Limits {
	if l, ok := planLimits[plan]; ok {
		return l
	}
	return planLimits[models.PlanFree]
}

func GetUserPlan(ctx context.Context, userID string) (models.PlanType, error) {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return models.PlanFree, err
	}
	var u models.User
	if err := database.UsersCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&u); err != nil {
		return models.PlanFree, err
	}
	if u.Plan == "" {
		return models.PlanFree, nil
	}
	return u.Plan, nil
}

func CountActivePatients(ctx context.Context, nutritionistID string) (int64, error) {
	oid, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return 0, err
	}
	return database.PatientsCollection.CountDocuments(ctx, bson.M{
		"nutritionistId": oid,
		"isActive":       true,
	})
}

func CanAddPatient(ctx context.Context, nutritionistID string) error {
	plan, err := GetUserPlan(ctx, nutritionistID)
	if err != nil {
		return err
	}
	limits := GetLimits(plan)
	if limits.MaxPatients < 0 {
		return nil
	}
	count, err := CountActivePatients(ctx, nutritionistID)
	if err != nil {
		return err
	}
	if count >= int64(limits.MaxPatients) {
		return fmt.Errorf("%w: plano gratuito permite até %d pacientes ativos", ErrPlanLimitReached, limits.MaxPatients)
	}
	return nil
}

func HasFeature(ctx context.Context, userID string, feature Feature) error {
	plan, err := GetUserPlan(ctx, userID)
	if err != nil {
		return err
	}
	limits := GetLimits(plan)
	switch feature {
	case FeatureAI:
		if !limits.AIEnabled {
			return fmt.Errorf("%w: IA disponível a partir do plano Mensal", ErrFeatureNotInPlan)
		}
	case FeatureUnlimitedPatients:
		if limits.MaxPatients >= 0 {
			return fmt.Errorf("%w: upgrade necessário para mais pacientes", ErrFeatureNotInPlan)
		}
	case FeatureTemplates:
		if !limits.TemplatesEnabled {
			return fmt.Errorf("%w: biblioteca de modelos no plano Anual ou superior", ErrFeatureNotInPlan)
		}
	case FeatureCustomDomain:
		if !limits.CustomDomain {
			return fmt.Errorf("%w: domínio próprio no plano Elite", ErrFeatureNotInPlan)
		}
	case FeatureAdvancedAI:
		if !limits.AdvancedAI {
			return fmt.Errorf("%w: IA avançada no plano Elite", ErrFeatureNotInPlan)
		}
	default:
		return nil
	}
	return nil
}

func PlanSummary(ctx context.Context, userID string) (map[string]interface{}, error) {
	plan, err := GetUserPlan(ctx, userID)
	if err != nil {
		return nil, err
	}
	limits := GetLimits(plan)
	count, _ := CountActivePatients(ctx, userID)
	return map[string]interface{}{
		"plan":             plan,
		"maxPatients":      limits.MaxPatients,
		"activePatients":   count,
		"aiEnabled":        limits.AIEnabled,
		"templatesEnabled": limits.TemplatesEnabled,
		"customDomain":     limits.CustomDomain,
		"advancedAI":       limits.AdvancedAI,
	}, nil
}

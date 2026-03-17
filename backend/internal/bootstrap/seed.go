package bootstrap

import (
	"context"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SeedPlatformSettings cria documentos base em platform_settings.
// Mongo cria collections sob demanda; aqui garantimos dados mínimos (roles/planos).
func SeedPlatformSettings(ctx context.Context) error {
	now := time.Now()

	upsert := func(key string, value any) error {
		_, err := database.PlatformSettingsCollection.UpdateOne(
			ctx,
			bson.M{"key": key},
			bson.M{
				"$setOnInsert": bson.M{"createdAt": now},
				"$set": bson.M{
					"key":       key,
					"value":     value,
					"updatedAt": now,
				},
			},
			options.Update().SetUpsert(true),
		)
		return err
	}

	roles := []string{
		string(models.RoleSuperAdmin),
		string(models.RoleNutricionista),
		string(models.RolePaciente),
	}

	plans := []string{
		string(models.PlanFree),
		string(models.PlanStarter),
		string(models.PlanProfessional),
		string(models.PlanBusiness),
	}

	if err := upsert("roles", roles); err != nil {
		return err
	}
	if err := upsert("plans", plans); err != nil {
		return err
	}

	return nil
}


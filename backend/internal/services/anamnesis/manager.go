package anamnesis

import (
	"context"
	"errors"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrTemplateNotFound = errors.New("template não encontrado")
	ErrAnamnesisNotFound = errors.New("anamnese não encontrada")
	ErrInvalidTemplate = errors.New("template inválido")
)

// CreateTemplate cria um novo template de anamnese
func CreateTemplate(ctx context.Context, nutritionistID string, template models.FormTemplate) (*models.FormTemplate, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	template.ID = primitive.NewObjectID().Hex()
	template.CreatedAt = time.Now()
	template.UpdatedAt = time.Now()

	// Salvar template na collection de templates
	templateDoc := bson.M{
		"nutritionistId": nutritionistOID,
		"id":              template.ID,
		"name":            template.Name,
		"description":     template.Description,
		"category":        template.Category,
		"questions":       template.Questions,
		"isDefault":       template.IsDefault,
		"createdAt":       template.CreatedAt,
		"updatedAt":       template.UpdatedAt,
	}

	_, err = database.AnamnesisTemplatesCollection.InsertOne(ctx, templateDoc)
	if err != nil {
		return nil, err
	}

	return &template, nil
}

// ListTemplates lista templates de anamnese
func ListTemplates(ctx context.Context, nutritionistID string) ([]models.FormTemplate, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	cursor, err := database.AnamnesisTemplatesCollection.Find(ctx, bson.M{
		"nutritionistId": nutritionistOID,
	}, &options.FindOptions{
		Sort: bson.M{"createdAt": -1},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var templates []models.FormTemplate
	if err = cursor.All(ctx, &templates); err != nil {
		return nil, err
	}

	return templates, nil
}

// GetTemplate busca um template por ID
func GetTemplate(ctx context.Context, templateID string, nutritionistID string) (*models.FormTemplate, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	var template models.FormTemplate
	err = database.AnamnesisTemplatesCollection.FindOne(ctx, bson.M{
		"id":              templateID,
		"nutritionistId": nutritionistOID,
	}).Decode(&template)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrTemplateNotFound
		}
		return nil, err
	}

	return &template, nil
}

// CreateAnamnesis cria uma nova anamnese para um paciente
func CreateAnamnesis(ctx context.Context, nutritionistID string, patientID string, templateID string) (*models.Anamnesis, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	// Buscar template se fornecido
	var formTemplate *models.FormTemplate
	if templateID != "" {
		template, err := GetTemplate(ctx, templateID, nutritionistID)
		if err != nil {
			return nil, err
		}
		formTemplate = template
	}

	anamnesis := models.Anamnesis{
		ID:            primitive.NewObjectID(),
		NutritionistID: nutritionistOID,
		PatientID:     patientOID,
		TemplateID:    templateID,
		FormTemplate:  formTemplate,
		Answers:       []models.AnamnesisAnswer{},
		Status:        models.AnamnesisStatusDraft,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	_, err = database.AnamnesisCollection.InsertOne(ctx, anamnesis)
	if err != nil {
		return nil, err
	}

	return &anamnesis, nil
}

// GetAnamnesis busca uma anamnese por paciente
func GetAnamnesis(ctx context.Context, patientID string, nutritionistID string) (*models.Anamnesis, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	var anamnesis models.Anamnesis
	err = database.AnamnesisCollection.FindOne(ctx, bson.M{
		"patientId":     patientOID,
		"nutritionistId": nutritionistOID,
	}, &options.FindOneOptions{
		Sort: bson.M{"createdAt": -1},
	}).Decode(&anamnesis)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrAnamnesisNotFound
		}
		return nil, err
	}

	return &anamnesis, nil
}

// SubmitAnswers submete respostas de uma anamnese
func SubmitAnswers(ctx context.Context, anamnesisID string, answers []models.AnamnesisAnswer) (*models.Anamnesis, error) {
	anamnesisOID, err := primitive.ObjectIDFromHex(anamnesisID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"answers":     answers,
			"status":      models.AnamnesisStatusCompleted,
			"completedAt": now,
			"updatedAt":   now,
		},
	}

	result := database.AnamnesisCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": anamnesisOID},
		update,
		&options.FindOneAndUpdateOptions{
			ReturnDocument: options.After,
		},
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return nil, ErrAnamnesisNotFound
		}
		return nil, result.Err()
	}

	var anamnesis models.Anamnesis
	if err = result.Decode(&anamnesis); err != nil {
		return nil, err
	}

	return &anamnesis, nil
}

// GetAnamnesisByID busca uma anamnese por ID
func GetAnamnesisByID(ctx context.Context, anamnesisID string) (*models.Anamnesis, error) {
	anamnesisOID, err := primitive.ObjectIDFromHex(anamnesisID)
	if err != nil {
		return nil, err
	}

	var anamnesis models.Anamnesis
	err = database.AnamnesisCollection.FindOne(ctx, bson.M{"_id": anamnesisOID}).Decode(&anamnesis)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrAnamnesisNotFound
		}
		return nil, err
	}

	return &anamnesis, nil
}

// UpdateAISummary atualiza o resumo de IA de uma anamnese
func UpdateAISummary(ctx context.Context, anamnesisID string, summary string) error {
	anamnesisOID, err := primitive.ObjectIDFromHex(anamnesisID)
	if err != nil {
		return err
	}

	_, err = database.AnamnesisCollection.UpdateOne(
		ctx,
		bson.M{"_id": anamnesisOID},
		bson.M{
			"$set": bson.M{
				"aiSummary": summary,
				"updatedAt": time.Now(),
			},
		},
	)

	return err
}

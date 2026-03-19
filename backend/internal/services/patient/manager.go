package patient

import (
	"context"
	"errors"
	"time"

	"nufit/backend/internal/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrPatientNotFound = errors.New("paciente não encontrado")
	ErrInvalidData     = errors.New("dados inválidos")
)

// Patient representa um paciente no sistema
type Patient struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NutritionistID primitive.ObjectID `bson:"nutritionistId" json:"nutritionistId"`
	// PlatformUserID é o userId da plataforma (quando o paciente foi selecionado do cadastro do sistema).
	// Pode ser nil para pacientes criados manualmente/importados.
	PlatformUserID *primitive.ObjectID `bson:"userId,omitempty" json:"userId,omitempty"`
	Name          string             `bson:"name" json:"name"`
	Email         string             `bson:"email,omitempty" json:"email,omitempty"`
	Phone         string             `bson:"phone,omitempty" json:"phone,omitempty"`
	DateOfBirth   *time.Time         `bson:"dateOfBirth,omitempty" json:"dateOfBirth,omitempty"`
	Gender        string             `bson:"gender,omitempty" json:"gender,omitempty"`
	Address       string             `bson:"address,omitempty" json:"address,omitempty"`
	Notes         string             `bson:"notes,omitempty" json:"notes,omitempty"`
	IsActive      bool               `bson:"isActive" json:"isActive"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// CreatePatient cria um novo paciente
func CreatePatient(ctx context.Context, nutritionistID string, patient Patient) (*Patient, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	patient.NutritionistID = nutritionistOID
	patient.IsActive = true
	patient.CreatedAt = time.Now()
	patient.UpdatedAt = time.Now()

	result, err := database.PatientsCollection.InsertOne(ctx, patient)
	if err != nil {
		return nil, err
	}

	patient.ID = result.InsertedID.(primitive.ObjectID)
	return &patient, nil
}

// GetPatient busca um paciente por ID
func GetPatient(ctx context.Context, patientID string, nutritionistID string) (*Patient, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	var patient Patient
	err = database.PatientsCollection.FindOne(ctx, bson.M{
		"_id":          patientOID,
		"nutritionistId": nutritionistOID,
	}).Decode(&patient)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPatientNotFound
		}
		return nil, err
	}

	return &patient, nil
}

// ListPatients lista todos os pacientes de um nutricionista
func ListPatients(ctx context.Context, nutritionistID string, page, limit int) ([]Patient, int64, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, 0, err
	}

	filter := bson.M{"nutritionistId": nutritionistOID}

	// Contar total
	total, err := database.PatientsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Buscar com paginação
	skip := int64((page - 1) * limit)
	limitInt64 := int64(limit)
	cursor, err := database.PatientsCollection.Find(ctx, filter, &options.FindOptions{
		Skip:  &skip,
		Limit: &limitInt64,
		Sort:  bson.M{"createdAt": -1},
	})
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var patients []Patient
	if err = cursor.All(ctx, &patients); err != nil {
		return nil, 0, err
	}

	return patients, total, nil
}

// UpdatePatient atualiza um paciente
func UpdatePatient(ctx context.Context, patientID string, nutritionistID string, updates bson.M) (*Patient, error) {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	updates["updatedAt"] = time.Now()

	returnAfter := options.After
	result := database.PatientsCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":          patientOID,
			"nutritionistId": nutritionistOID,
		},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &returnAfter},
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return nil, ErrPatientNotFound
		}
		return nil, result.Err()
	}

	var patient Patient
	if err = result.Decode(&patient); err != nil {
		return nil, err
	}

	return &patient, nil
}

// DeletePatient remove um paciente
func DeletePatient(ctx context.Context, patientID string, nutritionistID string) error {
	patientOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return err
	}

	result, err := database.PatientsCollection.DeleteOne(ctx, bson.M{
		"_id":          patientOID,
		"nutritionistId": nutritionistOID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrPatientNotFound
	}

	return nil
}

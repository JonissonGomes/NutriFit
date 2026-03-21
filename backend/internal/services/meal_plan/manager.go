package meal_plan

import (
	"context"
	"errors"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrMealPlanNotFound = errors.New("plano alimentar não encontrado")
	ErrInvalidMealPlan  = errors.New("plano alimentar inválido")
)

// CalculateMacros calcula os macros totais de um plano alimentar
func CalculateMacros(meals []models.Meal) *models.MacroNutrients {
	total := &models.MacroNutrients{}

	for _, meal := range meals {
		if meal.Macros != nil {
			total.Calories += meal.Macros.Calories
			total.Proteins += meal.Macros.Proteins
			total.Carbohydrates += meal.Macros.Carbohydrates
			total.Fats += meal.Macros.Fats
			if meal.Macros.Fiber > 0 {
				total.Fiber += meal.Macros.Fiber
			}
		}
	}

	return total
}

// CalculateMealMacros calcula os macros de uma refeição
func CalculateMealMacros(foods []models.FoodItem) *models.MacroNutrients {
	total := &models.MacroNutrients{}

	for _, food := range foods {
		if food.Macros != nil {
			// Calcular proporção baseada na quantidade
			multiplier := food.Quantity / 100.0 // assumindo que macros são por 100g
			total.Calories += food.Macros.Calories * multiplier
			total.Proteins += food.Macros.Proteins * multiplier
			total.Carbohydrates += food.Macros.Carbohydrates * multiplier
			total.Fats += food.Macros.Fats * multiplier
			if food.Macros.Fiber > 0 {
				total.Fiber += food.Macros.Fiber * multiplier
			}
		}
	}

	return total
}

// CreateMealPlan cria um novo plano alimentar
func CreateMealPlan(ctx context.Context, nutritionistID string, mealPlan models.MealPlan) (*models.MealPlan, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	if mealPlan.PatientID != nil {
		patientOID, err := primitive.ObjectIDFromHex(mealPlan.PatientID.Hex())
		if err == nil {
			mealPlan.PatientID = &patientOID
		}
	}

	mealPlan.NutritionistID = nutritionistOID
	mealPlan.CreatedAt = time.Now()
	mealPlan.UpdatedAt = time.Now()

	// Calcular macros totais
	mealPlan.TotalMacros = CalculateMacros(mealPlan.Meals)

	// Calcular macros de cada refeição
	for i := range mealPlan.Meals {
		mealPlan.Meals[i].Macros = CalculateMealMacros(mealPlan.Meals[i].Foods)
	}

	result, err := database.MealPlansCollection.InsertOne(ctx, mealPlan)
	if err != nil {
		return nil, err
	}

	mealPlan.ID = result.InsertedID.(primitive.ObjectID)
	return &mealPlan, nil
}

// GetMealPlan busca um plano alimentar por ID
func GetMealPlan(ctx context.Context, mealPlanID string, nutritionistID string) (*models.MealPlan, error) {
	mealPlanOID, err := primitive.ObjectIDFromHex(mealPlanID)
	if err != nil {
		return nil, err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	var mealPlan models.MealPlan
	err = database.MealPlansCollection.FindOne(ctx, bson.M{
		"_id":            mealPlanOID,
		"nutritionistId": nutritionistOID,
	}).Decode(&mealPlan)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrMealPlanNotFound
		}
		return nil, err
	}

	return &mealPlan, nil
}

// ListMealPlans lista planos alimentares
func ListMealPlans(ctx context.Context, nutritionistID string, patientID *string, page, limit int) ([]models.MealPlan, int64, error) {
	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, 0, err
	}

	filter := bson.M{"nutritionistId": nutritionistOID}
	if patientID != nil {
		patientOID, err := primitive.ObjectIDFromHex(*patientID)
		if err == nil {
			filter["patientId"] = patientOID
		}
	}

	// Contar total
	total, err := database.MealPlansCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Buscar com paginação
	skip := int64((page - 1) * limit)
	limitInt64 := int64(limit)
	cursor, err := database.MealPlansCollection.Find(ctx, filter, &options.FindOptions{
		Skip:  &skip,
		Limit: &limitInt64,
		Sort:  bson.M{"createdAt": -1},
	})
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var mealPlans []models.MealPlan
	if err = cursor.All(ctx, &mealPlans); err != nil {
		return nil, 0, err
	}

	return mealPlans, total, nil
}

// ListMealPlansForPatient lista planos alimentares para um paciente autenticado.
func ListMealPlansForPatient(ctx context.Context, patientID string, page, limit int) ([]models.MealPlan, int64, error) {
	userOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, 0, err
	}
	linkedPatientIDs := resolveLinkedPatientIDs(ctx, userOID)
	or := []bson.M{{"patientId": userOID}}
	if len(linkedPatientIDs) > 0 {
		or = append(or, bson.M{"patientId": bson.M{"$in": linkedPatientIDs}})
	}
	filter := bson.M{"$or": or}

	total, err := database.MealPlansCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}

	skip := int64((page - 1) * limit)
	limitInt64 := int64(limit)
	cursor, err := database.MealPlansCollection.Find(ctx, filter, &options.FindOptions{
		Skip:  &skip,
		Limit: &limitInt64,
		Sort:  bson.M{"updatedAt": -1},
	})
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var mealPlans []models.MealPlan
	if err = cursor.All(ctx, &mealPlans); err != nil {
		return nil, 0, err
	}

	return mealPlans, total, nil
}

// GetMealPlanForPatient busca um plano alimentar garantindo que ele pertence ao paciente.
func GetMealPlanForPatient(ctx context.Context, mealPlanID string, patientID string) (*models.MealPlan, error) {
	mealPlanOID, err := primitive.ObjectIDFromHex(mealPlanID)
	if err != nil {
		return nil, err
	}
	userOID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, err
	}
	linkedPatientIDs := resolveLinkedPatientIDs(ctx, userOID)
	or := []bson.M{{"patientId": userOID}}
	if len(linkedPatientIDs) > 0 {
		or = append(or, bson.M{"patientId": bson.M{"$in": linkedPatientIDs}})
	}

	var mealPlan models.MealPlan
	err = database.MealPlansCollection.FindOne(ctx, bson.M{
		"_id": mealPlanOID,
		"$or": or,
	}).Decode(&mealPlan)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrMealPlanNotFound
		}
		return nil, err
	}
	return &mealPlan, nil
}

func resolveLinkedPatientIDs(ctx context.Context, userID primitive.ObjectID) []primitive.ObjectID {
	cursor, err := database.PatientsCollection.Find(ctx, bson.M{"userId": userID}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil
	}
	defer cursor.Close(ctx)
	var docs []struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	if err := cursor.All(ctx, &docs); err != nil {
		return nil
	}
	ids := make([]primitive.ObjectID, 0, len(docs))
	for _, d := range docs {
		ids = append(ids, d.ID)
	}
	return ids
}

// UpdateMealPlan atualiza um plano alimentar
func UpdateMealPlan(ctx context.Context, mealPlanID string, nutritionistID string, updates bson.M) (*models.MealPlan, error) {
	mealPlanOID, err := primitive.ObjectIDFromHex(mealPlanID)
	if err != nil {
		return nil, err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return nil, err
	}

	// Se meals foram atualizados, recalcular macros
	if meals, ok := updates["meals"].([]models.Meal); ok {
		updates["totalMacros"] = CalculateMacros(meals)
		for i := range meals {
			meals[i].Macros = CalculateMealMacros(meals[i].Foods)
		}
		updates["meals"] = meals
	}

	updates["updatedAt"] = time.Now()

	returnAfter := options.After
	result := database.MealPlansCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":            mealPlanOID,
			"nutritionistId": nutritionistOID,
		},
		bson.M{"$set": updates},
		&options.FindOneAndUpdateOptions{ReturnDocument: &returnAfter},
	)

	if result.Err() != nil {
		if errors.Is(result.Err(), mongo.ErrNoDocuments) {
			return nil, ErrMealPlanNotFound
		}
		return nil, result.Err()
	}

	var mealPlan models.MealPlan
	if err = result.Decode(&mealPlan); err != nil {
		return nil, err
	}

	return &mealPlan, nil
}

// DeleteMealPlan remove um plano alimentar
func DeleteMealPlan(ctx context.Context, mealPlanID string, nutritionistID string) error {
	mealPlanOID, err := primitive.ObjectIDFromHex(mealPlanID)
	if err != nil {
		return err
	}

	nutritionistOID, err := primitive.ObjectIDFromHex(nutritionistID)
	if err != nil {
		return err
	}

	result, err := database.MealPlansCollection.DeleteOne(ctx, bson.M{
		"_id":            mealPlanOID,
		"nutritionistId": nutritionistOID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return ErrMealPlanNotFound
	}

	return nil
}

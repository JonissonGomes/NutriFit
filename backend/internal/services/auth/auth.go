package auth

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"nufit/backend/internal/config"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/cfm"
)

var (
	// CRN: número (4-10 dígitos) ou formato CRN-N 12345
	crnNumRegex = regexp.MustCompile(`(?i)^(?:CRN[-]?\s*\d{1,2}\s*)?(\d{4,10})$`)
	// CRM: número (4-8 dígitos) ou formato CRM/UF 123456
	crmNumRegex = regexp.MustCompile(`(?i)^(?:CRM[/-]?\s*[A-Z]{2}\s*)?(\d{4,8})$`)
)

func validateProfessionalRegistration(reg *models.ProfessionalRegistration, role models.UserRole) error {
	if reg == nil || reg.Type == "" || strings.TrimSpace(reg.Number) == "" {
		if role == models.RoleNutricionista {
			return errors.New("CRN é obrigatório para nutricionistas")
		}
		if role == models.RoleMedico {
			return errors.New("CRM é obrigatório para médicos")
		}
		return nil
	}
	num := strings.TrimSpace(reg.Number)
	switch role {
	case models.RoleNutricionista:
		if reg.Type != "CRN" {
			return errors.New("nutricionista deve informar um CRN válido")
		}
		if !crnNumRegex.MatchString(num) {
			return errors.New("formato de CRN inválido. Ex.: CRN-1 12345 ou apenas o número")
		}
	case models.RoleMedico:
		if reg.Type != "CRM" {
			return errors.New("médico deve informar um CRM válido")
		}
		if !crmNumRegex.MatchString(num) {
			return errors.New("formato de CRM inválido. Ex.: CRM/SP 123456 ou apenas o número")
		}
	default:
		if reg.Type != "" || num != "" {
			return errors.New("registro profissional não permitido para este tipo de conta")
		}
	}
	return nil
}

// CheckProfessionalRegistrationAvailable verifica se o CRN/CRM está disponível (não cadastrado). Retorna true se disponível.
func CheckProfessionalRegistrationAvailable(regType, number string) (bool, error) {
	taken, err := isProfessionalRegistrationTaken(regType, number)
	return !taken, err
}

func isProfessionalRegistrationTaken(regType, number string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var u models.User
	err := database.UsersCollection.FindOne(ctx, bson.M{
		"professionalRegistration.type":   regType,
		"professionalRegistration.number": strings.TrimSpace(number),
	}).Decode(&u)
	if err == mongo.ErrNoDocuments {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func Register(req *models.RegisterRequest) (*models.User, *TokenPair, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	role := models.UserRole(req.Role)

	if err := validateProfessionalRegistration(req.ProfessionalRegistration, role); err != nil {
		return nil, nil, err
	}

	var reg *models.ProfessionalRegistration
	if req.ProfessionalRegistration != nil && req.ProfessionalRegistration.Type != "" {
		reg = &models.ProfessionalRegistration{
			Type:   req.ProfessionalRegistration.Type,
			Number: strings.TrimSpace(req.ProfessionalRegistration.Number),
		}
		taken, err := isProfessionalRegistrationTaken(reg.Type, reg.Number)
		if err != nil {
			return nil, nil, err
		}
		if taken {
			return nil, nil, errors.New("este CRN/CRM já está cadastrado na plataforma")
		}
		// Validação opcional de CRM no portal do CFM (gratuita). Em falha, não bloqueia o registro.
		if role == models.RoleMedico && reg.Type == "CRM" {
			if uf, number, ok := cfm.ParseCRMNumber(reg.Number); ok && uf != "" && number != "" {
				cfmCtx, cfmCancel := context.WithTimeout(context.Background(), 12*time.Second)
				valid, cfmErr := cfm.NewClient().ValidateCRM(cfmCtx, uf, number)
				cfmCancel()
				if cfmErr == nil && !valid {
					// CRM não encontrado no CFM; mesmo assim permitimos registro (fallback solicitado).
					// Opcional: log ou flag "não verificado" no futuro.
				}
				// Se cfmErr != nil (timeout, indisponível, etc.), ignoramos e seguimos com o cadastro.
			}
		}
	}

	var existingUser models.User
	err := database.UsersCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return nil, nil, errors.New("user already exists")
	} else if err != mongo.ErrNoDocuments {
		return nil, nil, err
	}

	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return nil, nil, err
	}

	storageLimit := config.AppConfig.StorageLimitFree

	user := &models.User{
		ID:                        primitive.NewObjectID(),
		Email:                     req.Email,
		Name:                      req.Name,
		PasswordHash:              hashedPassword,
		Role:                      role,
		ProfessionalRegistration:  reg,
		StorageUsed:                0,
		StorageLimit:               storageLimit,
		Plan:                      models.PlanFree,
		CreatedAt:                 time.Now(),
		UpdatedAt:                 time.Now(),
	}

	_, err = database.UsersCollection.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, nil, errors.New("este CRN/CRM já está cadastrado na plataforma")
		}
		return nil, nil, err
	}

	// Generate tokens
	tokens, err := GenerateTokenPair(user.ID.Hex(), user.Email, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	// Save refresh token
	refreshToken := &models.RefreshToken{
		ID:        primitive.NewObjectID(),
		UserID:    user.ID,
		Token:     tokens.RefreshToken,
		ExpiresAt: time.Now().Add(config.AppConfig.JWTRefreshExpiry),
		CreatedAt: time.Now(),
		Revoked:   false,
	}

	_, err = database.RefreshTokensCollection.InsertOne(ctx, refreshToken)
	if err != nil {
		return nil, nil, err
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return user, tokens, nil
}

func Login(email, password string) (*models.User, *TokenPair, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := database.UsersCollection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil, errors.New("invalid credentials")
		}
		return nil, nil, err
	}

	if user.PasswordHash == "" {
		return nil, nil, errors.New("password login not available for this user")
	}

	if !checkPasswordHash(password, user.PasswordHash) {
		return nil, nil, errors.New("invalid credentials")
	}

	// Generate tokens
	tokens, err := GenerateTokenPair(user.ID.Hex(), user.Email, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	// Save refresh token
	refreshToken := &models.RefreshToken{
		ID:        primitive.NewObjectID(),
		UserID:    user.ID,
		Token:     tokens.RefreshToken,
		ExpiresAt: time.Now().Add(config.AppConfig.JWTRefreshExpiry),
		CreatedAt: time.Now(),
		Revoked:   false,
	}

	_, err = database.RefreshTokensCollection.InsertOne(ctx, refreshToken)
	if err != nil {
		return nil, nil, err
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return &user, tokens, nil
}

func OAuthGoogle(code string) (*models.User, *TokenPair, error) {
	// Exchange code for user info
	googleUser, err := OAuthGoogleExchange(code)
	if err != nil {
		return nil, nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if user exists by Google ID
	var user models.User
	err = database.UsersCollection.FindOne(ctx, bson.M{"oauth.google.id": googleUser.ID}).Decode(&user)
	
	if err == mongo.ErrNoDocuments {
		// Check if email exists
		err = database.UsersCollection.FindOne(ctx, bson.M{"email": googleUser.Email}).Decode(&user)
		if err == mongo.ErrNoDocuments {
			// Create new user
			storageLimit := config.AppConfig.StorageLimitFree
			user = models.User{
				ID:           primitive.NewObjectID(),
				Email:        googleUser.Email,
				Name:         googleUser.Name,
				Role:         models.RoleNutricionista, // Default, can be changed
				OAuth: &models.OAuth{
					Google: &models.GoogleOAuth{
						ID:      googleUser.ID,
						Email:   googleUser.Email,
						Picture: googleUser.Picture,
					},
				},
				Avatar:       googleUser.Picture,
				StorageUsed:  0,
				StorageLimit: storageLimit,
				Plan:         models.PlanFree,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}

			_, err = database.UsersCollection.InsertOne(ctx, user)
			if err != nil {
				return nil, nil, err
			}
		} else if err == nil {
			// Update existing user with OAuth info
			update := bson.M{
				"$set": bson.M{
					"oauth.google": models.GoogleOAuth{
						ID:      googleUser.ID,
						Email:   googleUser.Email,
						Picture: googleUser.Picture,
					},
					"avatar":     googleUser.Picture,
					"updatedAt": time.Now(),
				},
			}
			_, err = database.UsersCollection.UpdateOne(ctx, bson.M{"_id": user.ID}, update)
			if err != nil {
				return nil, nil, err
			}
		} else {
			return nil, nil, err
		}
	} else if err != nil {
		return nil, nil, err
	}

	// Generate tokens
	tokens, err := GenerateTokenPair(user.ID.Hex(), user.Email, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	// Save refresh token
	refreshToken := &models.RefreshToken{
		ID:        primitive.NewObjectID(),
		UserID:    user.ID,
		Token:     tokens.RefreshToken,
		ExpiresAt: time.Now().Add(config.AppConfig.JWTRefreshExpiry),
		CreatedAt: time.Now(),
		Revoked:   false,
	}

	_, err = database.RefreshTokensCollection.InsertOne(ctx, refreshToken)
	if err != nil {
		return nil, nil, err
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return &user, tokens, nil
}

func RefreshAccessToken(refreshTokenString string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Validate refresh token
	claims, err := ValidateJWT(refreshTokenString)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	// Check if token exists in database and is not revoked
	var tokenDoc models.RefreshToken
	err = database.RefreshTokensCollection.FindOne(ctx, bson.M{
		"token": refreshTokenString,
		"revoked": false,
		"expiresAt": bson.M{"$gt": time.Now()},
	}).Decode(&tokenDoc)

	if err != nil {
		return "", errors.New("invalid or expired refresh token")
	}

	// Generate new access token
	newAccessToken, err := GenerateJWT(claims.Subject, claims.Email, claims.Role)
	if err != nil {
		return "", err
	}

	return newAccessToken, nil
}

func RevokeRefreshToken(refreshTokenString string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := database.RefreshTokensCollection.UpdateOne(
		ctx,
		bson.M{"token": refreshTokenString},
		bson.M{"$set": bson.M{"revoked": true}},
	)

	return err
}

func GetUserByID(userID string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	var user models.User
	err = database.UsersCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	user.PasswordHash = ""
	return &user, nil
}


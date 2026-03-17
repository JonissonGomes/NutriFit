package auth

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"arck-design/backend/internal/config"
	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"
)


func Register(email, password, name string, role models.UserRole) (*models.User, *TokenPair, error) {
	// Check if user already exists
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingUser models.User
	err := database.UsersCollection.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, nil, errors.New("user already exists")
	} else if err != mongo.ErrNoDocuments {
		return nil, nil, err
	}

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return nil, nil, err
	}

	// Determine storage limit based on plan
	storageLimit := config.AppConfig.StorageLimitFree
	if role == models.RoleNutricionista {
		storageLimit = config.AppConfig.StorageLimitFree
	}

	// Create user
	user := &models.User{
		ID:           primitive.NewObjectID(),
		Email:        email,
		Name:         name,
		PasswordHash: hashedPassword,
		Role:         role,
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

func Login(email, password string, expectedRole models.UserRole) (*models.User, *TokenPair, error) {
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

	// Check password
	if user.PasswordHash == "" {
		return nil, nil, errors.New("password login not available for this user")
	}

	if !checkPasswordHash(password, user.PasswordHash) {
		return nil, nil, errors.New("invalid credentials")
	}

	// Check role
	if user.Role != expectedRole {
		return nil, nil, errors.New("invalid user role")
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


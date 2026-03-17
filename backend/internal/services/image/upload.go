package image

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/cloudinary"
)

func UploadImage(ctx context.Context, fileData []byte, filename, projectID, userID string) (*models.Image, error) {
	// Validate image
	if err := ValidateImage(fileData, MaxImageSize); err != nil {
		return nil, err
	}

	// Get dimensions
	width, height, err := GetImageDimensions(fileData)
	if err != nil {
		return nil, err
	}

	// Validate dimensions
	if err := ValidateDimensions(width, height); err != nil {
		return nil, err
	}

	// Compress image locally
	compressedData, err := CompressImage(fileData, DefaultQuality)
	if err != nil {
		return nil, fmt.Errorf("failed to compress image: %w", err)
	}

	// Convert IDs
	projectObjID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Generate public ID
	sanitizedFilename := sanitizeFilename(filename)
	publicID := cloudinary.BuildPublicID(userID, projectID, sanitizedFilename)

	// Upload to Cloudinary
	uploadResult, err := cloudinary.UploadImage(ctx, compressedData, publicID, "")
	if err != nil {
		return nil, fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	// Build URLs
	urls := &models.ImageURLs{
		Original:   cloudinary.GetOriginalURL(uploadResult.PublicID),
		Compressed: cloudinary.GetCompressedURL(uploadResult.PublicID),
		Thumbnail:  cloudinary.GetThumbnailURL(uploadResult.PublicID),
		Medium:     cloudinary.GetMediumURL(uploadResult.PublicID),
	}

	// Get position (count existing images)
	position, err := getNextImagePosition(projectObjID)
	if err != nil {
		position = 0
	}

	// Create image record
	image := &models.Image{
		ID:           primitive.NewObjectID(),
		ProjectID:    projectObjID,
		UserID:       userObjID,
		CloudinaryID: uploadResult.PublicID,
		PublicID:     uploadResult.PublicID,
		URLs:         urls,
		Filename:     filename,
		MimeType:     uploadResult.Format,
		Size: &models.ImageSize{
			Original:   int64(len(fileData)),
			Compressed: int64(len(compressedData)),
		},
		Dimensions: &models.ImageDimensions{
			Width:  width,
			Height: height,
		},
		Position:  position,
		Status:    models.MediaStatusReady,
		Metadata: &models.ImageMetadata{
			Compression: &models.CompressionMetadata{
				Quality: DefaultQuality,
				Format:  "auto",
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to database
	_, err = database.ImagesCollection.InsertOne(ctx, image)
	if err != nil {
		// Try to delete from Cloudinary if DB insert fails
		_ = cloudinary.DeleteImage(ctx, uploadResult.PublicID)
		return nil, err
	}

	// Update project files count
	_ = updateProjectFilesCount(projectObjID)

	// Update user storage used
	_ = updateUserStorageUsed(userObjID, int64(len(compressedData)))

	return image, nil
}

func sanitizeFilename(filename string) string {
	// Remove extension
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)
	
	// Sanitize
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, " ", "-")
	name = strings.ReplaceAll(name, "_", "-")
	
	// Remove special characters
	var sanitized strings.Builder
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			sanitized.WriteRune(r)
		}
	}
	
	return sanitized.String() + ext
}

func getNextImagePosition(projectID primitive.ObjectID) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := database.ImagesCollection.CountDocuments(ctx, bson.M{"projectId": projectID})
	return int(count), err
}

func updateProjectFilesCount(projectID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := database.ImagesCollection.CountDocuments(ctx, bson.M{"projectId": projectID})
	if err != nil {
		return err
	}

	_, err = database.ProjectsCollection.UpdateOne(
		ctx,
		bson.M{"_id": projectID},
		bson.M{"$set": bson.M{"filesCount": int(count)}},
	)

	return err
}

func updateUserStorageUsed(userID primitive.ObjectID, size int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := database.UsersCollection.UpdateOne(
		ctx,
		bson.M{"_id": userID},
		bson.M{"$inc": bson.M{"storageUsed": size}},
	)

	return err
}


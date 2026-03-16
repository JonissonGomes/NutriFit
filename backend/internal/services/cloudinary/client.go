package cloudinary

import (
	"bytes"
	"context"
	"fmt"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"arck-design/backend/internal/config"
)

var cld *cloudinary.Cloudinary

func InitCloudinary() error {
	var err error
	cld, err = cloudinary.NewFromParams(
		config.AppConfig.CloudinaryCloudName,
		config.AppConfig.CloudinaryAPIKey,
		config.AppConfig.CloudinaryAPISecret,
	)
	return err
}

func GetClient() *cloudinary.Cloudinary {
	return cld
}

func BuildPublicID(userID, projectID, filename string) string {
	return fmt.Sprintf("%s/users/%s/projects/%s/%s",
		config.AppConfig.CloudinaryBaseFolder,
		userID,
		projectID,
		filename,
	)
}

func BuildPublicIDForAvatar(userID, filename string) string {
	return fmt.Sprintf("%s/users/%s/avatar/%s",
		config.AppConfig.CloudinaryBaseFolder,
		userID,
		filename,
	)
}

func BuildPublicIDForCover(userID, filename string) string {
	return fmt.Sprintf("%s/users/%s/cover/%s",
		config.AppConfig.CloudinaryBaseFolder,
		userID,
		filename,
	)
}

func UploadImage(ctx context.Context, fileData []byte, publicID string, folder string) (*uploader.UploadResult, error) {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return nil, err
		}
	}

	overwrite := true
	params := uploader.UploadParams{
		PublicID:     publicID,
		Folder:       folder,
		Overwrite:    &overwrite,
		ResourceType: "image",
	}

	// Converter []byte para io.Reader usando bytes.NewReader
	fileReader := bytes.NewReader(fileData)
	
	result, err := cld.Upload.Upload(ctx, fileReader, params)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	return result, nil
}

func DeleteImage(ctx context.Context, publicID string) error {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return err
		}
	}

	_, err := cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})

	return err
}

func GetImageURL(publicID string, transformation string) string {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return ""
		}
	}

	// Build Cloudinary URL manually
	baseURL := fmt.Sprintf("https://res.cloudinary.com/%s/image/upload", config.AppConfig.CloudinaryCloudName)
	if transformation != "" {
		return fmt.Sprintf("%s/%s/%s", baseURL, transformation, publicID)
	}
	return fmt.Sprintf("%s/%s", baseURL, publicID)
}

// UploadRaw faz upload de um arquivo raw (não-imagem) para o Cloudinary
func UploadRaw(ctx context.Context, filePath string, folder string) (*uploader.UploadResult, error) {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return nil, err
		}
	}

	overwrite := true
	params := uploader.UploadParams{
		Folder:       folder,
		Overwrite:    &overwrite,
		ResourceType: "raw",
	}

	result, err := cld.Upload.Upload(ctx, filePath, params)
	if err != nil {
		return nil, fmt.Errorf("failed to upload raw file to Cloudinary: %w", err)
	}

	return result, nil
}

// UploadVideo faz upload de um vídeo para o Cloudinary
func UploadVideo(ctx context.Context, filePath string, folder string) (*uploader.UploadResult, error) {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return nil, err
		}
	}

	overwrite := true
	params := uploader.UploadParams{
		Folder:       folder,
		Overwrite:    &overwrite,
		ResourceType: "video",
	}

	result, err := cld.Upload.Upload(ctx, filePath, params)
	if err != nil {
		return nil, fmt.Errorf("failed to upload video to Cloudinary: %w", err)
	}

	return result, nil
}

// DeleteRaw deleta um arquivo raw do Cloudinary
func DeleteRaw(ctx context.Context, publicID string) error {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return err
		}
	}

	_, err := cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: "raw",
	})

	return err
}

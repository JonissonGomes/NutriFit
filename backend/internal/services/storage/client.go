package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"nufit/backend/internal/config"
	"nufit/backend/internal/utils"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
)

var (
	mu     sync.RWMutex
	client *s3.Client
	bucket string
)

// InitR2 inicializa o cliente S3-compatível do Cloudflare R2.
func InitR2(ctx context.Context) error {
	cfg := config.AppConfig
	if cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" || cfg.R2BucketName == "" || cfg.R2EndpointURL == "" {
		return fmt.Errorf("variáveis R2 não configuradas (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL)")
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.R2AccessKeyID,
			cfg.R2SecretAccessKey,
			"",
		)),
		awsconfig.WithRegion("auto"),
		awsconfig.WithRequestChecksumCalculation(aws.RequestChecksumCalculationWhenRequired),
		awsconfig.WithResponseChecksumValidation(aws.ResponseChecksumValidationWhenRequired),
	)
	if err != nil {
		return fmt.Errorf("falha ao carregar config AWS/R2: %w", err)
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(strings.TrimRight(cfg.R2EndpointURL, "/"))
		o.UsePathStyle = true
	})

	if _, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(cfg.R2BucketName),
	}); err != nil {
		return fmt.Errorf("bucket R2 %q inacessível ou inexistente: %w (crie o bucket no painel Cloudflare R2 ou corrija R2_BUCKET_NAME)", cfg.R2BucketName, err)
	}

	if strings.TrimSpace(cfg.R2PublicBaseURL) == "" {
		utils.Warn("R2_PUBLIC_BASE_URL não configurado — uploads funcionam, mas as URLs públicas das imagens não serão acessíveis no navegador")
	}

	mu.Lock()
	client = s3Client
	bucket = cfg.R2BucketName
	mu.Unlock()
	return nil
}

func getClient() (*s3.Client, string, error) {
	mu.RLock()
	defer mu.RUnlock()
	if client == nil {
		return nil, "", fmt.Errorf("storage R2 não inicializado")
	}
	return client, bucket, nil
}

// UploadImage envia bytes de imagem para o R2.
func UploadImage(ctx context.Context, fileData []byte, objectKey string, _folder string) (*UploadResult, error) {
	contentType := detectContentType(objectKey, fileData)
	return uploadBytes(ctx, fileData, objectKey, contentType)
}

// UploadRaw envia um arquivo do disco para o R2.
func UploadRaw(ctx context.Context, filePath string, objectKey string) (*UploadResult, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("falha ao ler arquivo: %w", err)
	}
	contentType := detectContentType(objectKey, data)
	if contentType == "application/octet-stream" {
		if ct := mime.TypeByExtension(filepath.Ext(filePath)); ct != "" {
			contentType = ct
		}
	}
	return uploadBytes(ctx, data, objectKey, contentType)
}

// UploadVideo envia um vídeo do disco para o R2.
func UploadVideo(ctx context.Context, filePath string, objectKey string) (*UploadResult, error) {
	return UploadRaw(ctx, filePath, objectKey)
}

func uploadBytes(ctx context.Context, fileData []byte, objectKey, contentType string) (*UploadResult, error) {
	s3Client, bucketName, err := getClient()
	if err != nil {
		if initErr := InitR2(ctx); initErr != nil {
			return nil, initErr
		}
		s3Client, bucketName, err = getClient()
		if err != nil {
			return nil, err
		}
	}

	key := strings.TrimLeft(strings.ReplaceAll(objectKey, "\\", "/"), "/")
	if key == "" {
		return nil, fmt.Errorf("chave do objeto inválida")
	}

	kind := fileKind(contentType, key)
	if err := ValidateFileSize(int64(len(fileData)), kind); err != nil {
		return nil, err
	}
	if uid := userIDFromObjectKey(key); uid != "" {
		if err := CheckUserQuota(ctx, uid, int64(len(fileData))); err != nil {
			return nil, err
		}
	}

	_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(fileData),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao enviar para R2: %w", mapStorageError(err))
	}

	publicURL := PublicURL(key)
	ext := strings.TrimPrefix(filepath.Ext(key), ".")

	if uid := userIDFromObjectKey(key); uid != "" {
		_ = AddUserStorageUsed(ctx, uid, int64(len(fileData)))
	}

	return &UploadResult{
		PublicID:  key,
		SecureURL: publicURL,
		URL:       publicURL,
		Format:    ext,
		Bytes:     int64(len(fileData)),
	}, nil
}

// DeleteObject remove um objeto do R2 pela chave.
func DeleteObject(ctx context.Context, objectKey string) error {
	return deleteByKey(ctx, objectKey)
}

// DeleteImage e DeleteRaw mantêm compatibilidade com a API anterior.
func DeleteImage(ctx context.Context, objectKey string) error {
	return deleteByKey(ctx, objectKey)
}

func DeleteRaw(ctx context.Context, objectKey string) error {
	return deleteByKey(ctx, objectKey)
}

func deleteByKey(ctx context.Context, objectKey string) error {
	s3Client, bucketName, err := getClient()
	if err != nil {
		if initErr := InitR2(ctx); initErr != nil {
			return initErr
		}
		s3Client, bucketName, err = getClient()
		if err != nil {
			return err
		}
	}

	key := strings.TrimLeft(strings.ReplaceAll(objectKey, "\\", "/"), "/")
	if key == "" {
		return fmt.Errorf("chave do objeto inválida")
	}

	_, err = s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	return err
}

// ListByPrefix lista chaves sob um prefixo (ex.: {userId}/recipes/).
func ListByPrefix(ctx context.Context, prefix string, maxKeys int32) ([]string, error) {
	s3Client, bucketName, err := getClient()
	if err != nil {
		return nil, err
	}

	prefix = strings.TrimLeft(strings.ReplaceAll(prefix, "\\", "/"), "/")
	out, err := s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket:  aws.String(bucketName),
		Prefix:  aws.String(prefix),
		MaxKeys: aws.Int32(maxKeys),
	})
	if err != nil {
		return nil, err
	}

	keys := make([]string, 0, len(out.Contents))
	for _, obj := range out.Contents {
		if obj.Key != nil {
			keys = append(keys, *obj.Key)
		}
	}
	return keys, nil
}

func detectContentType(objectKey string, data []byte) string {
	if ct := mime.TypeByExtension(filepath.Ext(objectKey)); ct != "" {
		return ct
	}
	return httpDetectContentType(data)
}

func httpDetectContentType(data []byte) string {
	if len(data) == 0 {
		return "application/octet-stream"
	}
	n := len(data)
	if n > 512 {
		n = 512
	}
	return detectByMagic(data[:n])
}

func detectByMagic(data []byte) string {
	switch {
	case len(data) >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF:
		return "image/jpeg"
	case len(data) >= 8 && string(data[:8]) == "\x89PNG\r\n\x1a\n":
		return "image/png"
	case len(data) >= 6 && (string(data[:6]) == "GIF87a" || string(data[:6]) == "GIF89a"):
		return "image/gif"
	case len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP":
		return "image/webp"
	case len(data) >= 4 && string(data[:4]) == "%PDF":
		return "application/pdf"
	default:
		return "application/octet-stream"
	}
}

// ReadObject lê um objeto do R2 (útil para processamento interno).
func ReadObject(ctx context.Context, objectKey string) ([]byte, error) {
	s3Client, bucketName, err := getClient()
	if err != nil {
		return nil, err
	}
	key := strings.TrimLeft(strings.ReplaceAll(objectKey, "\\", "/"), "/")
	out, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer out.Body.Close()
	return io.ReadAll(out.Body)
}

func fileKind(contentType, objectKey string) string {
	ct := strings.ToLower(contentType)
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(objectKey), "."))
	if strings.HasPrefix(ct, "image/") {
		return "image"
	}
	switch ext {
	case "glb", "gltf", "obj", "fbx", "stl", "usdz":
		return "model"
	case "jpg", "jpeg", "png", "gif", "webp":
		return "image"
	}
	if strings.Contains(ct, "presentation") || ext == "pptx" || ext == "ppt" {
		return "document"
	}
	if ct == "application/pdf" || ext == "pdf" {
		return "document"
	}
	if strings.Contains(objectKey, "/models/") {
		return "model"
	}
	return "document"
}

func mapStorageError(err error) error {
	if err == nil {
		return nil
	}
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		switch apiErr.ErrorCode() {
		case "NoSuchBucket":
			return fmt.Errorf("bucket não encontrado no R2 — verifique R2_BUCKET_NAME e crie o bucket no Cloudflare")
		case "AccessDenied", "InvalidAccessKeyId", "SignatureDoesNotMatch":
			return fmt.Errorf("credenciais R2 inválidas ou sem permissão de escrita")
		}
	}
	var notFound *types.NotFound
	if errors.As(err, &notFound) {
		return fmt.Errorf("recurso não encontrado no R2")
	}
	return err
}

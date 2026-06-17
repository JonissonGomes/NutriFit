package storage

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"nufit/backend/internal/config"
	"nufit/backend/internal/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var ErrStorageQuotaExceeded = errors.New("cota de armazenamento do plano atingida")

// CheckUserQuota verifica se o usuário ainda tem espaço para um novo upload.
func CheckUserQuota(ctx context.Context, userID string, additionalBytes int64) error {
	if additionalBytes <= 0 {
		return nil
	}
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	var u struct {
		StorageUsed  int64 `bson:"storageUsed"`
		StorageLimit int64 `bson:"storageLimit"`
	}
	err = database.UsersCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&u)
	if err != nil {
		return err
	}
	if u.StorageLimit <= 0 {
		return nil
	}
	if u.StorageUsed+additionalBytes > u.StorageLimit {
		return fmt.Errorf("%w: limite de %s", ErrStorageQuotaExceeded, formatBytes(u.StorageLimit))
	}
	return nil
}

// AddUserStorageUsed incrementa o uso de armazenamento do usuário.
func AddUserStorageUsed(ctx context.Context, userID string, size int64) error {
	if size <= 0 || strings.TrimSpace(userID) == "" {
		return nil
	}
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	_, err = database.UsersCollection.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{
		"$inc": bson.M{"storageUsed": size},
	})
	return err
}

func userIDFromObjectKey(objectKey string) string {
	key := strings.TrimLeft(strings.ReplaceAll(objectKey, "\\", "/"), "/")
	if idx := strings.Index(key, "/"); idx > 0 {
		return key[:idx]
	}
	return ""
}

func formatBytes(n int64) string {
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	div, exp := int64(unit), 0
	for v := n / unit; v >= unit; v /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(n)/float64(div), "KMGTPE"[exp])
}

// ValidateFileSize valida tamanho máximo por tipo de arquivo.
func ValidateFileSize(size int64, kind string) error {
	var max int64
	switch kind {
	case "image":
		max = config.GetMaxImageBytes()
	case "document":
		max = config.GetMaxDocumentBytes()
	case "model":
		max = config.GetMaxModelBytes()
	default:
		max = config.GetMaxDocumentBytes()
	}
	if size > max {
		return fmt.Errorf("arquivo muito grande: máximo %s por arquivo", formatBytes(max))
	}
	return nil
}

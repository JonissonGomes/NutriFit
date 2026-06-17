package profile

import (
	"context"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/storage"

	"go.mongodb.org/mongo-driver/bson"
)

// NormalizeMediaURL garante URL absoluta utilizável pelo frontend.
func NormalizeMediaURL(raw string) string {
	return storage.ResolveMediaURL(raw)
}

// EnrichProfileMedia preenche avatar/capa ausentes e normaliza URLs.
func EnrichProfileMedia(ctx context.Context, p *models.PublicProfile) {
	if p == nil {
		return
	}

	p.Avatar = NormalizeMediaURL(p.Avatar)
	p.CoverImage = NormalizeMediaURL(p.CoverImage)

	if p.Avatar != "" && p.CoverImage != "" {
		return
	}

	var user models.User
	if err := database.UsersCollection.FindOne(ctx, bson.M{"_id": p.UserID}).Decode(&user); err != nil {
		return
	}

	userAvatar := NormalizeMediaURL(user.Avatar)
	if p.Avatar == "" && userAvatar != "" {
		p.Avatar = userAvatar
	}
	if p.CoverImage == "" && p.Avatar != "" {
		p.CoverImage = p.Avatar
	}
}

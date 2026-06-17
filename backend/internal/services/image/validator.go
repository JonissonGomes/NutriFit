package image

import (
	"errors"

	"nufit/backend/internal/config"
)
var (
	ErrImageTooLarge      = errors.New("image size exceeds maximum allowed")
	ErrInvalidFormat      = errors.New("invalid image format")
	ErrUnsupportedFormat  = errors.New("unsupported image format")
	ErrInvalidDimensions  = errors.New("image dimensions are invalid")
)

const (
	MinWidth         = 200
	MinHeight        = 200
	MaxWidth         = 10000
	MaxHeight        = 10000
	DefaultMaxWidth  = 4000
	DefaultMaxHeight = 4000
	DefaultQuality   = 85
)

// MaxImageSizeBytes retorna o limite configurável de upload de imagens.
func MaxImageSizeBytes() int64 {
	return config.GetMaxImageBytes()
}
// ValidateDimensions validates image dimensions
func ValidateDimensions(width, height int) error {
	if width < MinWidth || height < MinHeight {
		return ErrInvalidDimensions
	}
	if width > MaxWidth || height > MaxHeight {
		return ErrInvalidDimensions
	}
	return nil
}




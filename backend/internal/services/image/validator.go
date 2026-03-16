package image

import "errors"

var (
	ErrImageTooLarge      = errors.New("image size exceeds maximum allowed")
	ErrInvalidFormat      = errors.New("invalid image format")
	ErrUnsupportedFormat  = errors.New("unsupported image format")
	ErrInvalidDimensions  = errors.New("image dimensions are invalid")
)

const (
	MaxImageSize      = 50 * 1024 * 1024 // 50MB
	MinWidth          = 200
	MinHeight         = 200
	MaxWidth          = 10000
	MaxHeight         = 10000
	DefaultMaxWidth   = 4000
	DefaultMaxHeight  = 4000
	DefaultQuality    = 85
)

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




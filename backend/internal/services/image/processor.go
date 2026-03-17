package image

import (
	"bytes"
	"image"
	"image/jpeg"
	_ "image/png" // Register PNG decoder
	"io"

	"github.com/disintegration/imaging"
)

// ProcessImage processes and compresses an image
func ProcessImage(inputData []byte, maxWidth, maxHeight int, quality int) ([]byte, error) {
	img, format, err := image.Decode(bytes.NewReader(inputData))
	if err != nil {
		return nil, err
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Resize if necessary
	if width > maxWidth || height > maxHeight {
		img = imaging.Fit(img, maxWidth, maxHeight, imaging.Lanczos)
	}

	// Encode to JPEG with quality
	var buf bytes.Buffer
	if format == "png" {
		// Convert PNG to JPEG
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	} else {
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	}

	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// GetImageDimensions returns width and height of an image
func GetImageDimensions(inputData []byte) (int, int, error) {
	img, _, err := image.Decode(bytes.NewReader(inputData))
	if err != nil {
		return 0, 0, err
	}

	bounds := img.Bounds()
	return bounds.Dx(), bounds.Dy(), nil
}

// ValidateImage validates image format and size
func ValidateImage(inputData []byte, maxSize int64) error {
	// Check size
	if int64(len(inputData)) > maxSize {
		return ErrImageTooLarge
	}

	// Check format
	_, format, err := image.Decode(bytes.NewReader(inputData))
	if err != nil {
		return ErrInvalidFormat
	}

	// Check if format is supported
	supportedFormats := map[string]bool{
		"jpeg": true,
		"jpg":  true,
		"png":  true,
		"webp": true,
	}

	if !supportedFormats[format] {
		return ErrUnsupportedFormat
	}

	return nil
}

// ReadImageFromReader reads image data from io.Reader
func ReadImageFromReader(reader io.Reader, maxSize int64) ([]byte, error) {
	limitedReader := io.LimitReader(reader, maxSize+1)
	data, err := io.ReadAll(limitedReader)
	if err != nil {
		return nil, err
	}

	if int64(len(data)) > maxSize {
		return nil, ErrImageTooLarge
	}

	return data, nil
}


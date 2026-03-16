package image

import (
	"bytes"
	"image"
	"image/jpeg"
	_ "image/png" // Register PNG decoder

	"github.com/disintegration/imaging"
)

// CompressImage compresses an image with specified quality
func CompressImage(inputData []byte, quality int) ([]byte, error) {
	img, format, err := image.Decode(bytes.NewReader(inputData))
	if err != nil {
		return nil, err
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Resize if larger than default max
	if width > DefaultMaxWidth || height > DefaultMaxHeight {
		img = imaging.Fit(img, DefaultMaxWidth, DefaultMaxHeight, imaging.Lanczos)
	}

	// Encode to JPEG
	var buf bytes.Buffer
	if format == "png" {
		// Convert PNG to JPEG for better compression
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	} else {
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	}

	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}


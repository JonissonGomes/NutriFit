package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MediaType string

const (
	MediaTypeImage MediaType = "IMAGE"
	MediaTypeVideo MediaType = "VIDEO"
)

type MediaStatus string

const (
	MediaStatusUploading  MediaStatus = "uploading"
	MediaStatusProcessing MediaStatus = "processing"
	MediaStatusReady      MediaStatus = "ready"
	MediaStatusFailed     MediaStatus = "failed"
)

type ImageURLs struct {
	Original   string `bson:"original" json:"original"`
	Compressed string `bson:"compressed" json:"compressed"`
	Thumbnail  string `bson:"thumbnail" json:"thumbnail"`
	Medium     string `bson:"medium" json:"medium"`
}

type ImageSize struct {
	Original   int64 `bson:"original" json:"original"`
	Compressed int64 `bson:"compressed" json:"compressed"`
}

type ImageDimensions struct {
	Width  int `bson:"width" json:"width"`
	Height int `bson:"height" json:"height"`
}

type CompressionMetadata struct {
	Quality int    `bson:"quality" json:"quality"`
	Format  string `bson:"format" json:"format"` // auto, jpg, webp
}

type ImageMetadata struct {
	EXIF        map[string]interface{} `bson:"exif,omitempty" json:"exif,omitempty"`
	Compression *CompressionMetadata    `bson:"compression,omitempty" json:"compression,omitempty"`
}

type Image struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProjectID    primitive.ObjectID `bson:"projectId" json:"projectId"`
	UserID       primitive.ObjectID `bson:"userId" json:"userId"`
	CloudinaryID string             `bson:"cloudinaryId" json:"cloudinaryId"`
	PublicID     string             `bson:"publicId" json:"publicId"`
	URLs         *ImageURLs          `bson:"urls" json:"urls"`
	Filename     string             `bson:"filename" json:"filename"`
	MimeType     string             `bson:"mimeType" json:"mimeType"`
	Size         *ImageSize         `bson:"size" json:"size"`
	Dimensions   *ImageDimensions   `bson:"dimensions" json:"dimensions"`
	Caption      string             `bson:"caption,omitempty" json:"caption,omitempty"`
	Position     int                `bson:"position" json:"position"`
	Status       MediaStatus        `bson:"status" json:"status"`
	Metadata     *ImageMetadata     `bson:"metadata,omitempty" json:"metadata,omitempty"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}




package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// TIPOS E CONSTANTES
// ============================================

// ModelFileStatus define o status de processamento do arquivo 3D
type ModelFileStatus string

const (
	ModelFileStatusPending    ModelFileStatus = "pending"     // Aguardando processamento
	ModelFileStatusProcessing ModelFileStatus = "processing"  // Em processamento
	ModelFileStatusReady      ModelFileStatus = "ready"       // Pronto para visualização
	ModelFileStatusFailed     ModelFileStatus = "failed"      // Falha no processamento
)

// ModelFileFormat define os formatos de arquivo suportados
type ModelFileFormat string

const (
	ModelFormatOBJ   ModelFileFormat = "obj"
	ModelFormatFBX   ModelFileFormat = "fbx"
	ModelFormatGLTF  ModelFileFormat = "gltf"
	ModelFormatGLB   ModelFileFormat = "glb"
	ModelFormat3DS   ModelFileFormat = "3ds"
	ModelFormatSTL   ModelFileFormat = "stl"
	ModelFormatPLY   ModelFileFormat = "ply"
	ModelFormatDAE   ModelFileFormat = "dae"   // Collada
	ModelFormatDWG   ModelFileFormat = "dwg"   // AutoCAD
	ModelFormatDXF   ModelFileFormat = "dxf"   // AutoCAD Exchange
	ModelFormatSKP   ModelFileFormat = "skp"   // SketchUp
	ModelFormatRVT   ModelFileFormat = "rvt"   // Revit
	ModelFormatIFC   ModelFileFormat = "ifc"   // IFC (Building)
	ModelFormat3DM   ModelFileFormat = "3dm"   // Rhino
)

// ============================================
// ESTRUTURAS DE DADOS
// ============================================

// ModelFile representa um arquivo 3D/CAD
type ModelFile struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID          primitive.ObjectID `bson:"userId" json:"userId"`
	ProjectID       *primitive.ObjectID `bson:"projectId,omitempty" json:"projectId,omitempty"`
	
	// Informações do arquivo original
	OriginalName    string          `bson:"originalName" json:"originalName"`
	OriginalFormat  ModelFileFormat `bson:"originalFormat" json:"originalFormat"`
	OriginalURL     string          `bson:"originalUrl" json:"originalUrl"`
	OriginalSize    int64           `bson:"originalSize" json:"originalSize"`       // em bytes
	
	// Arquivo convertido para web (GLB/GLTF)
	WebFormat       ModelFileFormat `bson:"webFormat,omitempty" json:"webFormat,omitempty"`
	WebURL          string          `bson:"webUrl,omitempty" json:"webUrl,omitempty"`
	WebSize         int64           `bson:"webSize,omitempty" json:"webSize,omitempty"`
	
	// Previews/Thumbnails
	Previews        []ModelPreview  `bson:"previews,omitempty" json:"previews,omitempty"`
	ThumbnailURL    string          `bson:"thumbnailUrl,omitempty" json:"thumbnailUrl,omitempty"`
	
	// Metadados do modelo
	Title           string          `bson:"title" json:"title"`
	Description     string          `bson:"description,omitempty" json:"description,omitempty"`
	Tags            []string        `bson:"tags,omitempty" json:"tags,omitempty"`
	Category        string          `bson:"category,omitempty" json:"category,omitempty"`
	
	// Propriedades do modelo
	VertexCount     int             `bson:"vertexCount,omitempty" json:"vertexCount,omitempty"`
	FaceCount       int             `bson:"faceCount,omitempty" json:"faceCount,omitempty"`
	MaterialCount   int             `bson:"materialCount,omitempty" json:"materialCount,omitempty"`
	TextureCount    int             `bson:"textureCount,omitempty" json:"textureCount,omitempty"`
	HasAnimations   bool            `bson:"hasAnimations" json:"hasAnimations"`
	BoundingBox     *BoundingBox    `bson:"boundingBox,omitempty" json:"boundingBox,omitempty"`
	
	// Status e processamento
	Status          ModelFileStatus `bson:"status" json:"status"`
	ProcessingError string          `bson:"processingError,omitempty" json:"processingError,omitempty"`
	ProcessedAt     *time.Time      `bson:"processedAt,omitempty" json:"processedAt,omitempty"`
	
	// Configurações de visualização
	DefaultCameraPosition *Vector3D `bson:"defaultCameraPosition,omitempty" json:"defaultCameraPosition,omitempty"`
	DefaultLighting       string    `bson:"defaultLighting,omitempty" json:"defaultLighting,omitempty"` // studio, outdoor, neutral
	BackgroundColor       string    `bson:"backgroundColor,omitempty" json:"backgroundColor,omitempty"`
	
	// Controle de acesso
	IsPublic        bool            `bson:"isPublic" json:"isPublic"`
	Downloads       int             `bson:"downloads" json:"downloads"`
	Views           int             `bson:"views" json:"views"`
	
	// Timestamps
	CreatedAt       time.Time       `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time       `bson:"updatedAt" json:"updatedAt"`
}

// ModelPreview representa uma imagem de preview do modelo 3D
type ModelPreview struct {
	Angle       string `bson:"angle" json:"angle"`   // front, back, left, right, top, perspective
	URL         string `bson:"url" json:"url"`
	Width       int    `bson:"width" json:"width"`
	Height      int    `bson:"height" json:"height"`
}

// BoundingBox representa a caixa delimitadora do modelo
type BoundingBox struct {
	Min Vector3D `bson:"min" json:"min"`
	Max Vector3D `bson:"max" json:"max"`
}

// Vector3D representa um vetor 3D
type Vector3D struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
	Z float64 `bson:"z" json:"z"`
}

// ============================================
// FILTROS E REQUESTS
// ============================================

// ModelFileFilters define os filtros para listar arquivos 3D
type ModelFileFilters struct {
	UserID     string          `json:"userId,omitempty"`
	ProjectID  string          `json:"projectId,omitempty"`
	Format     ModelFileFormat `json:"format,omitempty"`
	Status     ModelFileStatus `json:"status,omitempty"`
	Category   string          `json:"category,omitempty"`
	IsPublic   *bool           `json:"isPublic,omitempty"`
	Search     string          `json:"search,omitempty"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
}

// UploadModelFileRequest representa a requisição de upload de arquivo 3D
type UploadModelFileRequest struct {
	ProjectID   string   `json:"projectId,omitempty"`
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Category    string   `json:"category,omitempty"`
	IsPublic    bool     `json:"isPublic"`
}

// UpdateModelFileRequest representa a requisição de atualização de arquivo 3D
type UpdateModelFileRequest struct {
	Title       string   `json:"title,omitempty"`
	Description string   `json:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Category    string   `json:"category,omitempty"`
	IsPublic    *bool    `json:"isPublic,omitempty"`
	DefaultCameraPosition *Vector3D `json:"defaultCameraPosition,omitempty"`
	DefaultLighting       string    `json:"defaultLighting,omitempty"`
	BackgroundColor       string    `json:"backgroundColor,omitempty"`
}

// ModelFileListResponse representa a resposta de listagem de arquivos 3D
type ModelFileListResponse struct {
	Data       []ModelFile `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"totalPages"`
}

// ============================================
// FORMATOS SUPORTADOS
// ============================================

// SupportedModelFormats retorna a lista de formatos suportados
func SupportedModelFormats() []ModelFileFormat {
	return []ModelFileFormat{
		ModelFormatOBJ,
		ModelFormatFBX,
		ModelFormatGLTF,
		ModelFormatGLB,
		ModelFormat3DS,
		ModelFormatSTL,
		ModelFormatPLY,
		ModelFormatDAE,
		ModelFormatDWG,
		ModelFormatDXF,
		ModelFormatSKP,
		ModelFormatRVT,
		ModelFormatIFC,
		ModelFormat3DM,
	}
}

// IsValidModelFormat verifica se o formato é válido
func IsValidModelFormat(format string) bool {
	for _, f := range SupportedModelFormats() {
		if string(f) == format {
			return true
		}
	}
	return false
}

// ============================================
// CATEGORIAS DE MODELOS 3D
// ============================================

// ModelCategories retorna as categorias disponíveis para modelos 3D
func ModelCategories() []string {
	return []string{
		"mobiliario",
		"iluminacao",
		"decoracao",
		"estrutural",
		"paisagismo",
		"hidraulica",
		"eletrica",
		"climatizacao",
		"fachada",
		"interiores",
		"maquete",
		"outro",
	}
}




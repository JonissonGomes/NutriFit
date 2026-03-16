package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BoostLevel string

const (
	BoostLevelBasic    BoostLevel = "basic"
	BoostLevelPremium  BoostLevel = "premium"
	BoostLevelHighlight BoostLevel = "highlight"
)

type Boost struct {
	Active     bool      `bson:"active" json:"active"`
	Level      BoostLevel `bson:"level,omitempty" json:"level,omitempty"`
	StartDate  time.Time `bson:"startDate,omitempty" json:"startDate,omitempty"`
	EndDate    time.Time `bson:"endDate,omitempty" json:"endDate,omitempty"`
	Priority   int       `bson:"priority" json:"priority"` // 1-10
	Category   string    `bson:"category,omitempty" json:"category,omitempty"`
	Location   *BoostLocation `bson:"location,omitempty" json:"location,omitempty"`
}

type BoostLocation struct {
	Enabled bool    `bson:"enabled" json:"enabled"`
	Radius  float64 `bson:"radius" json:"radius"` // km
}

type ProfileLocation struct {
	Address      *Address     `bson:"address" json:"address"`
	Coordinates  *Coordinates `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
	ServiceRadius float64     `bson:"serviceRadius" json:"serviceRadius"` // km
	ServiceAreas []string     `bson:"serviceAreas" json:"serviceAreas"` // Cidades atendidas
}

type SocialLinks struct {
	Instagram *SocialLink `bson:"instagram,omitempty" json:"instagram,omitempty"`
	Facebook  *SocialLink `bson:"facebook,omitempty" json:"facebook,omitempty"`
}

type SocialLink struct {
	Username string `bson:"username" json:"username"`
	URL      string `bson:"url" json:"url"`
}

type Verification struct {
	Verified   bool                 `bson:"verified" json:"verified"`
	CAUVerified bool                `bson:"cauVerified" json:"cauVerified"`
	CAUNumber  string               `bson:"cauNumber,omitempty" json:"cauNumber,omitempty"`
	Documents  []VerificationDocument `bson:"documents,omitempty" json:"documents,omitempty"`
	VerifiedAt *time.Time           `bson:"verifiedAt,omitempty" json:"verifiedAt,omitempty"`
	VerifiedBy *primitive.ObjectID  `bson:"verifiedBy,omitempty" json:"verifiedBy,omitempty"`
}

type VerificationDocument struct {
	Type       string             `bson:"type" json:"type"` // cau, identity
	URL        string             `bson:"url" json:"url"`
	VerifiedAt time.Time          `bson:"verifiedAt" json:"verifiedAt"`
	VerifiedBy primitive.ObjectID `bson:"verifiedBy" json:"verifiedBy"`
}

type Ratings struct {
	Average    float64            `bson:"average" json:"average"`
	Total      int                `bson:"total" json:"total"`
	Distribution map[string]int   `bson:"distribution" json:"distribution"` // "5": 100, "4": 20, etc
}

// ProfileLayout define o layout do perfil do arquiteto
type ProfileLayoutType string

const (
	LayoutGrid       ProfileLayoutType = "grid"       // Grade padrão 3 colunas
	LayoutMasonry    ProfileLayoutType = "masonry"    // Masonry layout (Pinterest style)
	LayoutCarousel   ProfileLayoutType = "carousel"   // Carrossel de projetos
	LayoutFeatured   ProfileLayoutType = "featured"   // Um projeto destacado + grid
	LayoutMinimalist ProfileLayoutType = "minimalist" // Layout minimalista
	LayoutPortfolio  ProfileLayoutType = "portfolio"  // Layout tipo portfólio
)

// ProfileCustomization configurações de customização do perfil
type ProfileCustomization struct {
	Layout           ProfileLayoutType `bson:"layout" json:"layout"`
	GridColumns      int               `bson:"gridColumns" json:"gridColumns"`       // 2, 3, 4
	ShowStats        bool              `bson:"showStats" json:"showStats"`           // Mostrar estatísticas
	ShowServices     bool              `bson:"showServices" json:"showServices"`     // Mostrar serviços
	ShowReviews      bool              `bson:"showReviews" json:"showReviews"`       // Mostrar avaliações
	ShowContact      bool              `bson:"showContact" json:"showContact"`       // Mostrar informações de contato
	Show3DModels     bool              `bson:"show3DModels" json:"show3DModels"`     // Mostrar projetos 3D
	PrimaryColor     string            `bson:"primaryColor,omitempty" json:"primaryColor,omitempty"`     // Cor primária customizada
	BackgroundStyle  string            `bson:"backgroundStyle,omitempty" json:"backgroundStyle,omitempty"` // light, dark, gradient
	HeroStyle        string            `bson:"heroStyle,omitempty" json:"heroStyle,omitempty"`       // full, compact, minimal
	ProjectCardStyle string            `bson:"projectCardStyle,omitempty" json:"projectCardStyle,omitempty"` // simple, detailed, overlay
}

type PublicProfile struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        primitive.ObjectID `bson:"userId" json:"userId"`
	Username      string             `bson:"username" json:"username"`
	DisplayName   string             `bson:"displayName" json:"displayName"`
	Bio           string             `bson:"bio,omitempty" json:"bio,omitempty"`
	Avatar        string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	CoverImage    string             `bson:"coverImage,omitempty" json:"coverImage,omitempty"`
	Location      *ProfileLocation   `bson:"location,omitempty" json:"location,omitempty"`
	Specialty     string             `bson:"specialty,omitempty" json:"specialty,omitempty"`
	Experience    string             `bson:"experience,omitempty" json:"experience,omitempty"`
	CAU           string             `bson:"cau,omitempty" json:"cau,omitempty"`
	Specialties   []string           `bson:"specialties,omitempty" json:"specialties,omitempty"`
	Boost         *Boost             `bson:"boost,omitempty" json:"boost,omitempty"`
	Education     string             `bson:"education,omitempty" json:"education,omitempty"`
	Awards        string             `bson:"awards,omitempty" json:"awards,omitempty"`
	Website       string             `bson:"website,omitempty" json:"website,omitempty"`
	Email         string             `bson:"email,omitempty" json:"email,omitempty"`
	Phone         string             `bson:"phone,omitempty" json:"phone,omitempty"`
	Social        *SocialLinks       `bson:"social,omitempty" json:"social,omitempty"`
	Verification   *Verification         `bson:"verification,omitempty" json:"verification,omitempty"`
	Ratings        *Ratings              `bson:"ratings,omitempty" json:"ratings,omitempty"`
	Customization  *ProfileCustomization `bson:"customization,omitempty" json:"customization,omitempty"`
	ProjectsCount  int                   `bson:"projectsCount" json:"projectsCount"`
	ReviewsCount   int                   `bson:"reviewsCount" json:"reviewsCount"`
	ViewsCount     int                   `bson:"viewsCount" json:"viewsCount"`
	CreatedAt      time.Time             `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time             `bson:"updatedAt" json:"updatedAt"`
}


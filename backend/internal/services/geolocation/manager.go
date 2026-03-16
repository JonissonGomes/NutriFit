package geolocation

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============================================
// ERROS
// ============================================

var (
	ErrGeolocationFailed = errors.New("falha ao obter geolocalização")
	ErrInvalidCoordinates = errors.New("coordenadas inválidas")
)

// ============================================
// TIPOS
// ============================================

// GeoLocation representa uma localização geográfica
type GeoLocation struct {
	Latitude  float64 `json:"latitude" bson:"latitude"`
	Longitude float64 `json:"longitude" bson:"longitude"`
	City      string  `json:"city,omitempty" bson:"city,omitempty"`
	State     string  `json:"state,omitempty" bson:"state,omitempty"`
	Country   string  `json:"country,omitempty" bson:"country,omitempty"`
	Address   string  `json:"address,omitempty" bson:"address,omitempty"`
	Source    string  `json:"source,omitempty" bson:"source,omitempty"` // browser, ip, manual
}

// GeoPoint representa um ponto GeoJSON para MongoDB 2dsphere
type GeoPoint struct {
	Type        string    `json:"type" bson:"type"`
	Coordinates []float64 `json:"coordinates" bson:"coordinates"` // [longitude, latitude]
}

// ProximitySearchRequest representa uma busca por proximidade
type ProximitySearchRequest struct {
	Latitude    float64  `json:"latitude"`
	Longitude   float64  `json:"longitude"`
	RadiusKm    float64  `json:"radiusKm"`
	Categories  []string `json:"categories,omitempty"`
	MinRating   float64  `json:"minRating,omitempty"`
	Verified    *bool    `json:"verified,omitempty"`
	Page        int      `json:"page"`
	Limit       int      `json:"limit"`
}

// ProximityResult representa um resultado de busca por proximidade
type ProximityResult struct {
	Profile    models.PublicProfile `json:"profile"`
	DistanceKm float64              `json:"distanceKm"`
}

// ProximitySearchResponse representa a resposta de busca por proximidade
type ProximitySearchResponse struct {
	Results    []ProximityResult `json:"results"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	RadiusKm   float64           `json:"radiusKm"`
	Center     GeoLocation       `json:"center"`
}

// IPGeoResponse representa a resposta de geolocalização por IP
type IPGeoResponse struct {
	IP        string  `json:"ip"`
	City      string  `json:"city"`
	Region    string  `json:"region"`
	Country   string  `json:"country"`
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lon"`
	Timezone  string  `json:"timezone"`
}

// ============================================
// FUNÇÕES DE GEOLOCALIZAÇÃO
// ============================================

// NewGeoPoint cria um GeoPoint para MongoDB
func NewGeoPoint(latitude, longitude float64) *GeoPoint {
	return &GeoPoint{
		Type:        "Point",
		Coordinates: []float64{longitude, latitude}, // GeoJSON usa [lng, lat]
	}
}

// GetLocationFromIP obtém geolocalização a partir de um endereço IP
func GetLocationFromIP(ip string) (*GeoLocation, error) {
	// Usar serviço gratuito ip-api.com
	url := fmt.Sprintf("http://ip-api.com/json/%s", ip)
	
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, ErrGeolocationFailed
	}
	defer resp.Body.Close()

	var result IPGeoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, ErrGeolocationFailed
	}

	return &GeoLocation{
		Latitude:  result.Latitude,
		Longitude: result.Longitude,
		City:      result.City,
		State:     result.Region,
		Country:   result.Country,
		Source:    "ip",
	}, nil
}

// ValidateCoordinates valida coordenadas geográficas
func ValidateCoordinates(latitude, longitude float64) error {
	if latitude < -90 || latitude > 90 {
		return ErrInvalidCoordinates
	}
	if longitude < -180 || longitude > 180 {
		return ErrInvalidCoordinates
	}
	return nil
}

// CalculateDistance calcula a distância entre dois pontos usando a fórmula de Haversine
func CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

// ============================================
// BUSCA POR PROXIMIDADE
// ============================================

// SearchNearbyProfiles busca perfis próximos a uma localização
func SearchNearbyProfiles(ctx context.Context, req ProximitySearchRequest) (*ProximitySearchResponse, error) {
	if err := ValidateCoordinates(req.Latitude, req.Longitude); err != nil {
		return nil, err
	}

	// Converter raio de km para metros
	radiusMeters := req.RadiusKm * 1000

	// Construir filtro com $geoNear
	filter := bson.M{
		"location.coordinates": bson.M{
			"$nearSphere": bson.M{
				"$geometry": bson.M{
					"type":        "Point",
					"coordinates": []float64{req.Longitude, req.Latitude},
				},
				"$maxDistance": radiusMeters,
			},
		},
	}

	// Filtros adicionais
	if len(req.Categories) > 0 {
		filter["specialties"] = bson.M{"$in": req.Categories}
	}

	if req.MinRating > 0 {
		filter["ratings.average"] = bson.M{"$gte": req.MinRating}
	}

	if req.Verified != nil && *req.Verified {
		filter["verification.verified"] = true
	}

	// Paginação
	page := req.Page
	if page < 1 {
		page = 1
	}
	limit := req.Limit
	if limit < 1 || limit > 50 {
		limit = 20
	}
	skip := (page - 1) * limit

	// Contagem total
	total, err := database.PublicProfilesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	// Buscar perfis
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := database.PublicProfilesCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []models.PublicProfile
	if err := cursor.All(ctx, &profiles); err != nil {
		return nil, err
	}

	// Calcular distância para cada perfil
	results := make([]ProximityResult, 0, len(profiles))
	for _, profile := range profiles {
		distance := 0.0
		if profile.Location != nil && profile.Location.Coordinates != nil {
			distance = CalculateDistance(
				req.Latitude, req.Longitude,
				profile.Location.Coordinates.Latitude, profile.Location.Coordinates.Longitude,
			)
		}
		results = append(results, ProximityResult{
			Profile:    profile,
			DistanceKm: math.Round(distance*10) / 10, // Arredondar para 1 casa decimal
		})
	}

	return &ProximitySearchResponse{
		Results:  results,
		Total:    total,
		Page:     page,
		Limit:    limit,
		RadiusKm: req.RadiusKm,
		Center: GeoLocation{
			Latitude:  req.Latitude,
			Longitude: req.Longitude,
		},
	}, nil
}

// SearchByCity busca perfis por cidade
func SearchByCity(ctx context.Context, city, state string, page, limit int) (*ProximitySearchResponse, error) {
	filter := bson.M{}

	if city != "" {
		filter["location.address.city"] = bson.M{"$regex": city, "$options": "i"}
	}
	if state != "" {
		filter["location.address.state"] = bson.M{"$regex": state, "$options": "i"}
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}
	skip := (page - 1) * limit

	total, err := database.PublicProfilesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "ratings.average", Value: -1}}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := database.PublicProfilesCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []models.PublicProfile
	if err := cursor.All(ctx, &profiles); err != nil {
		return nil, err
	}

	results := make([]ProximityResult, 0, len(profiles))
	for _, profile := range profiles {
		results = append(results, ProximityResult{
			Profile:    profile,
			DistanceKm: 0,
		})
	}

	return &ProximitySearchResponse{
		Results: results,
		Total:   total,
		Page:    page,
		Limit:   limit,
	}, nil
}

// ============================================
// ATUALIZAÇÃO DE LOCALIZAÇÃO
// ============================================

// UpdateUserLocation atualiza a localização de um usuário
func UpdateUserLocation(ctx context.Context, userID string, location GeoLocation) error {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	if err := ValidateCoordinates(location.Latitude, location.Longitude); err != nil {
		return err
	}

	geoPoint := NewGeoPoint(location.Latitude, location.Longitude)

	update := bson.M{
		"$set": bson.M{
			"location.coordinates": bson.M{
				"latitude":  location.Latitude,
				"longitude": location.Longitude,
			},
			"location.geoPoint": geoPoint,
			"location.address": bson.M{
				"city":    location.City,
				"state":   location.State,
				"country": location.Country,
			},
			"updatedAt": time.Now(),
		},
	}

	_, err = database.PublicProfilesCollection.UpdateOne(ctx, bson.M{"userId": userOID}, update)
	return err
}

// ============================================
// CIDADES E ESTADOS DISPONÍVEIS
// ============================================

// GetAvailableCities retorna as cidades com arquitetos cadastrados
func GetAvailableCities(ctx context.Context, state string) ([]string, error) {
	filter := bson.M{}
	if state != "" {
		filter["location.address.state"] = state
	}

	results, err := database.PublicProfilesCollection.Distinct(ctx, "location.address.city", filter)
	if err != nil {
		return nil, err
	}

	cities := make([]string, 0, len(results))
	for _, r := range results {
		if city, ok := r.(string); ok && city != "" {
			cities = append(cities, city)
		}
	}

	return cities, nil
}

// GetAvailableStates retorna os estados com arquitetos cadastrados
func GetAvailableStates(ctx context.Context) ([]string, error) {
	results, err := database.PublicProfilesCollection.Distinct(ctx, "location.address.state", bson.M{})
	if err != nil {
		return nil, err
	}

	states := make([]string, 0, len(results))
	for _, r := range results {
		if state, ok := r.(string); ok && state != "" {
			states = append(states, state)
		}
	}

	return states, nil
}




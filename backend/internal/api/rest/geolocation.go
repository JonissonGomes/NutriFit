package rest

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"arck-design/backend/internal/services/geolocation"

	"github.com/gin-gonic/gin"
)

// ============================================
// HANDLERS DE GEOLOCALIZAÇÃO
// ============================================

// searchNearby busca nutricionistas próximos a uma localização
func searchNearby(c *gin.Context) {
	latStr := c.Query("lat")
	lngStr := c.Query("lng")
	radiusStr := c.DefaultQuery("radius", "50")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Latitude inválida"})
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Longitude inválida"})
		return
	}

	radius, _ := strconv.ParseFloat(radiusStr, 64)
	if radius <= 0 || radius > 500 {
		radius = 50
	}

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	// Filtros opcionais
	categories := []string{}
	if categoriesStr := c.Query("categories"); categoriesStr != "" {
		categories = strings.Split(categoriesStr, ",")
	}

	minRating, _ := strconv.ParseFloat(c.Query("minRating"), 64)

	var verified *bool
	if verifiedStr := c.Query("verified"); verifiedStr != "" {
		v := verifiedStr == "true"
		verified = &v
	}

	req := geolocation.ProximitySearchRequest{
		Latitude:   lat,
		Longitude:  lng,
		RadiusKm:   radius,
		Categories: categories,
		MinRating:  minRating,
		Verified:   verified,
		Page:       page,
		Limit:      limit,
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	result, err := geolocation.SearchNearbyProfiles(ctx, req)
	if err != nil {
		if err == geolocation.ErrInvalidCoordinates {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coordenadas inválidas"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar nutricionistas próximos"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// searchByLocation busca nutricionistas por cidade/estado
func searchByLocation(c *gin.Context) {
	city := c.Query("city")
	state := c.Query("state")

	if city == "" && state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Informe pelo menos cidade ou estado"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	result, err := geolocation.SearchByCity(ctx, city, state, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar nutricionistas"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// getLocationFromIP obtém localização a partir do IP
func getLocationFromIP(c *gin.Context) {
	ip := c.ClientIP()
	
	// Se for localhost, usar IP de exemplo
	if ip == "::1" || ip == "127.0.0.1" {
		c.JSON(http.StatusOK, gin.H{
			"latitude":  -23.5505,
			"longitude": -46.6333,
			"city":      "São Paulo",
			"state":     "SP",
			"country":   "Brazil",
			"source":    "default",
		})
		return
	}

	location, err := geolocation.GetLocationFromIP(ip)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível determinar sua localização"})
		return
	}

	c.JSON(http.StatusOK, location)
}

// updateMyLocation atualiza a localização do usuário autenticado
func updateMyLocation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	var req struct {
		Latitude  float64 `json:"latitude" binding:"required"`
		Longitude float64 `json:"longitude" binding:"required"`
		City      string  `json:"city"`
		State     string  `json:"state"`
		Country   string  `json:"country"`
		Address   string  `json:"address"`
		Source    string  `json:"source"` // browser, manual
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	location := geolocation.GeoLocation{
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		City:      req.City,
		State:     req.State,
		Country:   req.Country,
		Address:   req.Address,
		Source:    req.Source,
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err := geolocation.UpdateUserLocation(ctx, userID.(string), location)
	if err != nil {
		if err == geolocation.ErrInvalidCoordinates {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coordenadas inválidas"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar localização"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "location": location})
}

// getAvailableCities retorna cidades com nutricionistas
func getAvailableCities(c *gin.Context) {
	state := c.Query("state")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	cities, err := geolocation.GetAvailableCities(ctx, state)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar cidades"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cities": cities})
}

// getAvailableStates retorna estados com nutricionistas
func getAvailableStates(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	states, err := geolocation.GetAvailableStates(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estados"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"states": states})
}

// calculateDistance calcula a distância entre dois pontos
func calculateDistance(c *gin.Context) {
	lat1, _ := strconv.ParseFloat(c.Query("lat1"), 64)
	lng1, _ := strconv.ParseFloat(c.Query("lng1"), 64)
	lat2, _ := strconv.ParseFloat(c.Query("lat2"), 64)
	lng2, _ := strconv.ParseFloat(c.Query("lng2"), 64)

	if err := geolocation.ValidateCoordinates(lat1, lng1); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coordenadas do ponto 1 inválidas"})
		return
	}

	if err := geolocation.ValidateCoordinates(lat2, lng2); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coordenadas do ponto 2 inválidas"})
		return
	}

	distance := geolocation.CalculateDistance(lat1, lng1, lat2, lng2)

	c.JSON(http.StatusOK, gin.H{
		"distanceKm": distance,
		"from": gin.H{
			"latitude":  lat1,
			"longitude": lng1,
		},
		"to": gin.H{
			"latitude":  lat2,
			"longitude": lng2,
		},
	})
}




package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port string
	Env  string

	// MongoDB
	MongoDBURI string
	MongoDBDB  string

	// JWT
	JWTSecret       string
	JWTAccessExpiry time.Duration
	JWTRefreshExpiry time.Duration

	// OAuth Google (não utilizado; mantido para compatibilidade com código legado)
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string

	// Cloudinary
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string
	CloudinaryBaseFolder string

	// Storage limit (bytes) for new users / free plan
	StorageLimitFree int64

	// CORS
	CORSAllowedOrigins []string

	// Redis
	RedisURL string

	// Rate Limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration

	// IP Geolocation
	IPGeolocationAPIKey    string
	IPGeolocationProvider string
	IPGeolocationCacheTTL time.Duration

	// Boost System
	BoostBasicDailyPrice    float64
	BoostBasicWeeklyPrice   float64
	BoostBasicMonthlyPrice  float64
	BoostPremiumDailyPrice   float64
	BoostPremiumWeeklyPrice  float64
	BoostPremiumMonthlyPrice float64
	BoostHighlightDailyPrice float64
	BoostHighlightWeeklyPrice float64
	BoostHighlightMonthlyPrice float64

	// AI / Gemini
	GeminiAPIKey string
	// Modelo global padrão do Gemini (fallback para texto/vision).
	GeminiModel string
	// Modelo do Gemini para geração de texto (ex.: gemini-1.5-pro).
	GeminiTextModel string
	// Modelo do Gemini Vision (ex.: gemini-1.5-flash).
	GeminiVisionModel string

	// E-mail (SMTP Gmail)
	EmailUser       string
	EmailPass       string
	GmailFromName   string
	AppLoginURL     string
	GmailSMTPHost   string
	GmailSMTPPort   int
}

var AppConfig *Config

func LoadConfig() (*Config, error) {
	// Load .env file (ignore error if not found)
	_ = godotenv.Load()

	cfg := &Config{
		Port:  getEnv("PORT", "8080"),
		Env:   getEnv("ENV", "development"),

		MongoDBURI: getEnv("MONGODB_URI", ""),
		MongoDBDB:  getEnv("MONGODB_DB", "nufit"),

		JWTSecret:        getEnv("JWT_SECRET", "change-me-in-production"),
		JWTAccessExpiry:  parseDuration(getEnv("JWT_ACCESS_EXPIRY", "1h")),
		JWTRefreshExpiry: parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURI:  getEnv("GOOGLE_REDIRECT_URI", ""),

		CloudinaryCloudName:   getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:     getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret:   getEnv("CLOUDINARY_API_SECRET", ""),
		CloudinaryBaseFolder:  getEnv("CLOUDINARY_BASE_FOLDER", "nufit"),

		StorageLimitFree: parseInt64(getEnv("STORAGE_LIMIT_FREE", "5368709120")),

		CORSAllowedOrigins: parseStringSlice(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")),

		RedisURL: getEnv("REDIS_URL", ""),

		RateLimitRequests: parseInt(getEnv("RATE_LIMIT_REQUESTS", "100")),
		RateLimitWindow:   parseDuration(getEnv("RATE_LIMIT_WINDOW", "1m")),

		IPGeolocationAPIKey:    getEnv("IP_GEOLOCATION_API_KEY", ""),
		IPGeolocationProvider:  getEnv("IP_GEOLOCATION_PROVIDER", "ipapi.co"),
		IPGeolocationCacheTTL: parseDuration(getEnv("IP_GEOLOCATION_CACHE_TTL", "24h")),

		BoostBasicDailyPrice:    parseFloat(getEnv("BOOST_BASIC_DAILY_PRICE", "9.90")),
		BoostBasicWeeklyPrice:   parseFloat(getEnv("BOOST_BASIC_WEEKLY_PRICE", "49.90")),
		BoostBasicMonthlyPrice:  parseFloat(getEnv("BOOST_BASIC_MONTHLY_PRICE", "149.90")),
		BoostPremiumDailyPrice:   parseFloat(getEnv("BOOST_PREMIUM_DAILY_PRICE", "19.90")),
		BoostPremiumWeeklyPrice:  parseFloat(getEnv("BOOST_PREMIUM_WEEKLY_PRICE", "99.90")),
		BoostPremiumMonthlyPrice: parseFloat(getEnv("BOOST_PREMIUM_MONTHLY_PRICE", "299.90")),
		BoostHighlightDailyPrice: parseFloat(getEnv("BOOST_HIGHLIGHT_DAILY_PRICE", "39.90")),
		BoostHighlightWeeklyPrice: parseFloat(getEnv("BOOST_HIGHLIGHT_WEEKLY_PRICE", "199.90")),
		BoostHighlightMonthlyPrice: parseFloat(getEnv("BOOST_HIGHLIGHT_MONTHLY_PRICE", "599.90")),

		GeminiAPIKey:     getEnv("GEMINI_API_KEY", ""),
		GeminiModel: getEnv("GEMINI_MODEL", ""),
		// Deixar vazio por padrão para permitir que GEMINI_MODEL seja o fallback global.
		GeminiTextModel: getEnv("GEMINI_TEXT_MODEL", ""),
		GeminiVisionModel: getEnv("GEMINI_VISION_MODEL", ""),

		EmailUser:     getEnv("EMAIL_USER", ""),
		EmailPass:     getEnv("EMAIL_PASS", ""),
		GmailFromName: getEnv("GMAIL_FROM_NAME", "NuFit"),
		AppLoginURL:   getEnv("APP_LOGIN_URL", "http://localhost:5173/login"),
		GmailSMTPHost: getEnv("GMAIL_SMTP_HOST", "smtp.gmail.com"),
		GmailSMTPPort: parseInt(getEnv("GMAIL_SMTP_PORT", "587")),
	}

	AppConfig = cfg
	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func parseInt(s string) int {
	val, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return val
}

func parseInt64(s string) int64 {
	val, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}
	return val
}

func parseFloat(s string) float64 {
	val, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return val
}

func parseDuration(s string) time.Duration {
	duration, err := time.ParseDuration(s)
	if err != nil {
		return time.Hour
	}
	return duration
}

func parseStringSlice(s string) []string {
	if s == "" {
		return []string{}
	}
	// Simple split by comma, can be enhanced
	result := []string{}
	parts := []rune(s)
	current := ""
	for _, r := range parts {
		if r == ',' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(r)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}




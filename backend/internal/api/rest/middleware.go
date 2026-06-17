package rest

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"nufit/backend/internal/services/auth"
)

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Allow specific origins (should come from config)
		allowedOrigins := []string{
			"http://localhost:5173",
			"https://nufit.com.br",
		}

		for _, allowed := range allowedOrigins {
			if origin == allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func securityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Next()
	}
}

type slidingWindowLimiter struct {
	mu   sync.Mutex
	hits map[string][]time.Time
}

func newSlidingWindowLimiter() *slidingWindowLimiter {
	return &slidingWindowLimiter{hits: make(map[string][]time.Time)}
}

func (l *slidingWindowLimiter) allow(key string, maxRequests int, window time.Duration) bool {
	if maxRequests <= 0 {
		return true
	}

	now := time.Now()
	cutoff := now.Add(-window)

	l.mu.Lock()
	defer l.mu.Unlock()

	times := l.hits[key]
	filtered := times[:0]
	for _, t := range times {
		if t.After(cutoff) {
			filtered = append(filtered, t)
		}
	}

	if len(filtered) >= maxRequests {
		l.hits[key] = filtered
		return false
	}

	filtered = append(filtered, now)
	l.hits[key] = filtered
	return true
}

var (
	globalRateLimiter = newSlidingWindowLimiter()
	authRateLimiter   = newSlidingWindowLimiter()
)

func rateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()
		if !globalRateLimiter.allow(key, maxRequests, window) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Muitas requisições. Tente novamente em instantes."})
			c.Abort()
			return
		}
		c.Next()
	}
}

func authRateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP() + ":" + c.FullPath()
		if !authRateLimiter.allow(key, maxRequests, window) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Muitas tentativas. Aguarde um momento e tente novamente."})
			c.Abort()
			return
		}
		c.Next()
	}
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Autenticação necessária"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de autenticação inválido"})
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := auth.ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada. Faça login novamente."})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userID", claims.Subject)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}


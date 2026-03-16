package cache

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"arck-design/backend/internal/config"
	"arck-design/backend/internal/utils"
	"github.com/redis/go-redis/v9"
)

// ============================================
// CLIENTE REDIS
// ============================================

var (
	RedisClient *redis.Client
	enabled     bool
)

// ErrCacheMiss indica que a chave não foi encontrada no cache
var ErrCacheMiss = errors.New("cache miss")

// InitRedis inicializa a conexão com Redis
func InitRedis() error {
	cfg := config.AppConfig
	if cfg.RedisURL == "" {
		utils.Debug("Redis URL não configurada, cache desabilitado")
		enabled = false
		return nil
	}

	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		utils.Error("Erro ao parsear Redis URL: %v", err)
		enabled = false
		return err
	}

	RedisClient = redis.NewClient(opts)

	// Testar conexão
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = RedisClient.Ping(ctx).Result()
	if err != nil {
		utils.Error("Erro ao conectar ao Redis: %v", err)
		enabled = false
		return err
	}

	enabled = true
	utils.Debug("Redis conectado com sucesso")
	return nil
}

// Close fecha a conexão com Redis
func Close() error {
	if RedisClient != nil {
		return RedisClient.Close()
	}
	return nil
}

// IsEnabled retorna se o cache está habilitado
func IsEnabled() bool {
	return enabled
}

// ============================================
// OPERAÇÕES DE CACHE
// ============================================

// Set armazena um valor no cache
func Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if !enabled {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return RedisClient.Set(ctx, key, data, ttl).Err()
}

// Get recupera um valor do cache
func Get(ctx context.Context, key string, dest interface{}) error {
	if !enabled {
		return ErrCacheMiss
	}

	data, err := RedisClient.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return ErrCacheMiss
		}
		return err
	}

	return json.Unmarshal(data, dest)
}

// Delete remove uma chave do cache
func Delete(ctx context.Context, key string) error {
	if !enabled {
		return nil
	}

	return RedisClient.Del(ctx, key).Err()
}

// DeletePattern remove chaves que correspondem a um padrão
func DeletePattern(ctx context.Context, pattern string) error {
	if !enabled {
		return nil
	}

	iter := RedisClient.Scan(ctx, 0, pattern, 100).Iterator()
	for iter.Next(ctx) {
		err := RedisClient.Del(ctx, iter.Val()).Err()
		if err != nil {
			return err
		}
	}
	return iter.Err()
}

// ============================================
// CHAVES DE CACHE
// ============================================

// Prefixos de chaves
const (
	PrefixDashboardStats = "dashboard:stats:"
	PrefixUserProfile    = "user:profile:"
	PrefixProjectStats   = "project:stats:"
	PrefixPublicProfile  = "public:profile:"
)

// TTLs padrão
const (
	TTLShort  = 1 * time.Minute
	TTLMedium = 5 * time.Minute
	TTLLong   = 15 * time.Minute
	TTLHour   = 1 * time.Hour
	TTLDay    = 24 * time.Hour
)

// ============================================
// HELPERS PARA DASHBOARD
// ============================================

// DashboardStatsKey gera chave para stats do dashboard
func DashboardStatsKey(userID string) string {
	return PrefixDashboardStats + userID
}

// GetDashboardStats obtém stats do dashboard do cache
func GetDashboardStats(ctx context.Context, userID string) (map[string]interface{}, error) {
	var stats map[string]interface{}
	err := Get(ctx, DashboardStatsKey(userID), &stats)
	return stats, err
}

// SetDashboardStats armazena stats do dashboard no cache
func SetDashboardStats(ctx context.Context, userID string, stats map[string]interface{}) error {
	return Set(ctx, DashboardStatsKey(userID), stats, TTLMedium)
}

// InvalidateDashboardStats invalida o cache de stats do dashboard
func InvalidateDashboardStats(ctx context.Context, userID string) error {
	return Delete(ctx, DashboardStatsKey(userID))
}

// ============================================
// HELPERS PARA PERFIL PÚBLICO
// ============================================

// PublicProfileKey gera chave para perfil público
func PublicProfileKey(username string) string {
	return PrefixPublicProfile + username
}

// GetPublicProfile obtém perfil público do cache
func GetPublicProfile(ctx context.Context, username string) (interface{}, error) {
	var profile interface{}
	err := Get(ctx, PublicProfileKey(username), &profile)
	return profile, err
}

// SetPublicProfile armazena perfil público no cache
func SetPublicProfile(ctx context.Context, username string, profile interface{}) error {
	return Set(ctx, PublicProfileKey(username), profile, TTLLong)
}

// InvalidatePublicProfile invalida o cache de perfil público
func InvalidatePublicProfile(ctx context.Context, username string) error {
	return Delete(ctx, PublicProfileKey(username))
}

// ============================================
// HELPERS PARA ESTATÍSTICAS DE PROJETO
// ============================================

// ProjectStatsKey gera chave para stats de projeto
func ProjectStatsKey(projectID string) string {
	return PrefixProjectStats + projectID
}

// GetProjectStats obtém stats de projeto do cache
func GetProjectStats(ctx context.Context, projectID string) (map[string]interface{}, error) {
	var stats map[string]interface{}
	err := Get(ctx, ProjectStatsKey(projectID), &stats)
	return stats, err
}

// SetProjectStats armazena stats de projeto no cache
func SetProjectStats(ctx context.Context, projectID string, stats map[string]interface{}) error {
	return Set(ctx, ProjectStatsKey(projectID), stats, TTLMedium)
}

// InvalidateProjectStats invalida o cache de stats do projeto
func InvalidateProjectStats(ctx context.Context, projectID string) error {
	return Delete(ctx, ProjectStatsKey(projectID))
}



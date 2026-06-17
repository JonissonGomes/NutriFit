package storage

import (
	"strings"

	"nufit/backend/internal/config"
)

// Sem transformações server-side no R2; variantes apontam para o mesmo arquivo.
// A compressão de imagens é feita localmente antes do upload quando aplicável.

func GetThumbnailURL(objectKey string) string {
	return PublicURL(objectKey)
}

func GetMediumURL(objectKey string) string {
	return PublicURL(objectKey)
}

func GetCompressedURL(objectKey string) string {
	return PublicURL(objectKey)
}

func GetOriginalURL(objectKey string) string {
	return PublicURL(objectKey)
}

func GetImageURL(objectKey string, _transformation string) string {
	return PublicURL(objectKey)
}

// PublicURL monta a URL utilizável pelo frontend para um objeto no R2.
func PublicURL(objectKey string) string {
	key := normalizeObjectKey(objectKey)
	if key == "" {
		return ""
	}

	if config.AppConfig != nil {
		if base := strings.TrimRight(strings.TrimSpace(config.AppConfig.R2PublicBaseURL), "/"); base != "" {
			return base + "/" + key
		}
	}

	if apiBase := apiBaseURL(); apiBase != "" {
		return apiBase + "/api/v1/media/" + key
	}

	return key
}

// ResolveMediaURL normaliza URLs já salvas no banco (chaves R2, hosts inválidos, etc.).
func ResolveMediaURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	lower := strings.ToLower(raw)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") {
		if u, ok := extractObjectKeyFromURL(raw); ok {
			return PublicURL(u)
		}
		if isUsableAbsoluteURL(raw) {
			return raw
		}
		if u, ok := extractObjectKeyFromURL(strings.TrimPrefix(strings.TrimPrefix(raw, "https://"), "http://")); ok {
			return PublicURL(u)
		}
		return raw
	}

	if strings.HasPrefix(raw, "//") {
		return "https:" + raw
	}

	key := strings.TrimPrefix(raw, "nufit/")
	if isR2ObjectKey(key) {
		return PublicURL(key)
	}
	if isR2ObjectKey(raw) {
		return PublicURL(raw)
	}

	if strings.HasPrefix(raw, "/api/v1/media/") {
		if apiBase := apiBaseURL(); apiBase != "" {
			return apiBase + raw
		}
		return raw
	}

	return raw
}

func apiBaseURL() string {
	if config.AppConfig == nil {
		return "http://localhost:8080"
	}
	return strings.TrimRight(strings.TrimSpace(config.AppConfig.APIBaseURL), "/")
}

func normalizeObjectKey(objectKey string) string {
	return strings.TrimLeft(strings.ReplaceAll(objectKey, "\\", "/"), "/")
}

func isR2ObjectKey(s string) bool {
	s = normalizeObjectKey(s)
	parts := strings.SplitN(s, "/", 2)
	if len(parts) != 2 || len(parts[0]) != 24 {
		return false
	}
	for _, r := range parts[0] {
		if (r < '0' || r > '9') && (r < 'a' || r > 'f') && (r < 'A' || r > 'F') {
			return false
		}
	}
	return true
}

func extractObjectKeyFromURL(raw string) (string, bool) {
	withoutScheme := raw
	withoutScheme = strings.TrimPrefix(withoutScheme, "https://")
	withoutScheme = strings.TrimPrefix(withoutScheme, "http://")

	if idx := strings.Index(withoutScheme, "/api/v1/media/"); idx >= 0 {
		key := withoutScheme[idx+len("/api/v1/media/"):]
		if isR2ObjectKey(key) {
			return normalizeObjectKey(key), true
		}
	}

	// Host inválido antigo (ex.: https://nufit/{userId}/profile/avatar/...)
	if slash := strings.Index(withoutScheme, "/"); slash > 0 {
		key := withoutScheme[slash+1:]
		if isR2ObjectKey(key) {
			return normalizeObjectKey(key), true
		}
	}

	return "", false
}

func isUsableAbsoluteURL(raw string) bool {
	lower := strings.ToLower(raw)
	if !(strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://")) {
		return false
	}
	withoutScheme := strings.TrimPrefix(strings.TrimPrefix(raw, "https://"), "http://")
	host := withoutScheme
	if idx := strings.Index(withoutScheme, "/"); idx > 0 {
		host = withoutScheme[:idx]
	}
	if host == "" || !strings.Contains(host, ".") {
		return false
	}
	return !strings.EqualFold(host, "nufit")
}

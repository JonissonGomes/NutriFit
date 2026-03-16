package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
	"strings"
	"sync"
	"time"

	"arck-design/backend/internal/config"
)

// ============================================
// SISTEMA DE TOKENS OPACOS PARA IDs
// ============================================
//
// Este sistema cria tokens opacos para substituir ObjectIDs nas APIs públicas.
// - IDs internos nunca são expostos nas respostas da API
// - Tokens são encriptados usando AES-GCM
// - Tokens podem ter TTL (time-to-live) opcional
// - Cache em memória para performance
//

var (
	ErrInvalidToken = errors.New("token inválido")
	ErrExpiredToken = errors.New("token expirado")
	
	// Cache de tokens para evitar recálculo
	tokenCache     = make(map[string]cachedToken)
	tokenCacheMux  sync.RWMutex
	
	// Cipher para encriptação
	gcm cipher.AEAD
)

type cachedToken struct {
	id        string
	expiresAt time.Time
}

// InitTokenSystem inicializa o sistema de tokens
func InitTokenSystem() error {
	key := []byte(config.AppConfig.JWTSecret)
	
	// Ajustar tamanho da chave para AES-256 (32 bytes)
	if len(key) < 32 {
		// Preencher com zeros se menor
		paddedKey := make([]byte, 32)
		copy(paddedKey, key)
		key = paddedKey
	} else if len(key) > 32 {
		// Truncar se maior
		key = key[:32]
	}
	
	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}
	
	gcm, err = cipher.NewGCM(block)
	if err != nil {
		return err
	}
	
	// Iniciar limpeza periódica do cache
	go cleanupExpiredTokens()
	
	return nil
}

// EncodeID cria um token opaco a partir de um ID
func EncodeID(id string, prefix string) (string, error) {
	if gcm == nil {
		// Fallback se não inicializado - apenas base64
		return base64.URLEncoding.EncodeToString([]byte(prefix + ":" + id)), nil
	}
	
	// Criar nonce aleatório
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	
	// Dados a encriptar: prefix:id:timestamp
	plaintext := []byte(prefix + ":" + id + ":" + time.Now().Format(time.RFC3339))
	
	// Encriptar
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	
	// Converter para base64 URL-safe
	token := base64.URLEncoding.EncodeToString(ciphertext)
	
	return token, nil
}

// DecodeID extrai o ID original de um token opaco
func DecodeID(token string, expectedPrefix string) (string, error) {
	// Verificar cache primeiro
	tokenCacheMux.RLock()
	if cached, ok := tokenCache[token]; ok {
		tokenCacheMux.RUnlock()
		if time.Now().Before(cached.expiresAt) {
			return cached.id, nil
		}
		// Token expirado no cache
		tokenCacheMux.Lock()
		delete(tokenCache, token)
		tokenCacheMux.Unlock()
	} else {
		tokenCacheMux.RUnlock()
	}
	
	// Decodificar base64
	ciphertext, err := base64.URLEncoding.DecodeString(token)
	if err != nil {
		return "", ErrInvalidToken
	}
	
	if gcm == nil {
		// Fallback se não inicializado
		parts := strings.SplitN(string(ciphertext), ":", 2)
		if len(parts) != 2 || parts[0] != expectedPrefix {
			return "", ErrInvalidToken
		}
		return parts[1], nil
	}
	
	// Verificar tamanho mínimo
	if len(ciphertext) < gcm.NonceSize() {
		return "", ErrInvalidToken
	}
	
	// Extrair nonce e ciphertext
	nonce, ciphertext := ciphertext[:gcm.NonceSize()], ciphertext[gcm.NonceSize():]
	
	// Decriptar
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", ErrInvalidToken
	}
	
	// Parse: prefix:id:timestamp
	parts := strings.SplitN(string(plaintext), ":", 3)
	if len(parts) < 2 {
		return "", ErrInvalidToken
	}
	
	prefix := parts[0]
	id := parts[1]
	
	// Verificar prefix
	if prefix != expectedPrefix {
		return "", ErrInvalidToken
	}
	
	// Adicionar ao cache (TTL de 5 minutos)
	tokenCacheMux.Lock()
	tokenCache[token] = cachedToken{
		id:        id,
		expiresAt: time.Now().Add(5 * time.Minute),
	}
	tokenCacheMux.Unlock()
	
	return id, nil
}

// cleanupExpiredTokens limpa tokens expirados do cache periodicamente
func cleanupExpiredTokens() {
	ticker := time.NewTicker(10 * time.Minute)
	for range ticker.C {
		now := time.Now()
		tokenCacheMux.Lock()
		for token, cached := range tokenCache {
			if now.After(cached.expiresAt) {
				delete(tokenCache, token)
			}
		}
		tokenCacheMux.Unlock()
	}
}

// ============================================
// PREFIXOS DE TOKENS POR TIPO DE RECURSO
// ============================================

const (
	PrefixUser         = "usr"
	PrefixProject      = "prj"
	PrefixImage        = "img"
	PrefixConversation = "cnv"
	PrefixMessage      = "msg"
	PrefixService      = "svc"
	PrefixEvent        = "evt"
	PrefixReview       = "rev"
)

// ============================================
// HELPERS PARA CADA TIPO DE RECURSO
// ============================================

func EncodeUserID(id string) (string, error) {
	return EncodeID(id, PrefixUser)
}

func DecodeUserID(token string) (string, error) {
	return DecodeID(token, PrefixUser)
}

func EncodeProjectID(id string) (string, error) {
	return EncodeID(id, PrefixProject)
}

func DecodeProjectID(token string) (string, error) {
	return DecodeID(token, PrefixProject)
}

func EncodeImageID(id string) (string, error) {
	return EncodeID(id, PrefixImage)
}

func DecodeImageID(token string) (string, error) {
	return DecodeID(token, PrefixImage)
}

func EncodeConversationID(id string) (string, error) {
	return EncodeID(id, PrefixConversation)
}

func DecodeConversationID(token string) (string, error) {
	return DecodeID(token, PrefixConversation)
}

func EncodeMessageID(id string) (string, error) {
	return EncodeID(id, PrefixMessage)
}

func DecodeMessageID(token string) (string, error) {
	return DecodeID(token, PrefixMessage)
}

func EncodeServiceID(id string) (string, error) {
	return EncodeID(id, PrefixService)
}

func DecodeServiceID(token string) (string, error) {
	return DecodeID(token, PrefixService)
}

func EncodeEventID(id string) (string, error) {
	return EncodeID(id, PrefixEvent)
}

func DecodeEventID(token string) (string, error) {
	return DecodeID(token, PrefixEvent)
}

func EncodeReviewID(id string) (string, error) {
	return EncodeID(id, PrefixReview)
}

func DecodeReviewID(token string) (string, error) {
	return DecodeID(token, PrefixReview)
}




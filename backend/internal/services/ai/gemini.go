package ai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"nufit/backend/internal/config"
)

var (
	ErrAIUnavailable = errors.New("IA não disponível")
	ErrInvalidAPIKey = errors.New("chave de API inválida")
)

// GeminiClient cliente para API do Gemini
type GeminiClient struct {
	APIKey     string
	HTTPClient *http.Client
	BaseURL    string
}

func resolveTextModel() string {
	// Prioridade:
	// 1) GEMINI_TEXT_MODEL
	// 2) GEMINI_MODEL (global)
	// 3) default seguro
	if m := strings.TrimSpace(config.AppConfig.GeminiTextModel); m != "" {
		return m
	}
	if m := strings.TrimSpace(config.AppConfig.GeminiModel); m != "" {
		return m
	}
	return "gemini-1.5-pro"
}

func resolveVisionModel() string {
	// Prioridade:
	// 1) GEMINI_VISION_MODEL
	// 2) GEMINI_MODEL (global)
	// 3) default seguro
	if m := strings.TrimSpace(config.AppConfig.GeminiVisionModel); m != "" {
		return m
	}
	if m := strings.TrimSpace(config.AppConfig.GeminiModel); m != "" {
		return m
	}
	return "gemini-1.5-flash"
}

// NewGeminiClient cria um novo cliente Gemini
func NewGeminiClient() *GeminiClient {
	if config.AppConfig.GeminiAPIKey == "" {
		return nil
	}

	return &GeminiClient{
		APIKey: config.AppConfig.GeminiAPIKey,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		BaseURL: "https://generativelanguage.googleapis.com/v1beta",
	}
}

// GenerateText gera texto usando o modelo Gemini
func (c *GeminiClient) GenerateText(ctx context.Context, prompt string, systemInstruction string) (string, error) {
	if c == nil {
		return "", ErrAIUnavailable
	}

	model := resolveTextModel()

	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", c.BaseURL, model, c.APIKey)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}

	if systemInstruction != "" {
		payload["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": systemInstruction},
			},
		}
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("erro na API Gemini: %s", string(body))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("resposta vazia da API")
	}

	return result.Candidates[0].Content.Parts[0].Text, nil
}

// AnalyzeImage analisa uma imagem usando Gemini Vision
func (c *GeminiClient) AnalyzeImage(ctx context.Context, imageURL string, prompt string) (string, error) {
	if c == nil {
		return "", ErrAIUnavailable
	}

	// Baixar imagem e enviar inline_data para o Gemini (Vision)
	req, err := http.NewRequestWithContext(ctx, "GET", imageURL, nil)
	if err != nil {
		return "", err
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("falha ao baixar imagem: status %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/jpeg"
	}
	if strings.HasPrefix(contentType, "image/") == false {
		return "", fmt.Errorf("tipo de conteúdo inválido para imagem: %s", contentType)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	encoded := base64.StdEncoding.EncodeToString(data)

	visionModel := resolveVisionModel()

	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", c.BaseURL, visionModel, c.APIKey)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
					{"inline_data": map[string]interface{}{
						"mime_type": contentType,
						"data":      encoded,
					}},
				},
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	gReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	gReq.Header.Set("Content-Type", "application/json")
	gResp, err := c.HTTPClient.Do(gReq)
	if err != nil {
		return "", err
	}
	defer gResp.Body.Close()

	if gResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(gResp.Body)
		return "", fmt.Errorf("erro na API Gemini Vision: %s", string(body))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.NewDecoder(gResp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("resposta vazia da API (vision)")
	}
	return result.Candidates[0].Content.Parts[0].Text, nil
}

// CheckAIAvailable verifica se a IA está disponível
func CheckAIAvailable() bool {
	return config.AppConfig.GeminiAPIKey != ""
}

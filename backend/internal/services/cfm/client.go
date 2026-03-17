// Package cfm fornece validação opcional de CRM consultando o portal público do CFM.
// Uso não oficial: replica a consulta que um cidadão faria no site. Em caso de falha
// (timeout, indisponibilidade), o caller deve tratar como "não validado" e não bloquear o registro.
package cfm

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

const (
	defaultBaseURL   = "https://portal.cfm.org.br"
	defaultTimeout   = 10 * time.Second
	browserUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

var (
	// Formato CRM/UF 123456 ou CRM-UF 123456 (UF = 2 letras).
	crmWithUFRegex = regexp.MustCompile(`(?i)CRM\s*[/-]?\s*([A-Z]{2})\s*(\d{4,8})`)
	// Apenas dígitos do número.
	crmDigitsRegex = regexp.MustCompile(`(\d{4,8})`)
)

// ParseCRMNumber extrai UF e número do CRM a partir da string informada.
// Ex.: "CRM/SP 123456" -> uf="SP", number="123456", true.
// Ex.: "123456" -> ok=false (não há UF; validação CFM exige UF).
func ParseCRMNumber(full string) (uf, number string, ok bool) {
	full = strings.TrimSpace(full)
	if full == "" {
		return "", "", false
	}
	if m := crmWithUFRegex.FindStringSubmatch(full); len(m) >= 3 {
		return strings.ToUpper(m[1]), strings.TrimSpace(m[2]), true
	}
	// Apenas dígitos: extrair número mas não temos UF.
	if m := crmDigitsRegex.FindStringSubmatch(full); len(m) >= 1 {
		return "", m[1], false
	}
	return "", "", false
}

// Client consulta o portal do CFM para validar CRM.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient cria um cliente com timeout padrão.
func NewClient() *Client {
	return &Client{
		BaseURL: defaultBaseURL,
		HTTPClient: &http.Client{
			Timeout: defaultTimeout,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 3 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// ValidateCRM consulta o portal do CFM e indica se o CRM está registrado na UF.
// Retorna (true, nil) se encontrou o médico, (false, nil) se a busca retornou "nenhum resultado",
// e (false, err) em caso de falha de rede/timeout/parsing (caller deve tratar como fallback, não bloquear).
func (c *Client) ValidateCRM(ctx context.Context, uf, crmNumber string) (valid bool, err error) {
	uf = strings.TrimSpace(strings.ToUpper(uf))
	crmNumber = strings.TrimSpace(crmNumber)
	if uf == "" || crmNumber == "" {
		return false, fmt.Errorf("uf e número do CRM são obrigatórios para validação")
	}
	if len(uf) != 2 {
		return false, fmt.Errorf("UF deve ter 2 caracteres")
	}

	u, err := url.Parse(c.BaseURL + "/busca-medicos/")
	if err != nil {
		return false, err
	}
	q := u.Query()
	q.Set("ufMedico", uf)
	q.Set("crmMedico", crmNumber)
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("User-Agent", browserUserAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "pt-BR,pt;q=0.9,en;q=0.8")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("portal CFM retornou status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	if err != nil {
		return false, err
	}
	html := string(body)

	// Mensagens comuns de "nenhum resultado" no portal.
	noResultMarkers := []string{
		"nenhum médico encontrado",
		"nenhum médico foi encontrado",
		"não encontrado",
		"nenhum resultado",
		"não há registros",
	}
	lower := strings.ToLower(html)
	for _, m := range noResultMarkers {
		if strings.Contains(lower, m) {
			return false, nil
		}
	}

	// Página pode listar o médico: presença do número do CRM no corpo (evitar falso positivo no formulário).
	// Procurar o número em contexto de resultado (ex.: dentro de tabela/card). Simplificado: se não é "nenhum resultado"
	// e a página contém o número do CRM, consideramos como possível encontro. Há risco de falso positivo se a página
	// for apenas o formulário com o valor preenchido; muitas vezes o resultado vem em outra seção.
	if strings.Contains(html, crmNumber) {
		return true, nil
	}

	// Página carregou mas não identificamos nem "nenhum resultado" nem o número (estrutura diferente).
	// Tratamos como falha de parsing para não bloquear.
	return false, fmt.Errorf("resposta do portal CFM não pôde ser interpretada")
}

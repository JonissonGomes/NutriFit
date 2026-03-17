package email

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"

	"nufit/backend/internal/config"
)

// WelcomeTemplate retorna assunto e corpo (texto) do e-mail de boas-vindas por perfil.
func welcomeContent(role, name, loginURL string) (subject, body string) {
	firstName := name
	if i := strings.Index(name, " "); i > 0 {
		firstName = strings.TrimSpace(name[:i])
	}
	if firstName == "" {
		firstName = "Olá"
	}

	switch role {
	case "nutricionista":
		subject = "Bem-vindo(a) ao NuFit — sua plataforma de nutrição"
		body = fmt.Sprintf(`Olá, %s!

Bem-vindo(a) ao NuFit. Sua conta como nutricionista foi criada com sucesso.

Agora você pode:
• Criar e gerenciar planos alimentares para seus pacientes
• Acompanhar diários alimentares e evolução
• Usar ferramentas de anamnese e IA para apoiar seu trabalho
• Organizar sua agenda e consultas

Acesse sua área e comece a usar: %s

Qualquer dúvida, responda este e-mail. Estamos à disposição.

Equipe NuFit`, firstName, loginURL)

	case "medico":
		subject = "Bem-vindo(a) ao NuFit — área do médico"
		body = fmt.Sprintf(`Olá, %s!

Sua conta de médico no NuFit foi criada com sucesso.

Você tem acesso a:
• Agenda e lembretes para seus pacientes
• Chat com paciente
• Upload e acompanhamento de exames laboratoriais
• Assistente de IA para apoio clínico (sem prescrição dietética estruturada)

Acesse o painel: %s

Dúvidas? Responda este e-mail.

Equipe NuFit`, firstName, loginURL)

	case "paciente":
		subject = "Bem-vindo(a) ao NuFit — sua jornada de nutrição"
		body = fmt.Sprintf(`Olá, %s!

Sua conta no NuFit foi criada. Agora você pode:

• Acessar seu plano alimentar (quando seu nutricionista compartilhar)
• Registrar seu diário alimentar e evolução
• Ver suas metas e acompanhar resultados
• Falar com seu nutricionista pela plataforma

Entre na sua área: %s

Qualquer dúvida, fale com seu profissional de saúde ou responda este e-mail.

Equipe NuFit`, firstName, loginURL)

	default:
		subject = "Bem-vindo(a) ao NuFit"
		body = fmt.Sprintf(`Olá, %s!

Sua conta no NuFit foi criada com sucesso.

Acesse: %s

Equipe NuFit`, firstName, loginURL)
	}

	return subject, body
}

// SendWelcome envia e-mail de boas-vindas ao usuário conforme o perfil (nutricionista, medico, paciente).
// Não retorna erro para não bloquear o registro; falhas são apenas logadas.
func SendWelcome(toEmail, userName, role string) {
	cfg := config.AppConfig
	if cfg == nil || cfg.EmailUser == "" || cfg.EmailPass == "" {
		return
	}
	loginURL := cfg.AppLoginURL
	if loginURL == "" {
		loginURL = "http://localhost:5173/login"
	}
	subject, body := welcomeContent(role, userName, loginURL)

	from := cfg.EmailUser
	fromName := cfg.GmailFromName
	if fromName == "" {
		fromName = "NuFit"
	}
	addr := fmt.Sprintf("%s:%d", cfg.GmailSMTPHost, cfg.GmailSMTPPort)
	msg := buildMessage(from, fromName, toEmail, subject, body)

	auth := smtp.PlainAuth("", cfg.EmailUser, cfg.EmailPass, cfg.GmailSMTPHost)

	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, cfg.GmailSMTPHost)
	if err != nil {
		return
	}
	defer client.Close()

	if err = client.StartTLS(&tls.Config{ServerName: cfg.GmailSMTPHost}); err != nil {
		return
	}
	if err = client.Auth(auth); err != nil {
		return
	}
	if err = client.Mail(from); err != nil {
		return
	}
	if err = client.Rcpt(toEmail); err != nil {
		return
	}
	w, err := client.Data()
	if err != nil {
		return
	}
	_, _ = w.Write([]byte(msg))
	_ = w.Close()
	_ = client.Quit()
}

func buildMessage(from, fromName, to, subject, body string) string {
	headers := []string{
		"From: " + fromName + " <" + from + ">",
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
	}
	return strings.Join(headers, "\r\n") + "\r\n" + body
}

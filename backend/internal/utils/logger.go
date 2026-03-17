package utils

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"nufit/backend/internal/config"
)

// LogLevel representa o nível de log
type LogLevel int

const (
	LogLevelDebug LogLevel = iota
	LogLevelInfo
	LogLevelWarn
	LogLevelError
	LogLevelFatal
)

var (
	currentLogLevel LogLevel
	isDevelopment   bool
)

// InitLogger inicializa o sistema de logging baseado no ambiente
func InitLogger() {
	env := strings.ToLower(config.AppConfig.Env)
	isDevelopment = env == "development" || env == "dev"

	if isDevelopment {
		currentLogLevel = LogLevelDebug
		log.SetFlags(log.LstdFlags | log.Lshortfile)
	} else {
		currentLogLevel = LogLevelInfo
		log.SetFlags(log.LstdFlags)
	}
}

// IsDevelopment retorna se está em modo desenvolvimento
func IsDevelopment() bool {
	return isDevelopment
}

// Debug log apenas em desenvolvimento
func Debug(format string, v ...interface{}) {
	if isDevelopment && currentLogLevel <= LogLevelDebug {
		log.Printf("[DEBUG] "+format, v...)
	}
}

// Info log de informações gerais
func Info(format string, v ...interface{}) {
	if currentLogLevel <= LogLevelInfo {
		log.Printf("[INFO] "+format, v...)
	}
}

// Warn log de avisos
func Warn(format string, v ...interface{}) {
	if currentLogLevel <= LogLevelWarn {
		log.Printf("[WARN] "+format, v...)
	}
}

// Error log de erros
func Error(format string, v ...interface{}) {
	if currentLogLevel <= LogLevelError {
		log.Printf("[ERROR] "+format, v...)
	}
}

// Fatal log fatal e encerra a aplicação
func Fatal(format string, v ...interface{}) {
	log.Fatalf("[FATAL] "+format, v...)
}

// LogStatus log de status de inicialização
func LogStatus(component string, status string, err error) {
	// Garantir que o logger foi inicializado
	if !isDevelopment && currentLogLevel == 0 {
		isDevelopment = strings.ToLower(os.Getenv("ENV")) == "development" || strings.ToLower(os.Getenv("ENV")) == "dev"
		if !isDevelopment {
			currentLogLevel = LogLevelInfo
		}
	}

	icon := "✓"
	color := "\033[32m" // Verde
	reset := "\033[0m"

	if err != nil {
		icon = "✗"
		color = "\033[31m" // Vermelho
		status = fmt.Sprintf("ERRO: %v", err)
	} else if status == "OK" || status == "Conectado" || status == "Inicializado" {
		color = "\033[32m" // Verde
	} else if status == "Aviso" || strings.Contains(status, "Warning") {
		color = "\033[33m" // Amarelo
		icon = "⚠"
	}

	if isDevelopment {
		// Em desenvolvimento, usar cores
		fmt.Printf("%s%s%s [%s] %s: %s\n", color, icon, reset, time.Now().Format("15:04:05"), component, status)
	} else {
		// Em produção, sem cores
		if err != nil {
			log.Printf("[%s] %s: ERRO - %v", component, status, err)
		} else {
			log.Printf("[%s] %s: %s", component, status, status)
		}
	}
}

// LogStartupHeader exibe o cabeçalho de inicialização
func LogStartupHeader() {
	if isDevelopment {
		fmt.Println("\n" + strings.Repeat("=", 60))
		fmt.Println("  ARCK DESIGN - Backend Server")
		fmt.Println("  Ambiente: DEVELOPMENT")
		fmt.Println("  Iniciando serviços...")
		fmt.Println(strings.Repeat("=", 60) + "\n")
	} else {
		Info("=== ARCK DESIGN - Backend Server ===")
		Info("Ambiente: PRODUCTION")
		Info("Iniciando serviços...")
	}
}

// LogStartupFooter exibe o rodapé de inicialização
func LogStartupFooter(port string) {
	if isDevelopment {
		fmt.Println("\n" + strings.Repeat("=", 60))
		fmt.Printf("  ✓ Servidor iniciado com sucesso!\n")
		fmt.Printf("  ✓ Porta: %s\n", port)
		fmt.Printf("  ✓ Ambiente: %s\n", strings.ToUpper(config.AppConfig.Env))
		fmt.Println(strings.Repeat("=", 60))
		fmt.Printf("\n  Servidor rodando em http://localhost:%s\n", port)
		fmt.Println("  Pressione Ctrl+C para encerrar\n")
	} else {
		Info("=== Servidor iniciado com sucesso ===")
		Info("Porta: %s", port)
		Info("Ambiente: %s", strings.ToUpper(config.AppConfig.Env))
	}
}

// LogComponentStatus log de status de componente
func LogComponentStatus(component string, success bool, message string) {
	if success {
		LogStatus(component, "OK", nil)
		if isDevelopment && message != "" {
			Debug("%s: %s", component, message)
		}
	} else {
		LogStatus(component, message, fmt.Errorf(message))
	}
}


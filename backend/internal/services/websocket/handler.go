package websocket

import (
	"log"
	"net/http"

	"nufit/backend/internal/services/auth"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Em produção, validar origem
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"http://localhost:5173",
			"https://arckdesign.com",
		}
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		return false
	},
}

// Hub global para WebSocket
var GlobalHub *Hub

// InitWebSocket inicializa o hub WebSocket
func InitWebSocket() {
	GlobalHub = NewHub()
	go GlobalHub.Run()
}

// HandleWebSocket é o handler Gin para conexões WebSocket
func HandleWebSocket(c *gin.Context) {
	// Autenticação via query param token
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autenticação necessário"})
		return
	}

	// Validar token JWT
	claims, err := auth.ValidateJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido ou expirado"})
		return
	}

	// Fazer upgrade para WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Erro ao fazer upgrade WebSocket: %v", err)
		return
	}

	// Criar cliente
	client := NewClient(GlobalHub, conn, claims.Subject)

	// Registrar cliente
	GlobalHub.register <- client

	// Log de conexão
	log.Printf("WebSocket: Usuário %s conectado", claims.Subject)

	// Notificar outros usuários sobre status online (opcional)
	// Isso pode ser expandido para uma lista de contatos

	// Iniciar goroutines para leitura e escrita
	go client.WritePump()
	go client.ReadPump()
}

// SendNewMessageNotification envia notificação de nova mensagem
func SendNewMessageNotification(receiverID string, messageData interface{}) {
	if GlobalHub == nil {
		return
	}
	GlobalHub.SendToUser(receiverID, MessageTypeNewMessage, messageData)
}

// SendMessageReadNotification envia notificação de mensagem lida
func SendMessageReadNotification(senderID string, conversationID string) {
	if GlobalHub == nil {
		return
	}
	GlobalHub.SendToUser(senderID, MessageTypeMessageRead, map[string]string{
		"conversationId": conversationID,
	})
}

// SendNotification envia notificação genérica
func SendNotification(userID string, notification interface{}) {
	if GlobalHub == nil {
		return
	}
	GlobalHub.SendToUser(userID, MessageTypeNotification, notification)
}

// SendConversationCreated notifica sobre nova conversa
func SendConversationCreated(userID string, conversation interface{}) {
	if GlobalHub == nil {
		return
	}
	GlobalHub.SendToUser(userID, MessageTypeConversationNew, conversation)
}




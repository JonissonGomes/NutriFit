package websocket

import (
	"sync"
)

// Hub mantém o registro de todos os clientes WebSocket ativos
// e gerencia o broadcast de mensagens
type Hub struct {
	// Clientes registrados por userID
	clients map[string]map[*Client]bool

	// Canal para registrar novos clientes
	register chan *Client

	// Canal para remover clientes
	unregister chan *Client

	// Canal para broadcast de mensagens para um usuário específico
	broadcast chan *Message

	// Mutex para operações seguras
	mu sync.RWMutex
}

// Message representa uma mensagem a ser enviada via WebSocket
type Message struct {
	Type       string      `json:"type"`
	ReceiverID string      `json:"-"`
	Data       interface{} `json:"data"`
}

// Tipos de mensagens
const (
	MessageTypeNewMessage      = "new_message"
	MessageTypeMessageRead     = "message_read"
	MessageTypeTyping          = "typing"
	MessageTypeStopTyping      = "stop_typing"
	MessageTypeOnlineStatus    = "online_status"
	MessageTypeNotification    = "notification"
	MessageTypeConversationNew = "conversation_new"
)

// NewHub cria uma nova instância do Hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
	}
}

// Run inicia o loop principal do Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastToUser(message)
		}
	}
}

// registerClient registra um novo cliente
func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[client.UserID] == nil {
		h.clients[client.UserID] = make(map[*Client]bool)
	}
	h.clients[client.UserID][client] = true
}

// unregisterClient remove um cliente
func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.clients[client.UserID]; ok {
		if _, exists := clients[client]; exists {
			delete(clients, client)
			close(client.send)

			// Limpar mapa se não houver mais clientes para esse usuário
			if len(clients) == 0 {
				delete(h.clients, client.UserID)
			}
		}
	}
}

// broadcastToUser envia mensagem para todos os dispositivos de um usuário
func (h *Hub) broadcastToUser(message *Message) {
	h.mu.RLock()
	clients, ok := h.clients[message.ReceiverID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	// Serializar mensagem
	data, err := marshalMessage(message)
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range clients {
		select {
		case client.send <- data:
		default:
			// Buffer cheio, cliente lento - desconectar
			go func(c *Client) {
				h.unregister <- c
			}(client)
		}
	}
}

// SendToUser envia uma mensagem para um usuário específico
func (h *Hub) SendToUser(userID string, msgType string, data interface{}) {
	h.broadcast <- &Message{
		Type:       msgType,
		ReceiverID: userID,
		Data:       data,
	}
}

// IsUserOnline verifica se um usuário está online
func (h *Hub) IsUserOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients, ok := h.clients[userID]
	return ok && len(clients) > 0
}

// GetOnlineUsers retorna lista de usuários online
func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// GetUserConnectionCount retorna número de conexões de um usuário
func (h *Hub) GetUserConnectionCount(userID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.clients[userID]; ok {
		return len(clients)
	}
	return 0
}




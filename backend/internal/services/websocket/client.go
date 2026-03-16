package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Tempo permitido para escrever mensagem
	writeWait = 10 * time.Second

	// Tempo permitido para ler próximo pong
	pongWait = 60 * time.Second

	// Enviar pings neste intervalo (deve ser menor que pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Tamanho máximo da mensagem
	maxMessageSize = 8192
)

// Client representa uma conexão WebSocket individual
type Client struct {
	hub *Hub

	// Conexão WebSocket
	conn *websocket.Conn

	// Canal para mensagens a enviar
	send chan []byte

	// ID do usuário autenticado
	UserID string
}

// NewClient cria um novo cliente WebSocket
func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
	}
}

// ReadPump lê mensagens do WebSocket
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Processar mensagem recebida
		c.handleMessage(message)
	}
}

// WritePump envia mensagens para o WebSocket
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub fechou o canal
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Adicionar mensagens enfileiradas na mesma escrita
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processa mensagens recebidas do cliente
func (c *Client) handleMessage(data []byte) {
	var msg IncomingMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("Erro ao parsear mensagem WebSocket: %v", err)
		return
	}

	switch msg.Type {
	case "typing":
		c.handleTyping(msg)
	case "stop_typing":
		c.handleStopTyping(msg)
	case "ping":
		c.sendPong()
	}
}

// IncomingMessage representa uma mensagem recebida do cliente
type IncomingMessage struct {
	Type       string          `json:"type"`
	ReceiverID string          `json:"receiverId,omitempty"`
	Data       json.RawMessage `json:"data,omitempty"`
}

// handleTyping notifica que o usuário está digitando
func (c *Client) handleTyping(msg IncomingMessage) {
	if msg.ReceiverID == "" {
		return
	}

	c.hub.SendToUser(msg.ReceiverID, MessageTypeTyping, map[string]string{
		"userId": c.UserID,
	})
}

// handleStopTyping notifica que o usuário parou de digitar
func (c *Client) handleStopTyping(msg IncomingMessage) {
	if msg.ReceiverID == "" {
		return
	}

	c.hub.SendToUser(msg.ReceiverID, MessageTypeStopTyping, map[string]string{
		"userId": c.UserID,
	})
}

// sendPong responde a um ping do cliente
func (c *Client) sendPong() {
	response, _ := json.Marshal(map[string]string{"type": "pong"})
	c.send <- response
}

// marshalMessage serializa uma mensagem para JSON
func marshalMessage(msg *Message) ([]byte, error) {
	return json.Marshal(msg)
}




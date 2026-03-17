package message

import (
	"context"
	"errors"
	"time"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"
	"nufit/backend/internal/services/websocket"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============================================
// ERROS
// ============================================

var (
	ErrConversationNotFound = errors.New("conversa não encontrada")
	ErrMessageNotFound      = errors.New("mensagem não encontrada")
	ErrUnauthorized         = errors.New("não autorizado")
	ErrInvalidReceiver      = errors.New("destinatário inválido")
	ErrEmptyMessage         = errors.New("mensagem não pode estar vazia")
)

// ============================================
// CONVERSAS
// ============================================

// GetOrCreateConversation obtém ou cria uma conversa entre dois usuários
func GetOrCreateConversation(ctx context.Context, userID1, userID2 string) (*models.Conversation, error) {
	uid1, err := primitive.ObjectIDFromHex(userID1)
	if err != nil {
		return nil, err
	}
	uid2, err := primitive.ObjectIDFromHex(userID2)
	if err != nil {
		return nil, err
	}

	// Verificar se já existe conversa
	var conversation models.Conversation
	filter := bson.M{
		"$or": []bson.M{
			{"architectId": uid1, "clientId": uid2},
			{"architectId": uid2, "clientId": uid1},
		},
	}

	err = database.ConversationsCollection.FindOne(ctx, filter).Decode(&conversation)
	if err == nil {
		return &conversation, nil
	}

	if !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}

	// Criar nova conversa
	now := time.Now()
	conversation = models.Conversation{
		ID:            primitive.NewObjectID(),
		Participants:  []primitive.ObjectID{uid1, uid2},
		UnreadCount:   map[string]int{userID1: 0, userID2: 0},
		LastMessageAt: now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	_, err = database.ConversationsCollection.InsertOne(ctx, conversation)
	if err != nil {
		return nil, err
	}

	return &conversation, nil
}

// GetConversations obtém todas as conversas de um usuário
func GetConversations(ctx context.Context, userID string) ([]ConversationWithDetails, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Pipeline de agregação para obter conversas com detalhes
	pipeline := mongo.Pipeline{
		// Match conversas do usuário
		{{Key: "$match", Value: bson.M{
			"participants": uid,
		}}},
		// Ordenar por última mensagem
		{{Key: "$sort", Value: bson.M{"lastMessageAt": -1}}},
		// Lookup para obter última mensagem
		{{Key: "$lookup", Value: bson.M{
			"from":         "messages",
			"localField":   "lastMessage",
			"foreignField": "_id",
			"as":           "lastMessageData",
		}}},
		// Unwind da última mensagem
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$lastMessageData",
			"preserveNullAndEmptyArrays": true,
		}}},
		// Lookup para obter dados do outro participante
		{{Key: "$addFields", Value: bson.M{
			"otherParticipantId": bson.M{
				"$arrayElemAt": bson.A{
					bson.M{"$filter": bson.M{
						"input": "$participants",
						"cond":  bson.M{"$ne": bson.A{"$$this", uid}},
					}},
					0,
				},
			},
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "otherParticipantId",
			"foreignField": "_id",
			"as":           "otherParticipant",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$otherParticipant",
			"preserveNullAndEmptyArrays": true,
		}}},
	}

	cursor, err := database.ConversationsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []ConversationWithDetails
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}

// GetConversationByID obtém uma conversa por ID
func GetConversationByID(ctx context.Context, conversationID, userID string) (*models.Conversation, error) {
	cid, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return nil, err
	}
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	var conversation models.Conversation
	filter := bson.M{
		"_id":          cid,
		"participants": uid,
	}

	err = database.ConversationsCollection.FindOne(ctx, filter).Decode(&conversation)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrConversationNotFound
		}
		return nil, err
	}

	return &conversation, nil
}

// DeleteConversation deleta uma conversa e todas as suas mensagens
func DeleteConversation(ctx context.Context, conversationID, userID string) error {
	cid, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return err
	}
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	// Verificar se usuário faz parte da conversa
	var conversation models.Conversation
	err = database.ConversationsCollection.FindOne(ctx, bson.M{
		"_id":          cid,
		"participants": uid,
	}).Decode(&conversation)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrConversationNotFound
		}
		return err
	}

	// Deletar todas as mensagens da conversa
	_, err = database.MessagesCollection.DeleteMany(ctx, bson.M{"conversationId": cid})
	if err != nil {
		return err
	}

	// Deletar a conversa
	_, err = database.ConversationsCollection.DeleteOne(ctx, bson.M{"_id": cid})
	return err
}

// ============================================
// MENSAGENS
// ============================================

// SendMessage envia uma nova mensagem
func SendMessage(ctx context.Context, senderID, receiverID, text string, attachments []models.MessageAttachment) (*models.Message, error) {
	// Validações
	if text == "" && len(attachments) == 0 {
		return nil, ErrEmptyMessage
	}

	if senderID == receiverID {
		return nil, ErrInvalidReceiver
	}

	sid, err := primitive.ObjectIDFromHex(senderID)
	if err != nil {
		return nil, err
	}
	rid, err := primitive.ObjectIDFromHex(receiverID)
	if err != nil {
		return nil, err
	}

	// Obter ou criar conversa
	conversation, err := GetOrCreateConversation(ctx, senderID, receiverID)
	if err != nil {
		return nil, err
	}

	// Criar mensagem
	now := time.Now()
	message := models.Message{
		ID:             primitive.NewObjectID(),
		ConversationID: conversation.ID,
		SenderID:       sid,
		ReceiverID:     rid,
		Text:           text,
		Attachments:    attachments,
		Read:           false,
		CreatedAt:      now,
	}

	// Inserir mensagem
	_, err = database.MessagesCollection.InsertOne(ctx, message)
	if err != nil {
		return nil, err
	}

	// Atualizar conversa
	update := bson.M{
		"$set": bson.M{
			"lastMessage":   message.ID,
			"lastMessageAt": now,
			"updatedAt":     now,
		},
		"$inc": bson.M{
			"unreadCount." + receiverID: 1,
		},
	}

	_, err = database.ConversationsCollection.UpdateByID(ctx, conversation.ID, update)
	if err != nil {
		return nil, err
	}

	// Enviar notificação via WebSocket
	websocket.SendNewMessageNotification(receiverID, map[string]interface{}{
		"messageId":      message.ID.Hex(),
		"conversationId": conversation.ID.Hex(),
		"senderId":       senderID,
		"text":           text,
		"createdAt":      now,
	})

	return &message, nil
}

// GetMessages obtém mensagens de uma conversa
func GetMessages(ctx context.Context, conversationID, userID string, page, limit int) ([]models.Message, int64, error) {
	cid, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return nil, 0, err
	}
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, err
	}

	// Verificar se usuário faz parte da conversa
	var conversation models.Conversation
	err = database.ConversationsCollection.FindOne(ctx, bson.M{
		"_id":          cid,
		"participants": uid,
	}).Decode(&conversation)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, 0, ErrUnauthorized
		}
		return nil, 0, err
	}

	// Contar total de mensagens
	filter := bson.M{"conversationId": cid}
	total, err := database.MessagesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Buscar mensagens com paginação
	skip := (page - 1) * limit
	opts := options.Find().
		SetSort(bson.M{"createdAt": -1}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := database.MessagesCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var messages []models.Message
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, 0, err
	}

	return messages, total, nil
}

// MarkAsRead marca mensagens como lidas
func MarkAsRead(ctx context.Context, conversationID, userID string) error {
	cid, err := primitive.ObjectIDFromHex(conversationID)
	if err != nil {
		return err
	}
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	// Verificar se usuário faz parte da conversa
	var conversation models.Conversation
	err = database.ConversationsCollection.FindOne(ctx, bson.M{
		"_id":          cid,
		"participants": uid,
	}).Decode(&conversation)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrUnauthorized
		}
		return err
	}

	now := time.Now()

	// Marcar todas as mensagens não lidas como lidas
	filter := bson.M{
		"conversationId": cid,
		"receiverId":     uid,
		"read":           false,
	}
	update := bson.M{
		"$set": bson.M{
			"read":   true,
			"readAt": now,
		},
	}

	_, err = database.MessagesCollection.UpdateMany(ctx, filter, update)
	if err != nil {
		return err
	}

	// Zerar contador de não lidas na conversa
	convUpdate := bson.M{
		"$set": bson.M{
			"unreadCount." + userID: 0,
			"updatedAt":             now,
		},
	}

	_, err = database.ConversationsCollection.UpdateByID(ctx, cid, convUpdate)
	if err != nil {
		return err
	}

	// Notificar o remetente que as mensagens foram lidas
	// Encontrar o outro participante da conversa
	for _, participant := range conversation.Participants {
		if participant != uid {
			websocket.SendMessageReadNotification(participant.Hex(), conversationID)
			break
		}
	}

	return nil
}

// DeleteMessage deleta uma mensagem (soft delete ou hard delete)
func DeleteMessage(ctx context.Context, messageID, userID string) error {
	mid, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return err
	}
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	// Verificar se o usuário é o remetente
	var message models.Message
	err = database.MessagesCollection.FindOne(ctx, bson.M{
		"_id":      mid,
		"senderId": uid,
	}).Decode(&message)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrUnauthorized
		}
		return err
	}

	// Deletar mensagem
	_, err = database.MessagesCollection.DeleteOne(ctx, bson.M{"_id": mid})
	return err
}

// GetUnreadCount obtém a contagem de mensagens não lidas de um usuário
func GetUnreadCount(ctx context.Context, userID string) (int64, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return 0, err
	}

	count, err := database.MessagesCollection.CountDocuments(ctx, bson.M{
		"receiverId": uid,
		"read":       false,
	})
	if err != nil {
		return 0, err
	}

	return count, nil
}

// ============================================
// TIPOS AUXILIARES
// ============================================

// ConversationWithDetails representa uma conversa com detalhes adicionais
type ConversationWithDetails struct {
	models.Conversation `bson:",inline"`
	LastMessageData     *models.Message `bson:"lastMessageData,omitempty" json:"lastMessageData,omitempty"`
	OtherParticipant    *UserBasicInfo  `bson:"otherParticipant,omitempty" json:"otherParticipant,omitempty"`
}

// UserBasicInfo informações básicas do usuário para exibição
type UserBasicInfo struct {
	ID     primitive.ObjectID `bson:"_id" json:"id"`
	Name   string             `bson:"name" json:"name"`
	Email  string             `bson:"email" json:"email"`
	Avatar string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Role   string             `bson:"role" json:"role"`
}


// ============================================
// SERVIÇO DE MENSAGENS
// ============================================

import { api, sanitizeInput } from './api'
import type {
  Conversation,
  Message,
  SendMessageRequest,
  PaginatedResponse,
  ApiResponse,
} from '../types/api'

// ============================================
// TIPOS AUXILIARES
// ============================================

interface ConversationWithDetails extends Conversation {
  lastMessageData?: Message
  otherParticipant?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
}

// ============================================
// SERVIÇO DE MENSAGENS
// ============================================

export const messageService = {
  /**
   * Listar todas as conversas do usuário
   */
  async getConversations(): Promise<ApiResponse<ConversationWithDetails[]>> {
    return api.get<ConversationWithDetails[]>('/messages/conversations')
  },

  /**
   * Iniciar ou obter conversa com outro usuário
   */
  async startConversation(receiverId: string): Promise<ApiResponse<Conversation>> {
    if (!receiverId || typeof receiverId !== 'string') {
      return { error: 'ID do destinatário inválido' }
    }

    return api.post<Conversation>('/messages/conversations', { receiverId })
  },

  /**
   * Obter conversa por ID
   */
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    if (!conversationId || typeof conversationId !== 'string') {
      return { error: 'ID da conversa inválido' }
    }

    return api.get<Conversation>(`/messages/conversations/${encodeURIComponent(conversationId)}`)
  },

  /**
   * Obter mensagens de uma conversa
   */
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    if (!conversationId || typeof conversationId !== 'string') {
      return { error: 'ID da conversa inválido' }
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: Math.min(limit, 100).toString(),
    })

    return api.get<PaginatedResponse<Message>>(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages?${params}`
    )
  },

  /**
   * Enviar mensagem
   */
  async sendMessage(
    receiverId: string,
    text: string,
    attachments?: File[]
  ): Promise<ApiResponse<Message>> {
    if (!receiverId || typeof receiverId !== 'string') {
      return { error: 'ID do destinatário inválido' }
    }

    if (!text.trim() && (!attachments || attachments.length === 0)) {
      return { error: 'Mensagem deve ter texto ou anexos' }
    }

    // Sanitizar e limitar texto
    const sanitizedText = sanitizeInput(text.trim()).substring(0, 5000)

    // Se houver anexos, fazer upload primeiro
    // Por enquanto, apenas texto
    const body: SendMessageRequest = {
      receiverId,
      text: sanitizedText,
    }

    return api.post<Message>('/messages', body)
  },

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    if (!conversationId || typeof conversationId !== 'string') {
      return { error: 'ID da conversa inválido' }
    }

    return api.put<{ message: string }>(
      `/messages/conversations/${encodeURIComponent(conversationId)}/read`
    )
  },

  /**
   * Deletar mensagem
   */
  async deleteMessage(messageId: string): Promise<ApiResponse<{ message: string }>> {
    if (!messageId || typeof messageId !== 'string') {
      return { error: 'ID da mensagem inválido' }
    }

    return api.delete<{ message: string }>(`/messages/${encodeURIComponent(messageId)}`)
  },

  /**
   * Obter contagem de mensagens não lidas
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return api.get<{ unreadCount: number }>('/messages/unread-count')
  },

  /**
   * Formatar data da mensagem para exibição
   */
  formatMessageDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Hoje - mostrar hora
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      // Esta semana - mostrar dia da semana
      return date.toLocaleDateString('pt-BR', { weekday: 'long' })
    } else {
      // Mais de uma semana - mostrar data completa
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    }
  },

  /**
   * Truncar texto da mensagem para preview
   */
  truncateMessage(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  },

  /**
   * Deletar conversa
   */
  async deleteConversation(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    if (!conversationId || typeof conversationId !== 'string') {
      return { error: 'ID da conversa inválido' }
    }

    return api.delete<{ message: string }>(`/messages/conversations/${encodeURIComponent(conversationId)}`)
  },
}



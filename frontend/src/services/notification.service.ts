// ============================================
// SERVIÇO DE NOTIFICAÇÕES
// ============================================

import { api } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type NotificationType = 
  | 'event_reminder' 
  | 'project_update' 
  | 'message' 
  | 'review' 
  | 'verification' 
  | 'favorite' 
  | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedType?: string
  relatedId?: string
  read: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  email: {
    eventReminders: boolean
    projectUpdates: boolean
    messages: boolean
    reviews: boolean
  }
  inApp: {
    eventReminders: boolean
    projectUpdates: boolean
    messages: boolean
    reviews: boolean
  }
}

// ============================================
// SERVIÇO
// ============================================

export const notificationService = {
  /**
   * Listar notificações do usuário
   */
  async listNotifications(options?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const params = new URLSearchParams()
    
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.unreadOnly) params.append('unreadOnly', 'true')

    const queryString = params.toString()
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications'

    const response = await api.get<{ data: Notification[]; total: number; page: number; limit: number; totalPages: number }>(endpoint)
    
    // Extrair o array de notificações do objeto de resposta
    if (response.data && 'data' in response.data) {
      return {
        data: {
          data: Array.isArray(response.data.data) ? response.data.data : [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 20,
          totalPages: response.data.totalPages || 0,
        },
        error: response.error
      }
    }
    
    return {
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
      error: response.error || 'Formato de resposta inválido'
    }
  },

  /**
   * Obter contagem de notificações não lidas
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return api.get<{ unreadCount: number }>('/notifications/unread-count')
  },

  /**
   * Marcar notificação como lida
   */
  async markAsRead(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da notificação inválido' }
    }

    return api.put<{ message: string }>(`/notifications/${encodeURIComponent(id)}/read`)
  },

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    return api.put<{ message: string }>('/notifications/read-all')
  },

  /**
   * Deletar notificação
   */
  async deleteNotification(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da notificação inválido' }
    }

    return api.delete<{ message: string }>(`/notifications/${encodeURIComponent(id)}`)
  },

  /**
   * Obter preferências de notificação
   */
  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return api.get<NotificationPreferences>('/notifications/preferences')
  },

  /**
   * Atualizar preferências de notificação
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<ApiResponse<{ message: string }>> {
    return api.put<{ message: string }>('/notifications/preferences', preferences)
  },

  /**
   * Mapear tipo de notificação para tipo de toast
   */
  getToastType(type: NotificationType): 'info' | 'success' | 'warning' | 'error' {
    switch (type) {
      case 'event_reminder':
        return 'warning'
      case 'project_update':
      case 'verification':
        return 'success'
      case 'message':
      case 'favorite':
        return 'info'
      case 'review':
        return 'success'
      case 'system':
        return 'info'
      default:
        return 'info'
    }
  },
}



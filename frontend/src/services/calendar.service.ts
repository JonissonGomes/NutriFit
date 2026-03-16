// ============================================
// SERVIÇO DE CALENDÁRIO / EVENTOS
// ============================================

import { api, sanitizeInput } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type EventType = 'reuniao' | 'visita' | 'apresentacao' | 'consultoria' | 'outro'
export type EventStatus = 'confirmado' | 'pendente' | 'concluido' | 'cancelado'
export type EventLocation = 'escritorio' | 'cliente' | 'obra' | 'prefeitura' | 'outro'

export interface Event {
  id: string
  userId: string
  clientId?: string
  projectId?: string
  title: string
  description?: string
  date: Date
  time: string
  duration: number // minutos
  location: EventLocation
  locationAddress?: string
  type: EventType
  status: EventStatus
  reminder?: {
    enabled: boolean
    minutesBefore: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateEventRequest {
  title: string
  description?: string
  date: string
  time: string
  duration?: number
  location: EventLocation
  locationAddress?: string
  type: EventType
  clientId?: string
  projectId?: string
  reminder?: {
    enabled: boolean
    minutesBefore: number
  }
}

export interface EventFilters {
  startDate?: string
  endDate?: string
  status?: EventStatus
  type?: EventType
  clientId?: string
  page?: number
  limit?: number
}

// ============================================
// SERVIÇO DE CALENDÁRIO
// ============================================

export const calendarService = {
  /**
   * Listar eventos com filtros
   */
  async listEvents(filters?: EventFilters): Promise<ApiResponse<Event[]>> {
    const params = new URLSearchParams()

    if (filters) {
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/events?${queryString}` : '/events'

    const response = await api.get<{ data: Event[]; total: number; page: number; limit: number; totalPages: number }>(endpoint)
    
    // Extrair o array de eventos do objeto de resposta
    if (response.data && 'data' in response.data) {
      return {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        error: response.error
      }
    }
    
    // Fallback: se a resposta já for um array direto
    if (Array.isArray(response.data)) {
      return response as unknown as ApiResponse<Event[]>
    }
    
    // Se não for nem objeto com data nem array, retornar array vazio
    return {
      data: [],
      error: response.error || 'Formato de resposta inválido'
    }
  },

  /**
   * Criar evento
   */
  async createEvent(data: CreateEventRequest): Promise<ApiResponse<Event>> {
    if (!data.title || data.title.trim().length < 3) {
      return { error: 'Título deve ter pelo menos 3 caracteres' }
    }

    if (!data.date) {
      return { error: 'Data é obrigatória' }
    }

    if (!data.time) {
      return { error: 'Horário é obrigatório' }
    }

    const sanitizedData = {
      ...data,
      title: sanitizeInput(data.title.trim()),
      description: data.description ? sanitizeInput(data.description.trim()) : undefined,
      locationAddress: data.locationAddress ? sanitizeInput(data.locationAddress.trim()) : undefined,
    }

    return api.post<Event>('/events', sanitizedData)
  },

  /**
   * Obter evento por ID
   */
  async getEvent(id: string): Promise<ApiResponse<Event>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do evento inválido' }
    }

    return api.get<Event>(`/events/${encodeURIComponent(id)}`)
  },

  /**
   * Atualizar evento
   */
  async updateEvent(id: string, data: Partial<CreateEventRequest>): Promise<ApiResponse<Event>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do evento inválido' }
    }

    const sanitizedData = {
      ...data,
      title: data.title ? sanitizeInput(data.title.trim()) : undefined,
      description: data.description ? sanitizeInput(data.description.trim()) : undefined,
      locationAddress: data.locationAddress ? sanitizeInput(data.locationAddress.trim()) : undefined,
    }

    return api.put<Event>(`/events/${encodeURIComponent(id)}`, sanitizedData)
  },

  /**
   * Deletar evento
   */
  async deleteEvent(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do evento inválido' }
    }

    return api.delete<{ message: string }>(`/events/${encodeURIComponent(id)}`)
  },

  /**
   * Obter próximos eventos
   */
  async getUpcomingEvents(limit: number = 5): Promise<ApiResponse<Event[]>> {
    return api.get<Event[]>(`/events/upcoming?limit=${limit}`)
  },

  /**
   * Atualizar status do evento
   */
  async updateEventStatus(id: string, status: EventStatus): Promise<ApiResponse<Event>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do evento inválido' }
    }

    return api.put<Event>(`/events/${encodeURIComponent(id)}/status`, { status })
  },

  /**
   * Formatar data para exibição
   */
  formatEventDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
  },

  /**
   * Obter cor do status
   */
  getStatusColor(status: EventStatus): string {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-700'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-700'
      case 'concluido':
        return 'bg-gray-100 text-gray-700'
      case 'cancelado':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  },

  /**
   * Obter label do tipo
   */
  getTypeLabel(type: EventType): string {
    switch (type) {
      case 'reuniao':
        return 'Reunião'
      case 'visita':
        return 'Visita'
      case 'apresentacao':
        return 'Apresentação'
      case 'consultoria':
        return 'Consultoria'
      case 'outro':
        return 'Outro'
      default:
        return type
    }
  },
}



// ============================================
// SERVIÇO DE SERVIÇOS DO ARQUITETO
// ============================================

import { api, sanitizeInput } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type ServiceCategory = 
  | 'residencial'
  | 'comercial'
  | 'interiores'
  | 'reforma'
  | 'consultoria'
  | 'paisagismo'
  | 'outro'

export interface Service {
  id: string
  userId: string
  name: string
  description: string
  price: number
  duration: string
  category: ServiceCategory
  features: string[]
  active: boolean
  availability?: {
    daysOfWeek: number[]
    startTime: string
    endTime: string
  }
  pricing?: {
    type: 'fixed' | 'hourly' | 'per_sqm'
    minPrice?: number
    maxPrice?: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateServiceRequest {
  name: string
  description?: string
  price: number
  duration: string
  category: ServiceCategory
  features?: string[]
  availability?: {
    daysOfWeek: number[]
    startTime: string
    endTime: string
  }
  pricing?: {
    type: 'fixed' | 'hourly' | 'per_sqm'
    minPrice?: number
    maxPrice?: number
  }
}

export interface UpdateServiceRequest {
  name?: string
  description?: string
  price?: number
  duration?: string
  category?: ServiceCategory
  features?: string[]
  availability?: {
    daysOfWeek: number[]
    startTime: string
    endTime: string
  }
  pricing?: {
    type: 'fixed' | 'hourly' | 'per_sqm'
    minPrice?: number
    maxPrice?: number
  }
}

export interface ServiceFilters {
  active?: boolean
  page?: number
  limit?: number
}

export interface ServiceStats {
  total: number
  active: number
  inactive: number
  averagePrice: number
  totalValue: number
  byCategory: Record<string, number>
}

// ============================================
// SERVIÇO DE SERVIÇOS
// ============================================

export const servicesService = {
  /**
   * Listar serviços do arquiteto
   */
  async list(filters?: ServiceFilters): Promise<ApiResponse<PaginatedResponse<Service>>> {
    const params = new URLSearchParams()

    if (filters) {
      if (filters.active !== undefined) params.append('active', filters.active.toString())
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/services?${queryString}` : '/services'

    return api.get<PaginatedResponse<Service>>(endpoint)
  },

  /**
   * Criar novo serviço
   */
  async create(data: CreateServiceRequest): Promise<ApiResponse<Service>> {
    if (!data.name || data.name.trim().length < 3) {
      return { error: 'Nome deve ter pelo menos 3 caracteres' }
    }

    if (data.price < 0) {
      return { error: 'Preço não pode ser negativo' }
    }

    if (!data.duration || data.duration.trim().length === 0) {
      return { error: 'Duração é obrigatória' }
    }

    if (!data.category) {
      return { error: 'Categoria é obrigatória' }
    }

    const sanitizedData = {
      ...data,
      name: sanitizeInput(data.name.trim()),
      description: data.description ? sanitizeInput(data.description.trim()) : undefined,
    }

    return api.post<Service>('/services', sanitizedData)
  },

  /**
   * Obter serviço por ID
   */
  async getById(id: string): Promise<ApiResponse<Service>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do serviço inválido' }
    }

    return api.get<Service>(`/services/${encodeURIComponent(id)}`)
  },

  /**
   * Atualizar serviço
   */
  async update(id: string, data: UpdateServiceRequest): Promise<ApiResponse<Service>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do serviço inválido' }
    }

    const sanitizedData = {
      ...data,
      name: data.name ? sanitizeInput(data.name.trim()) : undefined,
      description: data.description ? sanitizeInput(data.description.trim()) : undefined,
    }

    return api.put<Service>(`/services/${encodeURIComponent(id)}`, sanitizedData)
  },

  /**
   * Deletar serviço
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do serviço inválido' }
    }

    return api.delete<{ message: string }>(`/services/${encodeURIComponent(id)}`)
  },

  /**
   * Alternar status ativo/inativo
   */
  async toggleActive(id: string): Promise<ApiResponse<{ message: string; service: Service }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do serviço inválido' }
    }

    return api.put<{ message: string; service: Service }>(`/services/${encodeURIComponent(id)}/toggle`, {})
  },

  /**
   * Obter estatísticas dos serviços
   */
  async getStats(): Promise<ApiResponse<ServiceStats>> {
    return api.get<ServiceStats>('/services/stats')
  },

  /**
   * Obter serviços públicos de um arquiteto
   */
  async getPublicServices(architectId: string): Promise<ApiResponse<Service[]>> {
    if (!architectId || typeof architectId !== 'string') {
      return { error: 'ID do arquiteto inválido' }
    }

    return api.get<Service[]>(`/public/architects/${encodeURIComponent(architectId)}/services`)
  },

  /**
   * Formatar preço para exibição
   */
  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  },

  /**
   * Obter label da categoria
   */
  getCategoryLabel(category: ServiceCategory): string {
    const labels: Record<ServiceCategory, string> = {
      residencial: 'Residencial',
      comercial: 'Comercial',
      interiores: 'Interiores',
      reforma: 'Reforma',
      consultoria: 'Consultoria',
      paisagismo: 'Paisagismo',
      outro: 'Outro',
    }
    return labels[category] || category
  },

  /**
   * Obter cor da categoria
   */
  getCategoryColor(category: ServiceCategory): string {
    const colors: Record<ServiceCategory, string> = {
      residencial: 'bg-blue-100 text-blue-700',
      comercial: 'bg-green-100 text-green-700',
      interiores: 'bg-purple-100 text-purple-700',
      reforma: 'bg-amber-100 text-amber-700',
      consultoria: 'bg-cyan-100 text-cyan-700',
      paisagismo: 'bg-emerald-100 text-emerald-700',
      outro: 'bg-gray-100 text-gray-700',
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  },
}

// ============================================
// SERVIÇO DE EXPLORAÇÃO / BUSCA DE ARQUITETOS
// ============================================

import { api } from './api'
import type {
  PublicProfile,
  PaginatedResponse,
  ApiResponse,
} from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface ArchitectSearchFilters {
  category?: string
  city?: string
  state?: string
  search?: string
  verified?: boolean
  minRating?: number
  lat?: number
  lng?: number
  radius?: number // km
  page?: number
  limit?: number
}

export interface NearbySearchParams {
  radius?: number
  limit?: number
  category?: string
}

// ============================================
// SERVIÇO DE EXPLORAÇÃO
// ============================================

export const exploreService = {
  /**
   * Buscar arquitetos com filtros
   */
  async searchArchitects(
    filters?: ArchitectSearchFilters
  ): Promise<ApiResponse<PaginatedResponse<PublicProfile>>> {
    const params = new URLSearchParams()

    if (filters) {
      if (filters.category) params.append('category', filters.category)
      if (filters.city) params.append('city', filters.city)
      if (filters.state) params.append('state', filters.state)
      if (filters.search) params.append('search', filters.search)
      if (filters.verified !== undefined) params.append('verified', String(filters.verified))
      if (filters.minRating) params.append('minRating', filters.minRating.toString())
      if (filters.lat) params.append('lat', filters.lat.toString())
      if (filters.lng) params.append('lng', filters.lng.toString())
      if (filters.radius) params.append('radius', filters.radius.toString())
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', Math.min(filters.limit, 50).toString())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/explore/nutritionists?${queryString}` : '/explore/nutritionists'

    return api.get<PaginatedResponse<PublicProfile>>(endpoint, { requiresAuth: false })
  },

  /**
   * Buscar arquitetos próximos (usa localização do usuário se autenticado)
   */
  async getNearbyArchitects(
    params?: NearbySearchParams
  ): Promise<ApiResponse<PublicProfile[]>> {
    const searchParams = new URLSearchParams()

    if (params) {
      if (params.radius) searchParams.append('radius', params.radius.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.category) searchParams.append('category', params.category)
    }

    const queryString = searchParams.toString()
    const endpoint = queryString
      ? `/explore/nutritionists/nearby?${queryString}`
      : '/explore/nutritionists/nearby'

    return api.get<PublicProfile[]>(endpoint, { requiresAuth: false })
  },

  /**
   * Obter perfil público por username
   */
  async getProfileByUsername(username: string): Promise<ApiResponse<PublicProfile>> {
    if (!username || typeof username !== 'string') {
      return { error: 'Username inválido' }
    }

    return api.get<PublicProfile>(
      `/explore/profile/${encodeURIComponent(username)}`,
      { requiresAuth: false }
    )
  },

  /**
   * Obter serviços públicos de um arquiteto
   */
  async getArchitectServices(architectId: string): Promise<ApiResponse<unknown[]>> {
    if (!architectId || typeof architectId !== 'string') {
      return { error: 'ID do arquiteto inválido' }
    }

    return api.get<unknown[]>(
      `/public/nutritionists/${encodeURIComponent(architectId)}/services`,
      { requiresAuth: false }
    )
  },

  /**
   * Obter reviews de um arquiteto
   */
  async getArchitectReviews(
    architectId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<unknown>>> {
    if (!architectId || typeof architectId !== 'string') {
      return { error: 'ID do arquiteto inválido' }
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    return api.get<PaginatedResponse<unknown>>(
      `/public/architects/${encodeURIComponent(architectId)}/reviews?${params}`,
      { requiresAuth: false }
    )
  },

  /**
   * Obter estatísticas de rating de um arquiteto
   */
  async getArchitectRating(architectId: string): Promise<ApiResponse<{
    average: number
    total: number
    distribution: Record<string, number>
  }>> {
    if (!architectId || typeof architectId !== 'string') {
      return { error: 'ID do arquiteto inválido' }
    }

    return api.get<{
      average: number
      total: number
      distribution: Record<string, number>
    }>(
      `/public/architects/${encodeURIComponent(architectId)}/rating`,
      { requiresAuth: false }
    )
  },

  /**
   * Formatar localização para exibição
   */
  formatLocation(profile: PublicProfile): string {
    if (!profile.location?.address) return 'Localização não informada'
    
    const { city, state } = profile.location.address
    if (city && state) return `${city}, ${state}`
    if (city) return city
    if (state) return state
    return 'Localização não informada'
  },

  /**
   * Formatar rating para exibição
   */
  formatRating(ratings: PublicProfile['ratings']): string {
    if (!ratings || ratings.total === 0) return 'Novo'
    return ratings.average.toFixed(1)
  },
}




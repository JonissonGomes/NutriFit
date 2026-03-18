// ============================================
// SERVIÇO DE FAVORITOS
// ============================================

import { api } from './api'
import type { PublicProfile, ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface Favorite {
  id: string
  clientId: string
  architectId: string
  architect?: PublicProfile
  createdAt: Date
}

// ============================================
// SERVIÇO DE FAVORITOS
// ============================================

export const favoritesService = {
  normalizeId: (id: unknown): string => {
    if (typeof id !== 'string') return ''
    return id.trim()
  },

  /**
   * Listar arquitetos favoritos
   */
  async listFavorites(page: number = 1, limit: number = 50): Promise<ApiResponse<PaginatedResponse<Favorite>>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    return api.get<PaginatedResponse<Favorite>>(`/favorites?${params.toString()}`)
  },

  /**
   * Adicionar arquiteto aos favoritos
   */
  async addFavorite(architectId: string): Promise<ApiResponse<Favorite>> {
    const id = this.normalizeId(architectId)
    if (!id) {
      return { error: 'ID do arquiteto inválido' }
    }

    return api.post<Favorite>(`/favorites/${encodeURIComponent(id)}`)
  },

  /**
   * Remover arquiteto dos favoritos
   */
  async removeFavorite(architectId: string): Promise<ApiResponse<{ message: string }>> {
    const id = this.normalizeId(architectId)
    if (!id) {
      return { error: 'ID do arquiteto inválido' }
    }

    return api.delete<{ message: string }>(`/favorites/${encodeURIComponent(id)}`)
  },

  /**
   * Verificar se arquiteto está nos favoritos
   */
  async checkFavorite(architectId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const id = this.normalizeId(architectId)
    if (!id) {
      return { error: 'ID do arquiteto inválido' }
    }

    return api.get<{ isFavorite: boolean }>(`/favorites/check/${encodeURIComponent(id)}`)
  },

  /**
   * Toggle favorito (adiciona se não tem, remove se tem)
   */
  async toggleFavorite(architectId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const checkResult = await this.checkFavorite(architectId)
    
    if (checkResult.error) {
      return { error: checkResult.error }
    }

    if (checkResult.data?.isFavorite) {
      const removeResult = await this.removeFavorite(architectId)
      if (removeResult.error) {
        return { error: removeResult.error }
      }
      return { data: { isFavorite: false } }
    } else {
      const addResult = await this.addFavorite(architectId)
      if (addResult.error) {
        return { error: addResult.error }
      }
      return { data: { isFavorite: true } }
    }
  },
}



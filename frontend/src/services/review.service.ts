// ============================================
// SERVIÇO DE AVALIAÇÕES
// ============================================

import { api } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface Review {
  id: string
  architectId: string
  clientId: string
  projectId?: string
  rating: number // 1-5
  comment?: string
  verified: boolean
  helpful: number
  createdAt: string
  updatedAt: string
  clientName?: string
  clientAvatar?: string
  projectTitle?: string
}

export interface ReviewWithDetails extends Review {
  clientName: string
  clientAvatar?: string
  projectTitle?: string
}

export interface CreateReviewRequest {
  architectId: string
  projectId?: string
  rating: number
  comment?: string
}

export interface UpdateReviewRequest {
  rating?: number
  comment?: string
}

export interface ArchitectRatingStats {
  averageRating: number
  totalReviews: number
  distribution: Record<string, number> // 1-5 estrelas
}

// ============================================
// SERVIÇO DE AVALIAÇÕES
// ============================================

export const reviewService = {
  /**
   * Criar uma nova avaliação
   */
  create: async (data: CreateReviewRequest): Promise<ApiResponse<Review>> => {
    return api.post<Review>('/reviews', data)
  },

  /**
   * Listar avaliações de um arquiteto
   */
  getByArchitect: async (
    architectId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ReviewWithDetails>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    return api.get<PaginatedResponse<ReviewWithDetails>>(
      `/reviews/architect/${architectId}?${params}`
    )
  },

  /**
   * Obter estatísticas de avaliação de um arquiteto
   */
  getArchitectStats: async (
    architectId: string
  ): Promise<ApiResponse<ArchitectRatingStats>> => {
    return api.get<ArchitectRatingStats>(`/reviews/architect/${architectId}/stats`)
  },

  /**
   * Atualizar uma avaliação
   */
  update: async (
    reviewId: string,
    data: UpdateReviewRequest
  ): Promise<ApiResponse<Review>> => {
    return api.put<Review>(`/reviews/${reviewId}`, data)
  },

  /**
   * Deletar uma avaliação
   */
  delete: async (reviewId: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/reviews/${reviewId}`)
  },

  /**
   * Marcar avaliação como útil
   */
  markHelpful: async (reviewId: string): Promise<ApiResponse<void>> => {
    return api.post<void>(`/reviews/${reviewId}/helpful`, {})
  },
}



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
  nutritionistId: string
  patientId: string
  mealPlanId?: string
  rating: number // 1-5
  comment?: string
  verified: boolean
  helpful: number
  createdAt: string
  updatedAt: string
  patientName?: string
  patientAvatar?: string
  mealPlanTitle?: string

  // Campos legados (para não quebrar telas antigas)
  architectId?: string
  clientId?: string
  projectId?: string
  clientName?: string
  clientAvatar?: string
  projectTitle?: string
}

export interface ReviewWithDetails extends Review {
  patientName: string
  patientAvatar?: string
  mealPlanTitle?: string
}

export interface CreateReviewRequest {
  nutritionistId: string
  mealPlanId: string
  rating: number
  comment: string
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
   * Listar avaliações de um profissional (público)
   */
  getByNutritionist: async (
    nutritionistId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ReviewWithDetails>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    return api.get<PaginatedResponse<ReviewWithDetails>>(
      `/public/nutritionists/${encodeURIComponent(nutritionistId)}/reviews?${params}`
    )
  },

  /**
   * Obter estatísticas de avaliação de um profissional (público)
   */
  getNutritionistStats: async (
    nutritionistId: string
  ): Promise<ApiResponse<ArchitectRatingStats>> => {
    return api.get<ArchitectRatingStats>(
      `/public/nutritionists/${encodeURIComponent(nutritionistId)}/rating`
    )
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
   * Remover avaliação como profissional (somente <=2 estrelas)
   */
  deleteAsNutritionist: async (reviewId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.delete<{ message: string }>(`/reviews/${encodeURIComponent(reviewId)}/as-nutritionist`)
  },

  /**
   * Marcar avaliação como útil
   */
  markHelpful: async (reviewId: string): Promise<ApiResponse<void>> => {
    return api.post<void>(`/reviews/${reviewId}/helpful`, {})
  },

  // Aliases legados
  getByArchitect: async (architectId: string, page = 1, limit = 10) =>
    reviewService.getByNutritionist(architectId, page, limit),
  getArchitectStats: async (architectId: string) => reviewService.getNutritionistStats(architectId),
}



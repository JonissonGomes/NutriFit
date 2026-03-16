import { api } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type BadgeType =
  | 'verified'
  | 'top_rated'
  | 'popular'
  | 'expert'
  | 'prolific'
  | 'blogger'
  | 'responsive'
  | 'pioneer'
  | 'contributor'
  | 'milestone'
  | 'seasonal'
  | 'premium'

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface BadgeCriteria {
  minProjects?: number
  minReviews?: number
  minRating?: number
  minFavorites?: number
  minAnswers?: number
  minBestAnswers?: number
  minBlogPosts?: number
  minResponseTime?: number
  minDaysActive?: number
  requireVerified?: boolean
  requirePremium?: boolean
}

export interface BadgeDefinition {
  id: string
  type: BadgeType
  name: string
  description: string
  icon: string
  color: string
  level: BadgeLevel
  criteria: BadgeCriteria
  points: number
  isActive: boolean
  createdAt: string
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  badge?: BadgeDefinition
  awardedAt: string
  awardedBy?: string
  reason?: string
  isDisplayed: boolean
  displayOrder: number
}

export interface UserBadgeSummary {
  totalBadges: number
  totalPoints: number
  badges: UserBadge[]
  featured: UserBadge[]
  byLevel: Record<BadgeLevel, number>
}

export interface BadgeProgress {
  badge: BadgeDefinition
  isUnlocked: boolean
  progress: number
  currentValue: number
  requiredValue: number
  remainingValue: number
  nextMilestone: string
}

// ============================================
// MAPA DE CORES POR NÍVEL
// ============================================

export const BADGE_LEVEL_COLORS: Record<BadgeLevel, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
}

export const BADGE_LEVEL_LABELS: Record<BadgeLevel, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  diamond: 'Diamante',
}

// ============================================
// SERVIÇO DE BADGES
// ============================================

export const badgeService = {
  /**
   * Lista todas as definições de badges disponíveis (público)
   */
  getAllBadges: async (): Promise<ApiResponse<BadgeDefinition[]>> => {
    return api.get<BadgeDefinition[]>('/public/badges')
  },

  /**
   * Busca um badge por ID (público)
   */
  getBadgeById: async (id: string): Promise<ApiResponse<BadgeDefinition>> => {
    return api.get<BadgeDefinition>(`/public/badges/${id}`)
  },

  /**
   * Lista os badges de um usuário específico (público - apenas exibidos)
   */
  getUserBadges: async (userId: string): Promise<ApiResponse<UserBadge[]>> => {
    return api.get<UserBadge[]>(`/public/users/${userId}/badges`)
  },

  /**
   * Lista meus badges (autenticado)
   */
  getMyBadges: async (): Promise<ApiResponse<UserBadge[]>> => {
    return api.get<UserBadge[]>('/badges/my')
  },

  /**
   * Busca resumo dos meus badges (autenticado)
   */
  getMyBadgeSummary: async (): Promise<ApiResponse<UserBadgeSummary>> => {
    return api.get<UserBadgeSummary>('/badges/my/summary')
  },

  /**
   * Verifica e recebe novos badges automaticamente (autenticado)
   */
  checkAndAwardBadges: async (): Promise<ApiResponse<{ newBadges: UserBadge[]; count: number }>> => {
    return api.post<{ newBadges: UserBadge[]; count: number }>('/badges/check')
  },

  /**
   * Atualiza configurações de exibição de um badge (autenticado)
   */
  updateBadgeDisplay: async (badgeId: string, isDisplayed: boolean, displayOrder: number): Promise<ApiResponse<{ success: boolean }>> => {
    return api.put<{ success: boolean }>(`/badges/${badgeId}/display`, {
      isDisplayed,
      displayOrder,
    })
  },
}

export default badgeService


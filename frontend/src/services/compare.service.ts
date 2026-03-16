import { api } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface SocialLink {
  username: string
  url: string
}

export interface SocialLinks {
  instagram?: SocialLink
  facebook?: SocialLink
}

export interface ArchitectComparisonData {
  id: string
  displayName: string
  username: string
  avatarURL?: string
  bio?: string
  specialty?: string
  specialties?: string[]
  city?: string
  state?: string
  isVerified: boolean
  projectsCount: number
  reviewsCount: number
  averageRating: number
  favoritesCount: number
  answersCount: number
  responseTime?: string
  yearsExperience?: number
  priceRange?: string
  minPrice?: number
  maxPrice?: number
  servicesCount: number
  badgesCount: number
  portfolioImages?: string[]
  social?: SocialLinks
  website?: string
  email?: string
  phone?: string
}

export interface ComparisonMetrics {
  highestRated: string
  mostProjects: string
  mostReviews: string
  fastestResponse: string
  mostExperienced: string
  bestValue: string
  averageRating: number
  averageProjects: number
}

export interface ComparisonResult {
  architects: ArchitectComparisonData[]
  metrics: ComparisonMetrics
}

// ============================================
// SERVIÇO DE COMPARAÇÃO
// ============================================

export const compareService = {
  /**
   * Compara múltiplos arquitetos (2-4)
   */
  compare: async (architectIds: string[]): Promise<ApiResponse<ComparisonResult>> => {
    if (architectIds.length < 2) {
      return {
        error: 'Mínimo de 2 arquitetos para comparação',
      }
    }

    if (architectIds.length > 4) {
      return {
        error: 'Máximo de 4 arquitetos para comparação',
      }
    }

    // Usar query params
    const idsParam = architectIds.join(',')
    return api.get<ComparisonResult>(`/explore/architects/compare?ids=${idsParam}`)
  },

  /**
   * Adiciona um arquiteto à lista de comparação local
   */
  addToCompare: (architectId: string): string[] => {
    const currentList = compareService.getCompareList()
    if (currentList.length >= 4) {
      return currentList
    }
    if (currentList.includes(architectId)) {
      return currentList
    }
    const newList = [...currentList, architectId]
    localStorage.setItem('arck_compare_list', JSON.stringify(newList))
    return newList
  },

  /**
   * Remove um arquiteto da lista de comparação local
   */
  removeFromCompare: (architectId: string): string[] => {
    const currentList = compareService.getCompareList()
    const newList = currentList.filter(id => id !== architectId)
    localStorage.setItem('arck_compare_list', JSON.stringify(newList))
    return newList
  },

  /**
   * Obtém a lista de comparação local
   */
  getCompareList: (): string[] => {
    try {
      const stored = localStorage.getItem('arck_compare_list')
      if (stored) {
        return JSON.parse(stored) as string[]
      }
    } catch {
      // Ignorar erros de parsing
    }
    return []
  },

  /**
   * Limpa a lista de comparação local
   */
  clearCompareList: (): void => {
    localStorage.removeItem('arck_compare_list')
  },

  /**
   * Verifica se um arquiteto está na lista de comparação
   */
  isInCompareList: (architectId: string): boolean => {
    return compareService.getCompareList().includes(architectId)
  },
}

export default compareService


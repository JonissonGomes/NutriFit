import { api } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type AnalyticsEventType =
  | 'profile_view'
  | 'project_view'
  | 'contact_click'
  | 'website_click'
  | 'social_click'
  | 'favorite_add'
  | 'favorite_remove'
  | 'message_sent'
  | 'service_view'
  | 'blog_post_view'
  | 'question_view'
  | 'search_appearance'
  | 'search_click'

export type AnalyticsSource =
  | 'direct'
  | 'search'
  | 'social'
  | 'referral'
  | 'email'
  | 'paid'
  | 'internal'

export interface SourceStat {
  source: AnalyticsSource
  count: number
  percent: number
}

export interface DeviceStat {
  device: string
  count: number
  percent: number
}

export interface LocationStat {
  country: string
  city?: string
  count: number
  percent: number
}

export interface ProjectAnalytics {
  projectId: string
  title: string
  views: number
  clicks: number
}

export interface DailyAnalyticsStat {
  date: string
  profileViews: number
  projectViews: number
  contactClicks: number
  messages: number
}

export interface AnalyticsOverview {
  totalProfileViews: number
  totalProjectViews: number
  totalContactClicks: number
  totalUniqueVisitors: number
  totalFavorites: number
  totalMessages: number
  searchAppearances: number
  engagementRate: number
  sourceBreakdown: SourceStat[]
  deviceBreakdown: DeviceStat[]
  topProjects: ProjectAnalytics[]
  locationBreakdown: LocationStat[]
  dailyTrend: DailyAnalyticsStat[]
}

export interface PercentageChanges {
  profileViews: number
  projectViews: number
  contactClicks: number
  uniqueVisitors: number
  favorites: number
  messages: number
}

export interface ComparisonStats {
  current: AnalyticsOverview
  previous: AnalyticsOverview
  changes: PercentageChanges
}

export interface TrackEventRequest {
  userId: string
  eventType: AnalyticsEventType
  targetId?: string
  targetType?: string
  source?: AnalyticsSource
  referrer?: string
  searchQuery?: string
  metadata?: Record<string, unknown>
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'today' | 'yesterday' | 'this_week' | 'this_month'

// ============================================
// SERVIÇO DE ANALYTICS
// ============================================

export const analyticsService = {
  /**
   * Busca visão geral de analytics
   */
  getOverview: async (period: AnalyticsPeriod = '30d'): Promise<ApiResponse<AnalyticsOverview>> => {
    return api.get<AnalyticsOverview>(`/analytics/overview?period=${period}`)
  },

  /**
   * Busca comparação entre períodos
   */
  getComparison: async (period: AnalyticsPeriod = '30d'): Promise<ApiResponse<ComparisonStats>> => {
    return api.get<ComparisonStats>(`/analytics/comparison?period=${period}`)
  },

  /**
   * Busca analytics de um projeto específico
   */
  getProjectAnalytics: async (projectId: string, period: AnalyticsPeriod = '30d'): Promise<ApiResponse<ProjectAnalytics>> => {
    return api.get<ProjectAnalytics>(`/analytics/projects/${projectId}?period=${period}`)
  },

  /**
   * Rastreia um evento de analytics
   */
  trackEvent: async (data: TrackEventRequest): Promise<ApiResponse<{ success: boolean }>> => {
    return api.post<{ success: boolean }>('/analytics/track', data)
  },

  /**
   * Rastreia visualização de perfil
   */
  trackProfileView: async (userId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'profile_view',
        referrer: document.referrer,
      })
    } catch {
      // Silenciosamente falha - não queremos quebrar a UX por causa de analytics
    }
  },

  /**
   * Rastreia visualização de projeto
   */
  trackProjectView: async (userId: string, projectId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'project_view',
        targetId: projectId,
        targetType: 'project',
        referrer: document.referrer,
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia clique no contato
   */
  trackContactClick: async (userId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'contact_click',
        referrer: document.referrer,
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia clique no website
   */
  trackWebsiteClick: async (userId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'website_click',
        referrer: document.referrer,
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia clique em rede social
   */
  trackSocialClick: async (userId: string, platform: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'social_click',
        metadata: { platform },
        referrer: document.referrer,
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia adição de favorito
   */
  trackFavoriteAdd: async (userId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'favorite_add',
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia remoção de favorito
   */
  trackFavoriteRemove: async (userId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'favorite_remove',
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia visualização de post de blog
   */
  trackBlogPostView: async (userId: string, postId: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'blog_post_view',
        targetId: postId,
        targetType: 'blog_post',
        referrer: document.referrer,
      })
    } catch {
      // Silenciosamente falha
    }
  },

  /**
   * Rastreia aparição em busca
   */
  trackSearchAppearance: async (userId: string, searchQuery: string): Promise<void> => {
    try {
      await analyticsService.trackEvent({
        userId,
        eventType: 'search_appearance',
        searchQuery,
      })
    } catch {
      // Silenciosamente falha
    }
  },
}

export default analyticsService


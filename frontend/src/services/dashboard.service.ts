// ============================================
// SERVIÇO DE DASHBOARD
// ============================================

import { api } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface ArchitectStats {
  totalViews: number
  totalProjects: number
  totalClients: number
  monthlyRevenue: number
  viewsChange: number
  projectsChange: number
  clientsChange: number
  revenueChange: number
  activeProjects: number
  pendingEvents: number
  unreadMessages: number
  totalServices: number
  activeServices: number
}

export interface RecentProject {
  id: string
  title: string
  status: string
  coverImage?: string
  views: number
  filesCount: number
  updatedAt: string
}

export interface UpcomingEvent {
  id: string
  title: string
  date: string
  time: string
  type: string
  status: string
  location: string
  clientName?: string
}

export interface ClientStats {
  activeProjects: number
  favoriteArchitects: number
  upcomingMeetings: number
  completedProjects: number
  totalMessages: number
  unreadMessages: number
}

export interface ClientProject {
  id: string
  title: string
  status: string
  architectName?: string
  coverImage?: string
  progress: number
  updatedAt: string
}

// ============================================
// SERVIÇO
// ============================================

export const dashboardService = {
  // ============================================
  // DASHBOARD DO ARQUITETO
  // ============================================

  /**
   * Obter estatísticas do dashboard do arquiteto
   */
  async getArchitectStats(): Promise<ApiResponse<ArchitectStats>> {
    return api.get<ArchitectStats>('/architect/dashboard/stats')
  },

  /**
   * Obter projetos recentes do arquiteto
   */
  async getArchitectRecentProjects(limit = 5): Promise<ApiResponse<RecentProject[]>> {
    return api.get<RecentProject[]>(`/architect/dashboard/recent-projects?limit=${limit}`)
  },

  /**
   * Obter próximos eventos do arquiteto
   */
  async getArchitectUpcomingEvents(limit = 5): Promise<ApiResponse<UpcomingEvent[]>> {
    return api.get<UpcomingEvent[]>(`/architect/dashboard/upcoming-events?limit=${limit}`)
  },

  // ============================================
  // DASHBOARD DO CLIENTE
  // ============================================

  /**
   * Obter estatísticas do dashboard do cliente
   */
  async getClientStats(): Promise<ApiResponse<ClientStats>> {
    return api.get<ClientStats>('/client/dashboard/stats')
  },

  /**
   * Obter projetos do cliente
   */
  async getClientProjects(limit = 5): Promise<ApiResponse<ClientProject[]>> {
    return api.get<ClientProject[]>(`/client/dashboard/projects?limit=${limit}`)
  },

  /**
   * Obter próximos agendamentos do cliente
   */
  async getClientAppointments(limit = 5): Promise<ApiResponse<UpcomingEvent[]>> {
    return api.get<UpcomingEvent[]>(`/client/dashboard/appointments?limit=${limit}`)
  },
}




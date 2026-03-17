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
  async getNutritionistStats(): Promise<ApiResponse<ArchitectStats>> {
    return api.get<ArchitectStats>('/nutritionist/dashboard/stats')
  },

  /**
   * Obter projetos recentes do arquiteto
   */
  async getNutritionistRecentMealPlans(limit = 5): Promise<ApiResponse<any[]>> {
    return api.get<any[]>(`/nutritionist/dashboard/recent-meal-plans?limit=${limit}`)
  },

  /**
   * Obter próximos eventos do arquiteto
   */
  async getNutritionistUpcomingEvents(limit = 5): Promise<ApiResponse<UpcomingEvent[]>> {
    return api.get<UpcomingEvent[]>(`/nutritionist/dashboard/upcoming-events?limit=${limit}`)
  },

  // Compatibilidade com nomes antigos (arquitetura)
  async getArchitectStats(): Promise<ApiResponse<ArchitectStats>> {
    return this.getNutritionistStats()
  },

  async getArchitectRecentProjects(limit = 5): Promise<ApiResponse<any[]>> {
    return this.getNutritionistRecentMealPlans(limit)
  },

  async getArchitectUpcomingEvents(limit = 5): Promise<ApiResponse<UpcomingEvent[]>> {
    return this.getNutritionistUpcomingEvents(limit)
  },

  // ============================================
  // DASHBOARD DO CLIENTE
  // ============================================

  /**
   * Obter estatísticas do dashboard do cliente
   */
  async getPatientStats(): Promise<ApiResponse<ClientStats>> {
    return api.get<ClientStats>('/patient/dashboard/stats')
  },

  /**
   * Obter projetos do cliente
   */
  async getPatientMealPlans(limit = 5): Promise<ApiResponse<any[]>> {
    return api.get<any[]>(`/patient/dashboard/meal-plans?limit=${limit}`)
  },

  /**
   * Obter próximos agendamentos do cliente
   */
  async getPatientAppointments(limit = 5): Promise<ApiResponse<UpcomingEvent[]>> {
    return api.get<UpcomingEvent[]>(`/patient/dashboard/appointments?limit=${limit}`)
  },

  // Compatibilidade com nomes antigos (cliente)
  async getClientStats(): Promise<ApiResponse<ClientStats>> {
    return this.getPatientStats()
  },

  async getClientProjects(limit = 5): Promise<ApiResponse<any[]>> {
    return this.getPatientMealPlans(limit)
  },

  async getClientAppointments(limit = 5): Promise<ApiResponse<UpcomingEvent[]>> {
    return this.getPatientAppointments(limit)
  },
}




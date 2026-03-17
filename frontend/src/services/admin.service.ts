import { api } from './api'
import type { ApiResponse } from '../types/api'

export interface AdminOverview {
  totalUsers: number
  totalNutritionists: number
  totalPatients: number
}

export interface AdminNutritionistRow {
  id: string
  name: string
  email: string
  plan: string
  createdAt: string
  updatedAt: string
}

export interface AdminNutritionistsResponse {
  data: AdminNutritionistRow[]
  total: number
  page: number
  limit: number
}

export const adminService = {
  async overview(): Promise<ApiResponse<{ data: AdminOverview }>> {
    return api.get(`/admin/overview`)
  },

  async listNutritionists(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<AdminNutritionistsResponse>> {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search) q.set('search', params.search)
    const qs = q.toString()
    return api.get(`/admin/nutritionists${qs ? `?${qs}` : ''}`)
  },
}


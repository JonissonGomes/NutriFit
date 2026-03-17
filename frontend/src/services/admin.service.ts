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

export interface AdminUserRow {
  id: string
  name: string
  email: string
  role: string
  plan: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface AdminNutritionistsResponse {
  data: AdminNutritionistRow[]
  total: number
  page: number
  limit: number
}

export interface AdminUsersResponse {
  data: AdminUserRow[]
  total: number
  page: number
  limit: number
}

export interface AdminUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  plan?: string
  status?: string
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

  async listUsers(params?: AdminUsersParams): Promise<ApiResponse<AdminUsersResponse>> {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search) q.set('search', params.search)
    if (params?.role) q.set('role', params.role)
    if (params?.plan) q.set('plan', params.plan)
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return api.get(`/admin/users${qs ? `?${qs}` : ''}`)
  },

  async updateUserPlan(userId: string, plan: string): Promise<ApiResponse<{ message: string }>> {
    return api.put(`/admin/users/${encodeURIComponent(userId)}/plan`, { plan })
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<ApiResponse<{ message: string; status: string }>> {
    return api.put(`/admin/users/${encodeURIComponent(userId)}/status`, { status })
  },
}


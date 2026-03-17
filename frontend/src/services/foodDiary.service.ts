import { api } from './api'
import type { ApiResponse, FoodDiaryEntry } from '../types/api'

export interface FoodDiaryFilters {
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  limit?: number
}

export const foodDiaryService = {
  async listByPatient(patientId: string, filters?: FoodDiaryFilters): Promise<ApiResponse<{ data: FoodDiaryEntry[] }>> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.set('startDate', filters.startDate)
    if (filters?.endDate) params.set('endDate', filters.endDate)
    if (filters?.limit) params.set('limit', String(filters.limit))

    const qs = params.toString()
    const endpoint = qs
      ? `/food-diary/${encodeURIComponent(patientId)}?${qs}`
      : `/food-diary/${encodeURIComponent(patientId)}`

    return api.get(endpoint)
  },

  async create(entry: Partial<FoodDiaryEntry>): Promise<ApiResponse<{ data: FoodDiaryEntry }>> {
    return api.post(`/food-diary`, entry)
  },

  async uploadPhoto(entryId: string, file: File): Promise<ApiResponse<{ data: FoodDiaryEntry }>> {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/food-diary/${encodeURIComponent(entryId)}/photo`, form)
  },

  async analyzePhoto(entryId: string): Promise<ApiResponse<unknown>> {
    return api.post(`/food-diary/${encodeURIComponent(entryId)}/ai-analyze`, {})
  },

  async addNutritionistComment(entryId: string, comment: string): Promise<ApiResponse<{ message: string }>> {
    return api.put(`/food-diary/${encodeURIComponent(entryId)}/comment`, { comment })
  },
}


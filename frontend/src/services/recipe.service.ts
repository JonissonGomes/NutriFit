import { api } from './api'
import type { ApiResponse } from '../types/api'

export interface Recipe {
  id: string
  nutritionistId?: string
  title: string
  description?: string
  ingredients?: string[]
  steps?: string[]
  mealGroups?: string[]
  filters?: string[]
  calories?: number
  imageUrls?: string[]
  isPublic: boolean
  patientIds?: string[]
  mealPlanIds?: string[]
}

export const recipeService = {
  async listMine(): Promise<ApiResponse<{ data: Recipe[] }>> {
    return api.get('/recipes')
  },
  async create(payload: Partial<Recipe>): Promise<ApiResponse<{ data: Recipe }>> {
    return api.post('/recipes', payload)
  },
  async update(id: string, payload: Partial<Recipe>): Promise<ApiResponse<{ data: Recipe }>> {
    return api.put(`/recipes/${encodeURIComponent(id)}`, payload)
  },
  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/recipes/${encodeURIComponent(id)}`)
  },
  async listPublicByNutritionist(nutritionistId: string): Promise<ApiResponse<{ data: Recipe[] }>> {
    return api.get(`/public/recipes/nutritionist/${encodeURIComponent(nutritionistId)}`)
  },
  async uploadImage(id: string, file: File): Promise<ApiResponse<{ data: Recipe }>> {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/recipes/${encodeURIComponent(id)}/images`, form)
  },
}


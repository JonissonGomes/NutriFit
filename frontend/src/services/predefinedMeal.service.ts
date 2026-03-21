import { api } from './api'
import type { ApiResponse } from '../types/api'

export interface PredefinedMeal {
  id: string
  name: string
  calories?: number
  mealGroups?: string[]
  filters?: string[]
}

export const predefinedMealService = {
  async list(query?: string, group?: string): Promise<ApiResponse<{ data: PredefinedMeal[] }>> {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (group) params.set('group', group)
    const qs = params.toString()
    return api.get(qs ? `/predefined-meals?${qs}` : '/predefined-meals')
  },
}


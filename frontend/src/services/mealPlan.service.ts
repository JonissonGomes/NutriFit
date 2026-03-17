import { api } from './api'
import type {
  ApiResponse,
  PaginatedResponse,
  MealPlan,
  CreateMealPlanRequest,
  UpdateMealPlanRequest,
  MealPlanFilters,
} from '../types/api'

export interface MealPlanStats {
  mealsCount: number
  foodsCount: number
  totalMacros?: MealPlan['totalMacros']
  status: MealPlan['status']
  category: MealPlan['category']
}

export interface GenerateMealPlanAIRequest {
  calories: number
  proteins: number
  carbohydrates: number
  fats: number
  mealsPerDay: number
  restrictions?: string[]
  preferences?: string[]
}

export const mealPlanService = {
  async list(filters?: MealPlanFilters & { patientId?: string }): Promise<ApiResponse<PaginatedResponse<MealPlan>>> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.category) params.set('category', filters.category)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.limit) params.set('limit', String(filters.limit))
    if (filters?.patientId) params.set('patientId', filters.patientId)

    const qs = params.toString()
    const endpoint = qs ? `/meal-plans?${qs}` : '/meal-plans'
    return api.get<PaginatedResponse<MealPlan>>(endpoint)
  },

  async get(id: string): Promise<ApiResponse<MealPlan>> {
    return api.get<MealPlan>(`/meal-plans/${encodeURIComponent(id)}`)
  },

  async create(payload: CreateMealPlanRequest): Promise<ApiResponse<{ data: MealPlan } | MealPlan>> {
    return api.post(`/meal-plans`, payload)
  },

  async update(id: string, payload: UpdateMealPlanRequest): Promise<ApiResponse<{ data: MealPlan } | MealPlan>> {
    return api.put(`/meal-plans/${encodeURIComponent(id)}`, payload)
  },

  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/meal-plans/${encodeURIComponent(id)}`)
  },

  async updateStatus(id: string, status: MealPlan['status']): Promise<ApiResponse<{ data: MealPlan } | MealPlan>> {
    return api.put(`/meal-plans/${encodeURIComponent(id)}/status`, { status })
  },

  async getStats(id: string): Promise<ApiResponse<{ data: MealPlanStats } | MealPlanStats>> {
    return api.get(`/meal-plans/${encodeURIComponent(id)}/stats`)
  },

  async generateWithAI(req: GenerateMealPlanAIRequest): Promise<ApiResponse<MealPlan>> {
    return api.post<MealPlan>(`/meal-plans/ai-generate`, req)
  },

  async analyzeWithAI(id: string): Promise<ApiResponse<unknown>> {
    return api.post(`/meal-plans/${encodeURIComponent(id)}/ai-analyze`, {})
  },

  async getFoodSubstitutions(mealPlanId: string, foodId: string): Promise<ApiResponse<unknown>> {
    return api.get(`/meal-plans/${encodeURIComponent(mealPlanId)}/substitutions/${encodeURIComponent(foodId)}`)
  },
}


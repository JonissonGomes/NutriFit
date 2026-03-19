import { api } from './api'
import type { ApiResponse, Anthropometric } from '../types/api'

export const anthropometricService = {
  async listByPatient(patientId: string, limit = 50): Promise<ApiResponse<{ data: Anthropometric[] }>> {
    return api.get(`/anthropometric/${encodeURIComponent(patientId)}?limit=${encodeURIComponent(limit)}`)
  },
}


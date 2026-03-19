import { api } from './api'
import type { ApiResponse } from '../types/api'

export interface Patient {
  id: string
  nutritionistId: string
  userId?: string
  name: string
  email?: string
  phone?: string
  notes?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreatePatientRequest {
  userId?: string
  name: string
  email?: string
  phone?: string
  notes?: string
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  isActive?: boolean
}

export interface PlatformPatient {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
}

export const patientService = {
  async list(): Promise<ApiResponse<{ data: Patient[] }>> {
    return api.get(`/patients`)
  },

  async searchPlatform(query: string, limit = 10): Promise<ApiResponse<{ data: PlatformPatient[] }>> {
    const q = query.trim()
    return api.get(`/patients/search-platform?query=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`)
  },

  async create(payload: CreatePatientRequest): Promise<ApiResponse<{ data: Patient }>> {
    return api.post(`/patients`, payload)
  },

  async get(id: string): Promise<ApiResponse<{ data: Patient }>> {
    return api.get(`/patients/${encodeURIComponent(id)}`)
  },

  async update(id: string, payload: UpdatePatientRequest): Promise<ApiResponse<{ data: Patient }>> {
    return api.put(`/patients/${encodeURIComponent(id)}`, payload)
  },

  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/patients/${encodeURIComponent(id)}`)
  },

  async importCSV(file: File): Promise<ApiResponse<{ message: string; created: number; skipped: number; errors: string[] }>> {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/patients/import`, form)
  },
}


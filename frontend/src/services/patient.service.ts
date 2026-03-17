import { api } from './api'
import type { ApiResponse } from '../types/api'

export interface Patient {
  id: string
  nutritionistId: string
  name: string
  email?: string
  phone?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreatePatientRequest {
  name: string
  email?: string
  phone?: string
  notes?: string
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export const patientService = {
  async list(): Promise<ApiResponse<{ data: Patient[] }>> {
    return api.get(`/patients`)
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


import { api } from './api'
import type {
  ApiResponse,
  Anamnesis,
  FormTemplate,
  AnamnesisAnswer,
} from '../types/api'

export const anamnesisService = {
  async listTemplates(): Promise<ApiResponse<{ data: FormTemplate[] }>> {
    return api.get(`/anamnesis/templates`)
  },

  async createTemplate(template: FormTemplate): Promise<ApiResponse<{ data: FormTemplate }>> {
    return api.post(`/anamnesis/templates`, template)
  },

  async getByPatient(patientId: string): Promise<ApiResponse<{ data: Anamnesis }>> {
    return api.get(`/anamnesis/${encodeURIComponent(patientId)}`)
  },

  async submitAnswers(patientId: string, answers: AnamnesisAnswer[]): Promise<ApiResponse<{ data: Anamnesis }>> {
    return api.post(`/anamnesis/${encodeURIComponent(patientId)}/answers`, { answers })
  },

  async generateAISummary(anamnesisId: string): Promise<ApiResponse<{ data: { summary: string } }>> {
    return api.post(`/anamnesis/${encodeURIComponent(anamnesisId)}/ai-summary`, {})
  },
}


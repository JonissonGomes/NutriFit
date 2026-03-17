import { api } from './api'
import type { ApiResponse } from '../types/api'

export type LabExamType = 'blood' | 'urine' | 'stool' | 'hormonal' | 'vitamin' | 'other'

export interface LabExamAIAnalysis {
  summary: string
  findings: string[]
  recommendations: string[]
  concerns?: string[]
  analyzedAt: string
}

export interface LabExam {
  id: string
  patientId: string
  date: string
  type: LabExamType
  fileUrl: string
  rawText?: string
  aiAnalysis?: LabExamAIAnalysis
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateLabExamRequest {
  patientId: string
  date: string
  type: LabExamType
  notes?: string
  rawText?: string
}

export const labExamService = {
  async listByPatient(patientId: string, limit = 50): Promise<ApiResponse<{ data: LabExam[] }>> {
    return api.get(`/lab-exams/${encodeURIComponent(patientId)}?limit=${limit}`)
  },

  async create(payload: CreateLabExamRequest): Promise<ApiResponse<{ data: LabExam }>> {
    return api.post(`/lab-exams`, payload)
  },

  async uploadFile(id: string, file: File): Promise<ApiResponse<{ data: LabExam }>> {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/lab-exams/${encodeURIComponent(id)}/upload`, form)
  },

  async analyzeWithAI(id: string): Promise<ApiResponse<{ data: LabExam }>> {
    return api.post(`/lab-exams/${encodeURIComponent(id)}/ai-analyze`, {})
  },

  async update(id: string, updates: Partial<CreateLabExamRequest>): Promise<ApiResponse<{ data: LabExam }>> {
    return api.put(`/lab-exams/${encodeURIComponent(id)}`, updates)
  },

  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/lab-exams/${encodeURIComponent(id)}`)
  },
}


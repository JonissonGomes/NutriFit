import { api } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type QuestionCategory = 
  | 'materiais'
  | 'projeto'
  | 'reforma'
  | 'interiores'
  | 'orcamento'
  | 'legislacao'
  | 'outro'

export type QuestionStatus = 'open' | 'answered' | 'closed'

export interface Answer {
  id: string
  architectId: string
  architectName: string
  architectAvatar?: string
  content: string
  helpful: number
  helpfulBy?: string[]
  isBestAnswer: boolean
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  clientId: string
  clientName: string
  architectId?: string
  title: string
  content: string
  category: QuestionCategory
  tags?: string[]
  answers: Answer[]
  answerCount: number
  status: QuestionStatus
  views: number
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionRequest {
  title: string
  content: string
  category: QuestionCategory
  tags?: string[]
  architectId?: string
}

export interface CreateAnswerRequest {
  content: string
}

export interface QuestionFilters {
  category?: QuestionCategory
  status?: QuestionStatus
  architectId?: string
  clientId?: string
  search?: string
  featured?: boolean
  page?: number
  limit?: number
}

export interface QuestionStats {
  totalQuestions: number
  totalAnswered: number
  totalOpen: number
  totalAnswers: number
  myQuestions?: number
  myAnswers?: number
}

// ============================================
// CATEGORIAS DISPONÍVEIS
// ============================================

export const QUESTION_CATEGORIES: { value: QuestionCategory; label: string; description: string }[] = [
  { value: 'materiais', label: 'Nutrição clínica', description: 'Dúvidas sobre alimentação e saúde no dia a dia' },
  { value: 'projeto', label: 'Nutrição esportiva', description: 'Dúvidas sobre performance, treino e suplementação' },
  { value: 'reforma', label: 'Emagrecimento', description: 'Dúvidas sobre perda de peso e recomposição corporal' },
  { value: 'interiores', label: 'Intolerâncias', description: 'Dúvidas sobre lactose, glúten e alergias alimentares' },
  { value: 'orcamento', label: 'Diabetes', description: 'Dúvidas sobre controle glicêmico e plano alimentar' },
  { value: 'legislacao', label: 'Saúde intestinal', description: 'Dúvidas sobre digestão, microbiota e sintomas gastrointestinais' },
  { value: 'outro', label: 'Outro', description: 'Outras dúvidas sobre nutrição e saúde' },
]

// ============================================
// SERVIÇO DE PERGUNTAS
// ============================================

export const questionService = {
  /**
   * Lista perguntas com filtros (público)
   */
  list: async (filters?: QuestionFilters): Promise<ApiResponse<PaginatedResponse<Question>>> => {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.architectId) params.append('architectId', filters.architectId)
    if (filters?.clientId) params.append('clientId', filters.clientId)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.featured !== undefined) params.append('featured', String(filters.featured))
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const query = params.toString()
    return api.get<PaginatedResponse<Question>>(`/public/questions${query ? `?${query}` : ''}`)
  },

  /**
   * Busca uma pergunta por ID (público)
   */
  getById: async (id: string): Promise<ApiResponse<Question>> => {
    return api.get<Question>(`/public/questions/${id}`)
  },

  /**
   * Cria uma nova pergunta
   */
  create: async (data: CreateQuestionRequest): Promise<ApiResponse<Question>> => {
    return api.post<Question>('/questions', data)
  },

  /**
   * Atualiza uma pergunta
   */
  update: async (id: string, data: CreateQuestionRequest): Promise<ApiResponse<Question>> => {
    return api.put<Question>(`/questions/${id}`, data)
  },

  /**
   * Deleta uma pergunta
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/questions/${id}`)
  },

  /**
   * Fecha uma pergunta
   */
  close: async (id: string): Promise<ApiResponse<Question>> => {
    return api.put<Question>(`/questions/${id}/close`)
  },

  /**
   * Adiciona uma resposta a uma pergunta
   */
  addAnswer: async (questionId: string, data: CreateAnswerRequest): Promise<ApiResponse<Question>> => {
    return api.post<Question>(`/questions/${questionId}/answers`, data)
  },

  /**
   * Marca uma resposta como a melhor
   */
  markBestAnswer: async (questionId: string, answerId: string): Promise<ApiResponse<Question>> => {
    return api.put<Question>(`/questions/${questionId}/answers/${answerId}/best`)
  },

  /**
   * Marca uma resposta como útil
   */
  markAnswerHelpful: async (questionId: string, answerId: string): Promise<ApiResponse<Question>> => {
    return api.post<Question>(`/questions/${questionId}/answers/${answerId}/helpful`)
  },

  /**
   * Busca estatísticas de perguntas
   */
  getStats: async (): Promise<ApiResponse<QuestionStats>> => {
    return api.get<QuestionStats>('/questions/stats')
  },

  /**
   * Busca perguntas populares (público)
   */
  getPopular: async (limit = 10): Promise<ApiResponse<Question[]>> => {
    return api.get<Question[]>(`/public/questions/popular?limit=${limit}`)
  },

  /**
   * Busca perguntas respondidas por um profissional (público)
   */
  getByArchitect: async (architectId: string, limit = 10): Promise<ApiResponse<Question[]>> => {
    return api.get<Question[]>(`/public/questions/architect/${architectId}?limit=${limit}`)
  },
}

export default questionService


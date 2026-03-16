// ============================================
// SERVIÇO DE PROJETOS
// ============================================

import { api, sanitizeInput } from './api'
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  PaginatedResponse,
  ApiResponse,
  Image,
} from '../types/api'

// ============================================
// VALIDAÇÕES
// ============================================

const validateProject = (data: CreateProjectRequest): { valid: boolean; error?: string } => {
  if (!data.title || data.title.trim().length < 3) {
    return { valid: false, error: 'Título deve ter pelo menos 3 caracteres' }
  }

  if (data.title.length > 200) {
    return { valid: false, error: 'Título deve ter no máximo 200 caracteres' }
  }

  if (!data.description || data.description.trim().length < 10) {
    return { valid: false, error: 'Descrição deve ter pelo menos 10 caracteres' }
  }

  if (data.description.length > 5000) {
    return { valid: false, error: 'Descrição deve ter no máximo 5000 caracteres' }
  }

  if (!data.category) {
    return { valid: false, error: 'Categoria é obrigatória' }
  }

  if (!data.location || data.location.trim().length < 2) {
    return { valid: false, error: 'Localização é obrigatória' }
  }

  // Validar senha se accessType for password
  if (data.accessType === 'password' && (!data.password || data.password.length < 4)) {
    return { valid: false, error: 'Senha de acesso deve ter pelo menos 4 caracteres' }
  }

  return { valid: true }
}

// ============================================
// SERVIÇO DE PROJETOS
// ============================================

export const projectService = {
  /**
   * Listar projetos com filtros
   */
  async list(filters?: ProjectFilters): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const params = new URLSearchParams()

    if (filters) {
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.accessType) params.append('accessType', filters.accessType)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/projects?${queryString}` : '/projects'

    return api.get<PaginatedResponse<Project>>(endpoint)
  },

  /**
   * Obter projeto por ID
   */
  async getById(id: string): Promise<ApiResponse<Project>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    return api.get<Project>(`/projects/${encodeURIComponent(id)}`)
  },

  /**
   * Criar novo projeto
   */
  async create(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    const validation = validateProject(data)
    if (!validation.valid) {
      return { error: validation.error }
    }

    // Sanitizar inputs
    const sanitizedData: CreateProjectRequest = {
      ...data,
      title: sanitizeInput(data.title.trim()),
      description: sanitizeInput(data.description.trim()),
      location: sanitizeInput(data.location.trim()),
      tags: data.tags?.map(tag => sanitizeInput(tag.trim())).filter(Boolean),
    }

    return api.post<Project>('/projects', sanitizedData)
  },

  /**
   * Atualizar projeto
   */
  async update(id: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    // Validar campos que foram enviados
    if (data.title !== undefined) {
      if (data.title.trim().length < 3) {
        return { error: 'Título deve ter pelo menos 3 caracteres' }
      }
      if (data.title.length > 200) {
        return { error: 'Título deve ter no máximo 200 caracteres' }
      }
    }

    if (data.description !== undefined) {
      if (data.description.trim().length < 10) {
        return { error: 'Descrição deve ter pelo menos 10 caracteres' }
      }
      if (data.description.length > 5000) {
        return { error: 'Descrição deve ter no máximo 5000 caracteres' }
      }
    }

    // Sanitizar inputs
    const sanitizedData: UpdateProjectRequest = { ...data }
    if (data.title) sanitizedData.title = sanitizeInput(data.title.trim())
    if (data.description) sanitizedData.description = sanitizeInput(data.description.trim())
    if (data.location) sanitizedData.location = sanitizeInput(data.location.trim())
    if (data.tags) sanitizedData.tags = data.tags.map(tag => sanitizeInput(tag.trim())).filter(Boolean)

    return api.put<Project>(`/projects/${encodeURIComponent(id)}`, sanitizedData)
  },

  /**
   * Deletar projeto
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    return api.delete<{ message: string }>(`/projects/${encodeURIComponent(id)}`)
  },

  /**
   * Atualizar visibilidade do projeto
   */
  async updateVisibility(
    id: string,
    accessType: 'public' | 'private' | 'password',
    password?: string
  ): Promise<ApiResponse<Project>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    if (accessType === 'password' && (!password || password.length < 4)) {
      return { error: 'Senha de acesso deve ter pelo menos 4 caracteres' }
    }

    return api.put<Project>(`/projects/${encodeURIComponent(id)}/visibility`, {
      accessType,
      password,
    })
  },

  /**
   * Upload de imagem de capa
   */
  async uploadCover(
    id: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ coverUrl: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    // Validar arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      return { error: 'Formato de imagem não suportado. Use JPG, PNG, WebP ou HEIC.' }
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return { error: 'Imagem muito grande. Tamanho máximo: 50MB' }
    }

    return api.uploadFile<{ coverUrl: string }>(
      `/projects/${encodeURIComponent(id)}/cover`,
      file,
      undefined,
      onProgress
    )
  },

  /**
   * Obter estatísticas do projeto
   */
  async getStats(id: string): Promise<ApiResponse<{
    views: number
    filesCount: number
    lastViewed?: string
    viewsByDay?: Record<string, number>
  }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    return api.get(`/projects/${encodeURIComponent(id)}/stats`)
  },

  /**
   * Listar imagens do projeto
   */
  async getImages(id: string): Promise<ApiResponse<Image[]>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    return api.get<Image[]>(`/projects/${encodeURIComponent(id)}/images`)
  },

  /**
   * Verificar acesso a projeto protegido por senha
   */
  async verifyPassword(id: string, password: string): Promise<ApiResponse<{ valid: boolean }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    if (!password) {
      return { error: 'Senha é obrigatória' }
    }

    return api.post<{ valid: boolean }>(
      `/projects/${encodeURIComponent(id)}/verify-password`,
      { password },
      { requiresAuth: false }
    )
  },
}




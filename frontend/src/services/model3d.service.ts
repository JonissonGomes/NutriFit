import { api } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type ModelFileFormat = 
  | 'obj' | 'fbx' | 'gltf' | 'glb' | '3ds' | 'stl' 
  | 'ply' | 'dae' | 'dwg' | 'dxf' | 'skp' | 'rvt' | 'ifc' | '3dm'

export type ModelFileStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface BoundingBox {
  min: Vector3D
  max: Vector3D
}

export interface ModelPreview {
  angle: string
  url: string
  width: number
  height: number
}

export interface ModelFile {
  id: string
  userId: string
  projectId?: string
  originalName: string
  originalFormat: ModelFileFormat
  originalUrl: string
  originalSize: number
  webFormat?: ModelFileFormat
  webUrl?: string
  webSize?: number
  previews?: ModelPreview[]
  thumbnailUrl?: string
  title: string
  description?: string
  tags?: string[]
  category?: string
  vertexCount?: number
  faceCount?: number
  materialCount?: number
  textureCount?: number
  hasAnimations: boolean
  boundingBox?: BoundingBox
  status: ModelFileStatus
  processingError?: string
  processedAt?: string
  defaultCameraPosition?: Vector3D
  defaultLighting?: string
  backgroundColor?: string
  isPublic: boolean
  downloads: number
  views: number
  createdAt: string
  updatedAt: string
}

export interface UploadModelFileRequest {
  projectId?: string
  title: string
  description?: string
  tags?: string[]
  category?: string
  isPublic: boolean
}

export interface UpdateModelFileRequest {
  title?: string
  description?: string
  tags?: string[]
  category?: string
  isPublic?: boolean
  defaultCameraPosition?: Vector3D
  defaultLighting?: string
  backgroundColor?: string
}

export interface ModelFileFilters {
  userId?: string
  projectId?: string
  format?: ModelFileFormat
  status?: ModelFileStatus
  category?: string
  isPublic?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface ModelStats {
  totalFiles: number
  ready: number
  pending: number
  processing: number
  failed: number
  totalViews?: number
  totalDownloads?: number
  totalSize?: number
}

export interface DownloadInfo {
  url: string
  format: ModelFileFormat
  size: number
}

export interface FormatsInfo {
  formats: ModelFileFormat[]
  categories: string[]
}

// ============================================
// CATEGORIAS DE MODELOS
// ============================================

export const MODEL_CATEGORIES = [
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'iluminacao', label: 'Iluminação' },
  { value: 'decoracao', label: 'Decoração' },
  { value: 'estrutural', label: 'Estrutural' },
  { value: 'paisagismo', label: 'Paisagismo' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'climatizacao', label: 'Climatização' },
  { value: 'fachada', label: 'Fachada' },
  { value: 'interiores', label: 'Interiores' },
  { value: 'maquete', label: 'Maquete' },
  { value: 'outro', label: 'Outro' },
]

// ============================================
// SERVIÇO DE MODELOS 3D
// ============================================

export const model3dService = {
  /**
   * Faz upload de um arquivo 3D
   */
  upload: async (
    file: File,
    data: UploadModelFileRequest,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<ModelFile>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', data.title)
    if (data.projectId) formData.append('projectId', data.projectId)
    if (data.description) formData.append('description', data.description)
    if (data.tags) formData.append('tags', data.tags.join(','))
    if (data.category) formData.append('category', data.category)
    formData.append('isPublic', String(data.isPublic))

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ data: response })
          } else {
            resolve({ error: response.error || 'Erro no upload' })
          }
        } catch {
          resolve({ error: 'Erro ao processar resposta' })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ error: 'Erro de rede' })
      })

      const token = localStorage.getItem('arckdesign_access_token')
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
      xhr.open('POST', `${apiBaseUrl}/models3d/upload`)
      xhr.timeout = 600000 // 10 minutos para uploads grandes
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      
      xhr.addEventListener('timeout', () => {
        resolve({ error: 'Tempo limite do upload excedido. Tente novamente com um arquivo menor.' })
      })
      
      xhr.send(formData)
    })
  },

  /**
   * Lista modelos 3D
   */
  list: async (filters?: ModelFileFilters): Promise<ApiResponse<PaginatedResponse<ModelFile>>> => {
    const params = new URLSearchParams()
    if (filters?.userId) params.append('userId', filters.userId)
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.format) params.append('format', filters.format)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic))
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const query = params.toString()
    return api.get<PaginatedResponse<ModelFile>>(`/models3d${query ? `?${query}` : ''}`)
  },

  /**
   * Busca um modelo por ID (requer autenticação)
   */
  getById: async (id: string): Promise<ApiResponse<ModelFile>> => {
    return api.get<ModelFile>(`/models3d/${id}`)
  },

  /**
   * Busca um modelo público por ID (não requer autenticação)
   */
  getPublicById: async (id: string): Promise<ApiResponse<ModelFile>> => {
    return api.get<ModelFile>(`/public/models3d/${id}`)
  },

  /**
   * Atualiza um modelo
   */
  update: async (id: string, data: UpdateModelFileRequest): Promise<ApiResponse<ModelFile>> => {
    return api.put<ModelFile>(`/models3d/${id}`, data)
  },

  /**
   * Deleta um modelo
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/models3d/${id}`)
  },

  /**
   * Busca modelos de um projeto
   */
  getByProject: async (projectId: string): Promise<ApiResponse<ModelFile[]>> => {
    return api.get<ModelFile[]>(`/models3d/project/${projectId}`)
  },

  /**
   * Busca estatísticas
   */
  getStats: async (): Promise<ApiResponse<ModelStats>> => {
    return api.get<ModelStats>('/models3d/stats')
  },

  /**
   * Busca informações para download
   */
  getDownloadInfo: async (id: string, format: 'original' | 'web' = 'web'): Promise<ApiResponse<DownloadInfo>> => {
    return api.get<DownloadInfo>(`/models3d/${id}/download?format=${format}`)
  },

  /**
   * Busca formatos suportados
   */
  getFormats: async (): Promise<ApiResponse<FormatsInfo>> => {
    return api.get<FormatsInfo>('/models3d/formats')
  },

  /**
   * Retenta processamento
   */
  retryProcessing: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post<{ message: string }>(`/models3d/${id}/retry`)
  },
}

export default model3dService


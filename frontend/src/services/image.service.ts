// ============================================
// SERVIÇO DE IMAGENS
// ============================================

import { api } from './api'
import type { Image, ApiResponse } from '../types/api'

// ============================================
// CONSTANTES
// ============================================

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_BATCH_SIZE = 20

// ============================================
// VALIDAÇÕES
// ============================================

const validateImage = (file: File): { valid: boolean; error?: string } => {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Formato não suportado: ${file.name}. Use JPG, PNG, WebP ou HEIC.`,
    }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande: ${file.name}. Tamanho máximo: 50MB`,
    }
  }

  return { valid: true }
}

// ============================================
// SERVIÇO DE IMAGENS
// ============================================

export const imageService = {
  /**
   * Upload de imagem única
   */
  async upload(
    projectId: string,
    file: File,
    caption?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Image>> {
    // Validar projectId
    if (!projectId || typeof projectId !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    // Validar arquivo
    const validation = validateImage(file)
    if (!validation.valid) {
      return { error: validation.error }
    }

    const additionalData: Record<string, string> = { projectId }
    if (caption) {
      additionalData.caption = caption.trim().substring(0, 500) // Limitar caption
    }

    return api.uploadFile<Image>('/images/upload', file, additionalData, onProgress)
  },

  /**
   * Upload de múltiplas imagens
   */
  async uploadBatch(
    projectId: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void,
    onFileComplete?: (fileIndex: number, result: ApiResponse<Image>) => void
  ): Promise<{ successful: Image[]; failed: { file: File; error: string }[] }> {
    // Validar projectId
    if (!projectId || typeof projectId !== 'string') {
      return {
        successful: [],
        failed: files.map(file => ({ file, error: 'ID do projeto inválido' })),
      }
    }

    // Limitar quantidade de arquivos
    if (files.length > MAX_BATCH_SIZE) {
      return {
        successful: [],
        failed: files.map(file => ({
          file,
          error: `Máximo de ${MAX_BATCH_SIZE} arquivos por vez`,
        })),
      }
    }

    const successful: Image[] = []
    const failed: { file: File; error: string }[] = []

    // Upload sequencial para evitar sobrecarga
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validar arquivo
      const validation = validateImage(file)
      if (!validation.valid) {
        failed.push({ file, error: validation.error! })
        onFileComplete?.(i, { error: validation.error })
        continue
      }

      // Upload
      const result = await this.upload(
        projectId,
        file,
        undefined,
        (progress) => onProgress?.(i, progress)
      )

      if (result.data) {
        successful.push(result.data)
      } else {
        failed.push({ file, error: result.error || 'Erro no upload' })
      }

      onFileComplete?.(i, result)
    }

    return { successful, failed }
  },

  /**
   * Obter imagem por ID
   */
  async getById(id: string): Promise<ApiResponse<Image>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da imagem inválido' }
    }

    return api.get<Image>(`/images/${encodeURIComponent(id)}`)
  },

  /**
   * Obter URLs da imagem (diferentes tamanhos)
   */
  async getUrls(id: string): Promise<ApiResponse<{
    original: string
    compressed: string
    thumbnail: string
    medium: string
  }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da imagem inválido' }
    }

    return api.get(`/images/${encodeURIComponent(id)}/url`)
  },

  /**
   * Atualizar metadados da imagem
   */
  async update(
    id: string,
    data: { caption?: string; position?: number }
  ): Promise<ApiResponse<Image>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da imagem inválido' }
    }

    // Sanitizar caption
    const sanitizedData = { ...data }
    if (data.caption !== undefined) {
      sanitizedData.caption = data.caption.trim().substring(0, 500)
    }

    // Validar position
    if (data.position !== undefined && (data.position < 0 || !Number.isInteger(data.position))) {
      return { error: 'Posição inválida' }
    }

    return api.put<Image>(`/images/${encodeURIComponent(id)}`, sanitizedData)
  },

  /**
   * Deletar imagem
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da imagem inválido' }
    }

    return api.delete<{ message: string }>(`/images/${encodeURIComponent(id)}`)
  },

  /**
   * Reprocessar imagem (gerar novamente thumbnails, etc)
   */
  async reprocess(id: string): Promise<ApiResponse<Image>> {
    if (!id || typeof id !== 'string') {
      return { error: 'ID da imagem inválido' }
    }

    return api.post<Image>(`/images/${encodeURIComponent(id)}/reprocess`)
  },

  /**
   * Reordenar imagens de um projeto
   */
  async reorder(
    projectId: string,
    imageIds: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    if (!projectId || typeof projectId !== 'string') {
      return { error: 'ID do projeto inválido' }
    }

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return { error: 'Lista de IDs inválida' }
    }

    return api.put(`/projects/${encodeURIComponent(projectId)}/images/reorder`, {
      imageIds,
    })
  },

  /**
   * Utilitário: Criar URL de preview local para arquivo
   */
  createLocalPreview(file: File): string {
    return URL.createObjectURL(file)
  },

  /**
   * Utilitário: Revogar URL de preview local
   */
  revokeLocalPreview(url: string): void {
    URL.revokeObjectURL(url)
  },

  /**
   * Utilitário: Obter dimensões da imagem
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Não foi possível ler as dimensões da imagem'))
      }

      img.src = url
    })
  },

  /**
   * Utilitário: Comprimir imagem no cliente (opcional, para preview)
   */
  async compressForPreview(
    file: File,
    maxWidth: number = 800,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Redimensionar mantendo proporção
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Não foi possível comprimir a imagem'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Não foi possível carregar a imagem'))
      }

      img.src = url
    })
  },
}




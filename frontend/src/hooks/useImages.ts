// ============================================
// HOOK PARA GERENCIAMENTO DE IMAGENS
// ============================================

import { useState, useCallback } from 'react'
import { imageService } from '../services'
import type { Image } from '../types/api'

interface UploadProgress {
  fileIndex: number
  progress: number
  fileName: string
}

interface UseImagesState {
  images: Image[]
  isLoading: boolean
  isUploading: boolean
  uploadProgress: UploadProgress[]
  error: string | null
}

interface UseImagesReturn extends UseImagesState {
  uploadImage: (projectId: string, file: File, caption?: string) => Promise<{ success: boolean; image?: Image; error?: string }>
  uploadImages: (projectId: string, files: File[]) => Promise<{ successful: Image[]; failed: { file: File; error: string }[] }>
  deleteImage: (id: string) => Promise<{ success: boolean; error?: string }>
  updateImage: (id: string, data: { caption?: string; position?: number }) => Promise<{ success: boolean; image?: Image; error?: string }>
  reorderImages: (projectId: string, imageIds: string[]) => Promise<{ success: boolean; error?: string }>
  setImages: (images: Image[]) => void
  clearError: () => void
}

export const useImages = (): UseImagesReturn => {
  const [state, setState] = useState<UseImagesState>({
    images: [],
    isLoading: false,
    isUploading: false,
    uploadProgress: [],
    error: null,
  })

  const uploadImage = useCallback(async (
    projectId: string,
    file: File,
    caption?: string
  ) => {
    setState(prev => ({ ...prev, isUploading: true, error: null }))

    try {
      const response = await imageService.upload(
        projectId,
        file,
        caption,
        (progress) => {
          setState(prev => ({
            ...prev,
            uploadProgress: [{ fileIndex: 0, progress, fileName: file.name }],
          }))
        }
      )

      if (response.data) {
        setState(prev => ({
          ...prev,
          images: [...prev.images, response.data!],
          isUploading: false,
          uploadProgress: [],
        }))
        return { success: true, image: response.data }
      }

      setState(prev => ({ ...prev, isUploading: false, uploadProgress: [] }))
      return { success: false, error: response.error }
    } catch (error) {
      setState(prev => ({ ...prev, isUploading: false, uploadProgress: [] }))
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

  const uploadImages = useCallback(async (projectId: string, files: File[]) => {
    setState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      uploadProgress: files.map((file, index) => ({
        fileIndex: index,
        progress: 0,
        fileName: file.name,
      })),
    }))

    try {
      const result = await imageService.uploadBatch(
        projectId,
        files,
        (fileIndex, progress) => {
          setState(prev => ({
            ...prev,
            uploadProgress: prev.uploadProgress.map(p =>
              p.fileIndex === fileIndex ? { ...p, progress } : p
            ),
          }))
        },
        (_fileIndex, response) => {
          if (response.data) {
            setState(prev => ({
              ...prev,
              images: [...prev.images, response.data!],
            }))
          }
        }
      )

      setState(prev => ({ ...prev, isUploading: false, uploadProgress: [] }))
      return result
    } catch (error) {
      setState(prev => ({ ...prev, isUploading: false, uploadProgress: [] }))
      return {
        successful: [],
        failed: files.map(file => ({ file, error: 'Erro de conexão' })),
      }
    }
  }, [])

  const deleteImage = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await imageService.delete(id)

      if (!response.error) {
        setState(prev => ({
          ...prev,
          images: prev.images.filter(img => img.id !== id),
          isLoading: false,
        }))
        return { success: true }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: response.error }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

  const updateImage = useCallback(async (
    id: string,
    data: { caption?: string; position?: number }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await imageService.update(id, data)

      if (response.data) {
        setState(prev => ({
          ...prev,
          images: prev.images.map(img => img.id === id ? response.data! : img),
          isLoading: false,
        }))
        return { success: true, image: response.data }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: response.error }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

  const reorderImages = useCallback(async (projectId: string, imageIds: string[]) => {
    // Atualizar estado local imediatamente (otimistic update)
    const reorderedImages = imageIds
      .map(id => state.images.find(img => img.id === id))
      .filter((img): img is Image => img !== undefined)

    setState(prev => ({ ...prev, images: reorderedImages }))

    try {
      const response = await imageService.reorder(projectId, imageIds)

      if (response.error) {
        // Reverter em caso de erro
        return { success: false, error: response.error }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' }
    }
  }, [state.images])

  const setImages = useCallback((images: Image[]) => {
    setState(prev => ({ ...prev, images }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    uploadImage,
    uploadImages,
    deleteImage,
    updateImage,
    reorderImages,
    setImages,
    clearError,
  }
}


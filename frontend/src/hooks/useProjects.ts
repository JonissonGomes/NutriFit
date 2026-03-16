// ============================================
// HOOK PARA GERENCIAMENTO DE PROJETOS
// ============================================

import { useState, useCallback } from 'react'
import { projectService } from '../services'
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
} from '../types/api'

interface UseProjectsState {
  projects: Project[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
}

interface UseProjectsReturn extends UseProjectsState {
  fetchProjects: (filters?: ProjectFilters) => Promise<void>
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; project?: Project; error?: string }>
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<{ success: boolean; project?: Project; error?: string }>
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>
  uploadCover: (id: string, file: File, onProgress?: (progress: number) => void) => Promise<{ success: boolean; coverUrl?: string; error?: string }>
  clearError: () => void
}

export const useProjects = (): UseProjectsReturn => {
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    error: null,
  })

  const fetchProjects = useCallback(async (filters?: ProjectFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await projectService.list(filters)

      if (response.data) {
        setState(prev => ({
          ...prev,
          projects: response.data!.data,
          total: response.data!.total,
          page: response.data!.page,
          totalPages: response.data!.totalPages,
          isLoading: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Erro ao carregar projetos',
          isLoading: false,
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Erro de conexão',
        isLoading: false,
      }))
    }
  }, [])

  const createProject = useCallback(async (data: CreateProjectRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await projectService.create(data)

      if (response.data) {
        setState(prev => ({
          ...prev,
          projects: [response.data!, ...prev.projects],
          total: prev.total + 1,
          isLoading: false,
        }))
        return { success: true, project: response.data }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: response.error }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

  const updateProject = useCallback(async (id: string, data: UpdateProjectRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await projectService.update(id, data)

      if (response.data) {
        setState(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === id ? response.data! : p),
          isLoading: false,
        }))
        return { success: true, project: response.data }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: response.error }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await projectService.delete(id)

      if (!response.error) {
        setState(prev => ({
          ...prev,
          projects: prev.projects.filter(p => p.id !== id),
          total: prev.total - 1,
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

  const uploadCover = useCallback(async (
    id: string,
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    try {
      const response = await projectService.uploadCover(id, file, onProgress)

      if (response.data) {
        setState(prev => ({
          ...prev,
          projects: prev.projects.map(p =>
            p.id === id ? { ...p, coverImage: response.data!.coverUrl } : p
          ),
        }))
        return { success: true, coverUrl: response.data.coverUrl }
      }

      return { success: false, error: response.error }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    uploadCover,
    clearError,
  }
}

// ============================================
// HOOK PARA PROJETO ÚNICO
// ============================================

interface UseProjectReturn {
  project: Project | null
  isLoading: boolean
  error: string | null
  fetchProject: (id: string) => Promise<void>
  clearError: () => void
}

export const useProject = (): UseProjectReturn => {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await projectService.getById(id)

      if (response.data) {
        setProject(response.data)
      } else {
        setError(response.error || 'Projeto não encontrado')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    project,
    isLoading,
    error,
    fetchProject,
    clearError,
  }
}


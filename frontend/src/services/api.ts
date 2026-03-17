// ============================================
// CLIENTE HTTP BASE COM INTERCEPTORS DE SEGURANÇA
// ============================================

import type { ApiError, ApiResponse, AuthTokens } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

// ============================================
// GERENCIAMENTO DE TOKENS
// ============================================

const TOKEN_KEY = 'nufit_access_token'
const REFRESH_TOKEN_KEY = 'nufit_refresh_token'
const LEGACY_TOKEN_KEY = 'nufit_access_token'
const LEGACY_REFRESH_TOKEN_KEY = 'nufit_refresh_token'
const LEGACY_USER_KEY = 'nufit_user'
const USER_KEY = 'nufit_user'

export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
  },

  setTokens: (tokens: AuthTokens): void => {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)

    // migrar chaves legadas (evitar estados inconsistentes)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      return Date.now() >= exp - 60000 // 1 minute buffer
    } catch {
      return true
    }
  }
}

// ============================================
// FILA DE REQUISIÇÕES PARA REFRESH TOKEN
// ============================================

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

// ============================================
// FUNÇÃO DE REFRESH TOKEN
// ============================================

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenManager.getRefreshToken()
  
  if (!refreshToken) {
    tokenManager.clearTokens()
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      tokenManager.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return null
    }

    const data = await response.json()
    const newAccessToken = data.accessToken

    localStorage.setItem(TOKEN_KEY, newAccessToken)
    return newAccessToken
  } catch (error) {
    tokenManager.clearTokens()
    window.dispatchEvent(new CustomEvent('auth:logout'))
    return null
  }
}

// ============================================
// CLIENTE HTTP PRINCIPAL
// ============================================

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean
  timeout?: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { requiresAuth = true, timeout = 30000, ...fetchConfig } = config

    // Preparar headers
    const headers = new Headers(fetchConfig.headers)
    
    if (!headers.has('Content-Type') && !(fetchConfig.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    // Adicionar token de autenticação se necessário
    if (requiresAuth) {
      let accessToken = tokenManager.getAccessToken()

      // Verificar se o token está expirado
      if (accessToken && tokenManager.isTokenExpired(accessToken)) {
        if (!isRefreshing) {
          isRefreshing = true
          const newToken = await refreshAccessToken()
          isRefreshing = false
          
          if (newToken) {
            onTokenRefreshed(newToken)
            accessToken = newToken
          } else {
            return { error: 'Sessão expirada. Faça login novamente.' }
          }
        } else {
          // Aguardar refresh em andamento
          accessToken = await new Promise<string>((resolve) => {
            subscribeTokenRefresh(resolve)
          })
        }
      }

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }
    }

    // Criar controller para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Tratar resposta
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }))

        // Se for 401, tentar refresh token
        if (response.status === 401 && requiresAuth) {
          if (!isRefreshing) {
            isRefreshing = true
            const newToken = await refreshAccessToken()
            isRefreshing = false

            if (newToken) {
              onTokenRefreshed(newToken)
              // Retry request with new token
              headers.set('Authorization', `Bearer ${newToken}`)
              const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
                ...fetchConfig,
                headers,
              })
              
              if (retryResponse.ok) {
                const data = await retryResponse.json()
                return { data }
              }
            }
          }
          
          tokenManager.clearTokens()
          window.dispatchEvent(new CustomEvent('auth:logout'))
          return { error: 'Sessão expirada. Faça login novamente.' }
        }

        return { error: errorData.error || 'Erro na requisição' }
      }

      // Resposta vazia (204 No Content)
      if (response.status === 204) {
        return { data: undefined as T }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { error: 'Tempo limite da requisição excedido' }
        }
        return { error: error.message }
      }

      return { error: 'Erro desconhecido na requisição' }
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // Upload simples com FormData
  async upload<T>(endpoint: string, formData: FormData, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
    })
  }

  // Upload de arquivo com progresso
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      
      formData.append('file', file)
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      // Progress handler
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        })
      }

      // Load handler
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({ data })
          } catch {
            resolve({ error: 'Erro ao processar resposta' })
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            resolve({ error: error.error || 'Erro no upload' })
          } catch {
            resolve({ error: 'Erro no upload' })
          }
        }
      })

      // Error handler
      xhr.addEventListener('error', () => {
        resolve({ error: 'Erro de rede no upload' })
      })

      // Timeout handler
      xhr.addEventListener('timeout', () => {
        resolve({ error: 'Tempo limite do upload excedido' })
      })

      // Configure request
      xhr.open('POST', `${this.baseUrl}${endpoint}`)
      xhr.timeout = 300000 // 5 minutes for uploads

      // Add auth header
      const token = tokenManager.getAccessToken()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.send(formData)
    })
  }
}

// Exportar instância única
export const api = new ApiClient(API_BASE_URL)

// ============================================
// HELPERS DE SEGURANÇA
// ============================================

// Sanitizar input para prevenir XSS
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar senha forte
export const isStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial')
  }

  return { valid: errors.length === 0, errors }
}

// Rate limiting no cliente
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}


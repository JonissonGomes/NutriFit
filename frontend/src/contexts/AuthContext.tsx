import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authService, tokenManager } from '../services'
import type { User, UserRole, ProfessionalRegistration } from '../types/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (email: string, password: string, name: string, role: UserRole, professionalRegistration?: ProfessionalRegistration) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

// ============================================
// CONTEXTO
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar usuário ao iniciar
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar se há token válido
        if (authService.isAuthenticated()) {
          // Tentar obter usuário do servidor
          const response = await authService.getCurrentUser()
          if (response.data) {
            setUser(response.data)
          } else {
            // Token inválido, limpar dados
            tokenManager.clearTokens()
          }
        } else {
          // Sem token, verificar se há usuário local (fallback)
          const storedUser = authService.getStoredUser()
          if (storedUser && tokenManager.getAccessToken()) {
            // Tentar validar token
            const response = await authService.getCurrentUser()
            if (response.data) {
              setUser(response.data)
            } else {
              tokenManager.clearTokens()
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        tokenManager.clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Escutar evento de logout (quando token expira)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  // Login único: redirecionamento por role retornado
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true)
    try {
      const response = await authService.login(email, password)
      if (response.data) {
        setUser(response.data.user)
        return { success: true, user: response.data.user }
      }
      return { success: false, error: response.error || 'Erro ao fazer login' }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro de conexão. Tente novamente.' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Registro: professionalRegistration obrigatório para nutricionista e medico
  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    professionalRegistration?: ProfessionalRegistration
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true)
    try {
      const response = await authService.register(email, password, name, role, professionalRegistration)
      if (response.data) {
        setUser(response.data.user)
        return { success: true, user: response.data.user }
      }
      return { success: false, error: response.error || 'Erro ao criar conta' }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro de conexão. Tente novamente.' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  // Atualizar dados do usuário
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return

    try {
      const response = await authService.getCurrentUser()
      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// TIPOS EXPORTADOS (para compatibilidade)
// ============================================

export type { UserRole as UserType } from '../types/api'

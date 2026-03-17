// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================

import { api, tokenManager, isValidEmail, isStrongPassword, checkRateLimit } from './api'
import type {
  User,
  AuthPayload,
  LoginRequest,
  RegisterRequest,
  UserRole,
  ProfessionalRegistration,
  ApiResponse,
} from '../types/api'

// ============================================
// CONSTANTES
// ============================================

const USER_STORAGE_KEY = 'nufit_user'
const LEGACY_USER_STORAGE_KEY = 'arckdesign_user'

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

const saveUser = (user: User): void => {
  // Garantir que type seja sempre igual a role para compatibilidade
  const userWithType = {
    ...user,
    type: user.role || user.type,
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithType))
}

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(LEGACY_USER_STORAGE_KEY)
    if (!stored) return null
    const user = JSON.parse(stored)
    // Garantir que type seja sempre igual a role para compatibilidade
    return { ...user, type: user.role || user.type }
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY)
    return null
  }
}

const clearUserData = (): void => {
  tokenManager.clearTokens()
  localStorage.removeItem(USER_STORAGE_KEY)
  localStorage.removeItem(LEGACY_USER_STORAGE_KEY)
}

// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================

export const authService = {
  /**
   * Registrar novo usuário. Para nutricionista/medico, professionalRegistration é obrigatório.
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    professionalRegistration?: ProfessionalRegistration
  ): Promise<ApiResponse<AuthPayload>> {
    if (!isValidEmail(email)) {
      return { error: 'Email inválido' }
    }

    const passwordCheck = isStrongPassword(password)
    if (!passwordCheck.valid) {
      return { error: passwordCheck.errors.join('. ') }
    }

    if (name.trim().length < 2) {
      return { error: 'Nome deve ter pelo menos 2 caracteres' }
    }

    if ((role === 'nutricionista' || role === 'medico') && !professionalRegistration?.number?.trim()) {
      return { error: role === 'nutricionista' ? 'CRN é obrigatório' : 'CRM é obrigatório' }
    }

    if (!checkRateLimit('register', 3, 60000)) {
      return { error: 'Muitas tentativas. Aguarde um minuto.' }
    }

    const request: RegisterRequest = {
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      role,
      ...(professionalRegistration && { professionalRegistration }),
    }

    console.log('[authService.register] Enviando request:', { ...request, password: '***' })

    const response = await api.post<AuthPayload>('/auth/register', request, {
      requiresAuth: false,
    })

    if (response.data) {
      tokenManager.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      })
      saveUser(response.data.user)
    }

    return response
  },

  /**
   * Login único: email + senha; redirecionamento conforme role retornado
   */
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<AuthPayload>> {
    if (!isValidEmail(email)) {
      return { error: 'Email inválido' }
    }

    if (!password) {
      return { error: 'Senha é obrigatória' }
    }

    if (!checkRateLimit(`login:${email}`, 5, 60000)) {
      return { error: 'Muitas tentativas de login. Aguarde um minuto.' }
    }

    const request: LoginRequest = {
      email: email.toLowerCase().trim(),
      password,
    }

    const response = await api.post<AuthPayload>('/auth/login', request, {
      requiresAuth: false,
    })

    if (response.data) {
      tokenManager.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      })
      saveUser(response.data.user)
    }

    return response
  },

  /**
   * Logout do usuário
   */
  async logout(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken()

    if (refreshToken) {
      // Tentar revogar token no servidor (não bloquear se falhar)
      await api.post('/auth/logout', { refreshToken }).catch(() => {
        // Ignorar erros de logout no servidor
      })
    }

    clearUserData()
    window.dispatchEvent(new CustomEvent('auth:logout'))
  },

  /**
   * Obter usuário atual do servidor
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get<User>('/auth/me')

    if (response.data) {
      saveUser(response.data)
    }

    return response
  },

  /**
   * Obter usuário armazenado localmente
   */
  getStoredUser,

  /**
   * Verificar se está autenticado
   */
  isAuthenticated(): boolean {
    const token = tokenManager.getAccessToken()
    if (!token) return false

    // Verificar se o token não está expirado
    return !tokenManager.isTokenExpired(token)
  },

  /**
   * Alterar senha
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    const passwordCheck = isStrongPassword(newPassword)
    if (!passwordCheck.valid) {
      return { error: passwordCheck.errors.join('. ') }
    }

    if (currentPassword === newPassword) {
      return { error: 'A nova senha deve ser diferente da atual' }
    }

    return api.put('/settings/password', {
      currentPassword,
      newPassword,
    })
  },

  /**
   * Solicitar recuperação de senha
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    if (!isValidEmail(email)) {
      return { error: 'Email inválido' }
    }

    // Rate limiting
    if (!checkRateLimit(`reset:${email}`, 3, 300000)) {
      return { error: 'Muitas tentativas. Aguarde 5 minutos.' }
    }

    return api.post(
      '/auth/forgot-password',
      { email: email.toLowerCase().trim() },
      { requiresAuth: false }
    )
  },

  /**
   * Resetar senha com token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    const passwordCheck = isStrongPassword(newPassword)
    if (!passwordCheck.valid) {
      return { error: passwordCheck.errors.join('. ') }
    }

    return api.post(
      '/auth/reset-password',
      { token, newPassword },
      { requiresAuth: false }
    )
  },

  /**
   * Verificar email
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return api.post('/auth/verify-email', { token }, { requiresAuth: false })
  },

  /**
   * Reenviar email de verificação
   */
  async resendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    if (!checkRateLimit('resend-verification', 3, 300000)) {
      return { error: 'Muitas tentativas. Aguarde 5 minutos.' }
    }
    return api.post('/auth/resend-verification')
  },

  /**
   * Verificar se CRN/CRM está disponível (não cadastrado)
   */
  async checkRegistrationAvailable(
    type: 'CRN' | 'CRM',
    number: string
  ): Promise<ApiResponse<{ available: boolean }>> {
    return api.get<{ available: boolean }>(
      `/auth/check-registration?type=${encodeURIComponent(type)}&number=${encodeURIComponent(number.trim())}`,
      { requiresAuth: false }
    )
  },

  /**
   * Validar CRM no portal do CFM (opcional, gratuito).
   * Requer UF + número. Retorna { valid, error }.
   */
  async validateCRM(uf: string, number: string): Promise<ApiResponse<{ valid: boolean; error?: string }>> {
    return api.get<{ valid: boolean; error?: string }>(
      `/auth/validate-crm?uf=${encodeURIComponent(uf.trim().toUpperCase())}&number=${encodeURIComponent(number.trim())}`,
      { requiresAuth: false }
    )
  },
}

// ============================================
// LISTENER PARA LOGOUT AUTOMÁTICO
// ============================================

// Escutar evento de logout (quando token expira)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    clearUserData()
    // Redirecionar para login se não estiver na página de login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  })
}


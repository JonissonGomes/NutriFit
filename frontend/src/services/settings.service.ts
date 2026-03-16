/**
 * Serviço de Configurações
 * Gerencia configurações do usuário, preferências e conta
 */

import { api } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface NotificationSettings {
  email: boolean
  projectUpdates: boolean
  clientMessages: boolean
  marketingEmails: boolean
}

export interface Preferences {
  language: string
  theme: 'light' | 'dark'
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  showEmail: boolean
  showPhone: boolean
}

export interface UserSettings {
  id: string
  userId: string
  notifications: NotificationSettings
  preferences: Preferences
  privacy: PrivacySettings
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  avatar?: string
  companyName?: string
  cnpj?: string
  address?: string
  website?: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

// ============================================
// SERVIÇO
// ============================================

export const settingsService = {
  /**
   * Obtém as configurações do usuário
   */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return api.get<UserSettings>('/settings')
  },

  /**
   * Atualiza configurações de notificações
   */
  async updateNotifications(notifications: NotificationSettings): Promise<ApiResponse<UserSettings>> {
    return api.put<UserSettings>('/settings/notifications', notifications)
  },

  /**
   * Atualiza preferências
   */
  async updatePreferences(preferences: Preferences): Promise<ApiResponse<UserSettings>> {
    return api.put<UserSettings>('/settings/preferences', preferences)
  },

  /**
   * Atualiza configurações de privacidade
   */
  async updatePrivacy(privacy: PrivacySettings): Promise<ApiResponse<UserSettings>> {
    return api.put<UserSettings>('/settings/privacy', privacy)
  },

  /**
   * Obtém dados do perfil
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return api.get<UserProfile>('/account/profile')
  },

  /**
   * Atualiza dados do perfil
   */
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return api.put<UserProfile>('/account/profile', data)
  },

  /**
   * Altera a senha
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return api.put<{ message: string }>('/account/password', {
      currentPassword,
      newPassword,
    })
  },

  /**
   * Exclui a conta
   */
  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete<{ message: string }>('/account', {
      body: JSON.stringify({ password }),
    })
  },
}

export default settingsService




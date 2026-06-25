// ============================================
// SERVIÇO DE PERFIL PÚBLICO
// ============================================

import { api } from './api'
import type { ApiResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type ProfilePageStyle =
  | 'blocks'     // Cards empilhados (padrão)
  | 'landing'    // Página estilo site profissional
  | 'editorial'  // Visual magazine / editorial
  | 'studio'     // Sidebar fixa + conteúdo principal

export type ProfileLayoutType = 
  | 'grid'       // Grade padrão 3 colunas
  | 'masonry'    // Masonry layout (Pinterest style)
  | 'carousel'   // Carrossel de projetos
  | 'featured'   // Um projeto destacado + grid
  | 'minimalist' // Layout minimalista
  | 'portfolio'  // Layout tipo portfólio

export interface ProfileCustomization {
  pageStyle?: ProfilePageStyle
  layout: ProfileLayoutType
  gridColumns: number        // 1, 2, 3, 4 (mobile first)
  showStats: boolean         // Mostrar estatísticas
  showServices: boolean      // Mostrar serviços
  showReviews: boolean       // Mostrar avaliações
  showContact: boolean       // Mostrar informações de contato
  show3DModels?: boolean      // Legado — não utilizado
  showContents?: boolean     // Artigos e materiais
  showRecipes?: boolean      // Receitas públicas
  showBio?: boolean          // Biografia no hero
  showEducation?: boolean    // Formação acadêmica
  showExperience?: boolean   // Experiência profissional
  showAwards?: boolean       // Prêmios e reconhecimentos
  primaryColor?: string      // Cor primária customizada
  backgroundStyle?: 'light' | 'dark' | 'gradient'
  heroStyle?: 'full' | 'compact' | 'minimal'
  projectCardStyle?: 'simple' | 'detailed' | 'overlay'
}

export interface ProfileLocation {
  address?: {
    city: string
    state: string
    country: string
  }
  serviceRadius?: number
  serviceAreas?: string[]
}

export interface SocialLinks {
  instagram?: { username: string; url: string }
  facebook?: { username: string; url: string }
}

export interface Verification {
  verified: boolean
  cauVerified: boolean
  cauNumber?: string
}

export interface Ratings {
  average: number
  total: number
  distribution?: Record<string, number>
}

export interface PublicProfile {
  id: string
  userId: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  coverImage?: string
  location?: ProfileLocation
  specialty?: string
  experience?: string
  cau?: string
  specialties?: string[]
  education?: string
  awards?: string
  website?: string
  email?: string
  phone?: string
  contact?: {
    email?: string
    phone?: string
    website?: string
  }
  social?: SocialLinks
  verification?: Verification
  ratings?: Ratings
  customization?: ProfileCustomization
  projectsCount: number
  reviewsCount: number
  viewsCount?: number
  boost?: {
    active: boolean
    level: 'basic' | 'premium' | 'highlight'
  }
  createdAt: string
  updatedAt: string
}

// ============================================
// CONFIGURAÇÕES DE LAYOUT PADRÃO
// ============================================

export const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  pageStyle: 'blocks',
  layout: 'grid',
  gridColumns: 3,
  showStats: true,
  showServices: true,
  showReviews: true,
  showContact: true,
  showContents: true,
  showRecipes: true,
  showBio: true,
  showEducation: true,
  showExperience: true,
  showAwards: true,
  show3DModels: false,
  backgroundStyle: 'light',
  heroStyle: 'full',
  projectCardStyle: 'simple',
}

export const PAGE_STYLE_OPTIONS = [
  {
    value: 'blocks' as ProfilePageStyle,
    label: 'Blocos',
    description: 'Cards empilhados, ideal para visualização compacta',
    icon: 'view_agenda',
  },
  {
    value: 'landing' as ProfilePageStyle,
    label: 'Landing',
    description: 'Hero em tela cheia e seções amplas estilo site profissional',
    icon: 'web',
  },
  {
    value: 'editorial' as ProfilePageStyle,
    label: 'Editorial',
    description: 'Tipografia destacada e layout assimétrico tipo revista',
    icon: 'article',
  },
  {
    value: 'studio' as ProfilePageStyle,
    label: 'Studio',
    description: 'Barra lateral com contato e conteúdo principal à direita',
    icon: 'view_sidebar',
  },
]

export const LAYOUT_OPTIONS = [
  { 
    value: 'grid' as ProfileLayoutType, 
    label: 'Grade', 
    description: 'Cards alinhados em colunas responsivas',
    icon: 'grid_view'
  },
  { 
    value: 'masonry' as ProfileLayoutType, 
    label: 'Masonry', 
    description: 'Estilo Pinterest, itens de tamanhos variados',
    icon: 'dashboard'
  },
  { 
    value: 'carousel' as ProfileLayoutType, 
    label: 'Carrossel', 
    description: 'Rolagem horizontal para conteúdos e receitas',
    icon: 'view_carousel'
  },
  { 
    value: 'featured' as ProfileLayoutType, 
    label: 'Destaque', 
    description: 'Primeiro item em destaque, demais em grade',
    icon: 'star'
  },
  { 
    value: 'minimalist' as ProfileLayoutType, 
    label: 'Minimalista', 
    description: 'Design clean e elegante',
    icon: 'crop_square'
  },
  { 
    value: 'portfolio' as ProfileLayoutType, 
    label: 'Portfólio', 
    description: 'Layout profissional de portfólio',
    icon: 'work'
  },
]

export const GRID_COLUMN_OPTIONS = [
  { value: 1, label: '1 Coluna (Mobile)' },
  { value: 2, label: '2 Colunas (Tablet)' },
  { value: 3, label: '3 Colunas (Desktop)' },
  { value: 4, label: '4 Colunas (Wide)' },
]

export const HERO_STYLE_OPTIONS = [
  { value: 'full' as const, label: 'Completo', description: 'Hero com imagem de capa grande' },
  { value: 'compact' as const, label: 'Compacto', description: 'Hero reduzido com informações essenciais' },
  { value: 'minimal' as const, label: 'Mínimo', description: 'Apenas nome e avatar' },
]

export const PROJECT_CARD_STYLE_OPTIONS = [
  { value: 'simple' as const, label: 'Simples', description: 'Imagem e título' },
  { value: 'detailed' as const, label: 'Detalhado', description: 'Inclui resumo e descrição' },
  { value: 'overlay' as const, label: 'Sobreposição', description: 'Texto sobre a imagem' },
]

export const BACKGROUND_STYLE_OPTIONS = [
  { value: 'light' as const, label: 'Claro' },
  { value: 'dark' as const, label: 'Escuro' },
  { value: 'gradient' as const, label: 'Gradiente' },
]

// ============================================
// SERVIÇO
// ============================================

export const profileService = {
  /**
   * Obter meu perfil público
   */
  async getMyProfile(): Promise<ApiResponse<PublicProfile>> {
    return api.get<PublicProfile>('/profile/me')
  },

  /**
   * Criar meu perfil público
   */
  async createMyProfile(data: Partial<PublicProfile>): Promise<ApiResponse<PublicProfile>> {
    return api.post<PublicProfile>('/profile', data)
  },

  /**
   * Atualizar meu perfil público
   */
  async updateMyProfile(data: Partial<PublicProfile>): Promise<ApiResponse<PublicProfile>> {
    return api.put<PublicProfile>('/profile', data)
  },

  /**
   * Atualizar customização do perfil
   */
  async updateCustomization(customization: ProfileCustomization): Promise<ApiResponse<PublicProfile>> {
    return api.put<PublicProfile>('/profile', { customization })
  },

  /**
   * Verificar disponibilidade de username
   */
  async checkUsernameAvailable(username: string): Promise<ApiResponse<{ available: boolean }>> {
    return api.get<{ available: boolean }>(`/profile/check-username?username=${encodeURIComponent(username)}`)
  },

  /**
   * Obter perfil público por username
   */
  async getPublicProfile(username: string): Promise<ApiResponse<PublicProfile>> {
    return api.get<PublicProfile>(`/explore/profile/${encodeURIComponent(username)}`, { requiresAuth: false })
  },

  /**
   * Buscar arquitetos
   */
  async searchArchitects(params: {
    q?: string
    specialty?: string
    city?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ data: PublicProfile[]; total: number }>> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.set('q', params.q)
    if (params.specialty) searchParams.set('specialty', params.specialty)
    if (params.city) searchParams.set('city', params.city)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    return api.get<{ data: PublicProfile[]; total: number }>(`/explore/architects?${searchParams.toString()}`, { requiresAuth: false })
  },

  /**
   * Upload de avatar
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<{ url: string }>('/profile/avatar', formData)
  },

  /**
   * Upload de imagem de capa
   */
  async uploadCover(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<{ url: string }>('/profile/cover', formData)
  },
}


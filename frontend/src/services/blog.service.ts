import { api } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/api'

// ============================================
// TIPOS
// ============================================

export type BlogCategory = 
  | 'sustentabilidade'
  | 'tendencias'
  | 'dicas'
  | 'projetos'
  | 'materiais'
  | 'interiores'
  | 'reforma'
  | 'noticias'

export interface BlogPostSEO {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  canonicalUrl?: string
}

export interface BlogPostAuthor {
  id: string
  name: string
  avatar?: string
  specialty?: string
  username?: string
}

export interface BlogPost {
  id: string
  authorId: string
  author?: BlogPostAuthor
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  category: BlogCategory
  tags?: string[]
  published: boolean
  publishedAt?: string
  views: number
  likes: number
  commentsCount: number
  seo?: BlogPostSEO
  featured: boolean
  readTime: number
  createdAt: string
  updatedAt: string
}

export interface CreateBlogPostRequest {
  title: string
  excerpt: string
  content: string
  featuredImage?: string
  category: BlogCategory
  tags?: string[]
  published: boolean
  seo?: BlogPostSEO
}

export interface UpdateBlogPostRequest {
  title?: string
  excerpt?: string
  content?: string
  featuredImage?: string
  category?: BlogCategory
  tags?: string[]
  published?: boolean
  seo?: BlogPostSEO
}

export interface BlogPostFilters {
  category?: BlogCategory
  authorId?: string
  tag?: string
  search?: string
  published?: boolean
  featured?: boolean
  page?: number
  limit?: number
}

export interface BlogCategoryInfo {
  value: BlogCategory
  label: string
  description: string
  postCount: number
}

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  myPosts?: number
}

// ============================================
// CATEGORIAS DISPONÍVEIS
// ============================================

export const BLOG_CATEGORIES: { value: BlogCategory; label: string; description: string }[] = [
  { value: 'sustentabilidade', label: 'Sustentabilidade', description: 'Posts sobre arquitetura sustentável' },
  { value: 'tendencias', label: 'Tendências', description: 'Tendências do mercado de arquitetura' },
  { value: 'dicas', label: 'Dicas', description: 'Dicas e truques de arquitetura' },
  { value: 'projetos', label: 'Projetos', description: 'Apresentação de projetos' },
  { value: 'materiais', label: 'Materiais', description: 'Materiais e acabamentos' },
  { value: 'interiores', label: 'Interiores', description: 'Design de interiores' },
  { value: 'reforma', label: 'Reforma', description: 'Reformas e renovações' },
  { value: 'noticias', label: 'Notícias', description: 'Notícias do setor' },
]

// ============================================
// SERVIÇO DE BLOG
// ============================================

export const blogService = {
  /**
   * Lista posts do blog com filtros (público)
   */
  list: async (filters?: BlogPostFilters): Promise<ApiResponse<PaginatedResponse<BlogPost>>> => {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.authorId) params.append('authorId', filters.authorId)
    if (filters?.tag) params.append('tag', filters.tag)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.published !== undefined) params.append('published', String(filters.published))
    if (filters?.featured !== undefined) params.append('featured', String(filters.featured))
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const query = params.toString()
    return api.get<PaginatedResponse<BlogPost>>(`/public/blog/posts${query ? `?${query}` : ''}`)
  },

  /**
   * Busca um post pelo slug (público)
   */
  getBySlug: async (slug: string): Promise<ApiResponse<BlogPost>> => {
    return api.get<BlogPost>(`/public/blog/posts/by-slug/${slug}`)
  },

  /**
   * Cria um novo post
   */
  create: async (data: CreateBlogPostRequest): Promise<ApiResponse<BlogPost>> => {
    return api.post<BlogPost>('/blog/posts', data)
  },

  /**
   * Atualiza um post
   */
  update: async (id: string, data: UpdateBlogPostRequest): Promise<ApiResponse<BlogPost>> => {
    return api.put<BlogPost>(`/blog/posts/${id}`, data)
  },

  /**
   * Deleta um post
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/blog/posts/${id}`)
  },

  /**
   * Curte um post
   */
  like: async (id: string): Promise<ApiResponse<BlogPost>> => {
    return api.post<BlogPost>(`/blog/posts/${id}/like`)
  },

  /**
   * Remove a curtida de um post
   */
  unlike: async (id: string): Promise<ApiResponse<BlogPost>> => {
    return api.delete<BlogPost>(`/blog/posts/${id}/like`)
  },

  /**
   * Busca posts em destaque (público)
   */
  getFeatured: async (limit = 5): Promise<ApiResponse<BlogPost[]>> => {
    return api.get<BlogPost[]>(`/public/blog/posts/featured?limit=${limit}`)
  },

  /**
   * Busca posts populares (público)
   */
  getPopular: async (limit = 10): Promise<ApiResponse<BlogPost[]>> => {
    return api.get<BlogPost[]>(`/public/blog/posts/popular?limit=${limit}`)
  },

  /**
   * Busca posts recentes (público)
   */
  getRecent: async (limit = 10): Promise<ApiResponse<BlogPost[]>> => {
    return api.get<BlogPost[]>(`/public/blog/posts/recent?limit=${limit}`)
  },

  /**
   * Busca posts relacionados (público)
   */
  getRelated: async (postId: string, limit = 5): Promise<ApiResponse<BlogPost[]>> => {
    return api.get<BlogPost[]>(`/public/blog/posts/related/${postId}?limit=${limit}`)
  },

  /**
   * Busca posts de um autor (público)
   */
  getByAuthor: async (authorId: string, limit = 10): Promise<ApiResponse<BlogPost[]>> => {
    return api.get<BlogPost[]>(`/public/blog/author/${authorId}?limit=${limit}`)
  },

  /**
   * Busca meus posts (incluindo rascunhos)
   */
  getMyPosts: async (limit = 50): Promise<ApiResponse<BlogPost[]>> => {
    return api.get<BlogPost[]>(`/blog/posts/my?limit=${limit}`)
  },

  /**
   * Busca categorias disponíveis (público)
   */
  getCategories: async (): Promise<ApiResponse<BlogCategoryInfo[]>> => {
    return api.get<BlogCategoryInfo[]>('/public/blog/categories')
  },

  /**
   * Busca estatísticas do blog
   */
  getStats: async (): Promise<ApiResponse<BlogStats>> => {
    return api.get<BlogStats>('/blog/stats')
  },
}

export default blogService


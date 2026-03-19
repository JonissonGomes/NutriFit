import { api } from './api'
import type { ApiResponse } from '../types/api'
import type { PublicProfile } from '../types/api'

// ============================================
// TIPOS
// ============================================

export interface GeoLocation {
  latitude: number
  longitude: number
  city?: string
  state?: string
  country?: string
  address?: string
  source?: 'browser' | 'ip' | 'manual'
}

export interface ProximityResult {
  profile: PublicProfile
  distanceKm: number
}

export interface ProximitySearchResponse {
  results: ProximityResult[]
  total: number
  page: number
  limit: number
  radiusKm: number
  center: GeoLocation
}

export interface ProximitySearchFilters {
  latitude: number
  longitude: number
  radiusKm?: number
  categories?: string[]
  minRating?: number
  verified?: boolean
  page?: number
  limit?: number
}

export interface LocationSearchFilters {
  city?: string
  state?: string
  page?: number
  limit?: number
}

export interface DistanceResult {
  distanceKm: number
  from: { latitude: number; longitude: number }
  to: { latitude: number; longitude: number }
}

// ============================================
// SERVIÇO DE GEOLOCALIZAÇÃO
// ============================================

export const geolocationService = {
  /**
   * Obtém a localização atual do usuário via browser
   */
  getCurrentPosition: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          let message = 'Erro ao obter localização'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permissão de localização negada'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Localização não disponível'
              break
            case error.TIMEOUT:
              message = 'Tempo esgotado ao obter localização'
              break
          }
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache de 5 minutos
        }
      )
    })
  },

  /**
   * Obtém localização aproximada via IP (fallback)
   */
  getLocationFromIP: async (): Promise<ApiResponse<GeoLocation>> => {
    return api.get<GeoLocation>('/geo/my-location')
  },

  /**
   * Busca profissionais próximos a uma localização
   */
  searchNearby: async (filters: ProximitySearchFilters): Promise<ApiResponse<ProximitySearchResponse>> => {
    const params = new URLSearchParams()
    params.append('lat', String(filters.latitude))
    params.append('lng', String(filters.longitude))
    if (filters.radiusKm) params.append('radius', String(filters.radiusKm))
    if (filters.categories?.length) params.append('categories', filters.categories.join(','))
    if (filters.minRating) params.append('minRating', String(filters.minRating))
    if (filters.verified !== undefined) params.append('verified', String(filters.verified))
    if (filters.page) params.append('page', String(filters.page))
    if (filters.limit) params.append('limit', String(filters.limit))

    return api.get<ProximitySearchResponse>(`/geo/nearby?${params.toString()}`)
  },

  /**
   * Busca profissionais por cidade/estado
   */
  searchByLocation: async (filters: LocationSearchFilters): Promise<ApiResponse<ProximitySearchResponse>> => {
    const params = new URLSearchParams()
    if (filters.city) params.append('city', filters.city)
    if (filters.state) params.append('state', filters.state)
    if (filters.page) params.append('page', String(filters.page))
    if (filters.limit) params.append('limit', String(filters.limit))

    return api.get<ProximitySearchResponse>(`/geo/search?${params.toString()}`)
  },

  /**
   * Autocomplete de endereços/cidades (via Nominatim no backend)
   */
  autocompleteAddress: async (
    query: string,
    limit: number = 5
  ): Promise<ApiResponse<{ suggestions: { label: string; value: string }[] }>> => {
    const params = new URLSearchParams()
    params.set('query', query)
    params.set('limit', String(limit))
    return api.get(`/geo/address-autocomplete?${params.toString()}`, { requiresAuth: false })
  },

  /**
   * Atualiza a localização do usuário autenticado
   */
  updateMyLocation: async (location: GeoLocation): Promise<ApiResponse<{ success: boolean; location: GeoLocation }>> => {
    return api.put<{ success: boolean; location: GeoLocation }>('/profile/location', location)
  },

  /**
   * Busca cidades disponíveis (com profissionais cadastrados)
   */
  getAvailableCities: async (state?: string): Promise<ApiResponse<{ cities: string[] }>> => {
    const params = state ? `?state=${encodeURIComponent(state)}` : ''
    return api.get<{ cities: string[] }>(`/geo/cities${params}`)
  },

  /**
   * Busca estados disponíveis (com profissionais cadastrados)
   */
  getAvailableStates: async (): Promise<ApiResponse<{ states: string[] }>> => {
    return api.get<{ states: string[] }>('/geo/states')
  },

  /**
   * Calcula distância entre dois pontos
   */
  calculateDistance: async (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): Promise<ApiResponse<DistanceResult>> => {
    return api.get<DistanceResult>(`/geo/distance?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`)
  },

  /**
   * Calcula distância localmente usando Haversine
   */
  calculateDistanceLocal: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const earthRadiusKm = 6371

    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180
    const deltaLng = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(earthRadiusKm * c * 10) / 10
  },

  /**
   * Formata distância para exibição
   */
  formatDistance: (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`
    }
    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`
    }
    return `${Math.round(distanceKm)} km`
  },

  /**
   * Obtém localização com fallback automático
   */
  getLocation: async (): Promise<GeoLocation> => {
    try {
      // Tentar via browser primeiro
      const position = await geolocationService.getCurrentPosition()
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'browser',
      }
    } catch {
      // Fallback para IP
      const response = await geolocationService.getLocationFromIP()
      if (response.data) {
        return {
          ...response.data,
          source: 'ip',
        }
      }
      // Default para São Paulo
      return {
        latitude: -23.5505,
        longitude: -46.6333,
        city: 'São Paulo',
        state: 'SP',
        country: 'Brazil',
        source: 'ip',
      }
    }
  },
}

export default geolocationService


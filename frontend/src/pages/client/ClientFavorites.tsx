import React, { useState, useEffect } from 'react'
import { Favorite, Star } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { favoritesService } from '../../services'

interface FavoriteNutritionist {
  id: string
  username: string
  displayName: string
  avatar?: string
  city?: string
  state?: string
  specialties: string[]
  rating: number
  reviewCount: number
}

const ClientFavorites: React.FC = () => {
  const { showToast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteNutritionist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setIsLoading(true)
    try {
      const response = await favoritesService.listFavorites(1, 50)
      if (response.data && Array.isArray(response.data.data)) {
        // Transformar dados do backend para o formato esperado
        const favoritesData = response.data.data.map((fav: any) => {
          const profile = fav.profile || fav.nutritionist || fav.architect
          return {
            id: fav.nutritionistId || fav.architectId || fav.id || '',
            username: profile?.username || '',
            displayName: profile?.displayName || profile?.name || '',
            avatar: profile?.avatar,
            city: profile?.location?.address?.city,
            state: profile?.location?.address?.state,
            specialties: profile?.specialties || [],
            rating: profile?.rating || 0,
            reviewCount: profile?.reviewsCount || profile?.reviewCount || 0,
          } as FavoriteNutritionist
        })
        setFavorites(favoritesData)
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: se a resposta for um array direto
        setFavorites(response.data as unknown as FavoriteNutritionist[])
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
      showToast('Erro ao carregar favoritos', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (nutritionistId: string) => {
    setRemovingId(nutritionistId)
    try {
      await favoritesService.removeFavorite(nutritionistId)
      setFavorites(prev => prev.filter(f => f.id !== nutritionistId))
      showToast('Nutricionista removido dos favoritos', 'success')
    } catch {
      showToast('Erro ao remover dos favoritos', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nutricionistas Favoritos</h1>
        <p className="text-gray-600">Seus nutricionistas salvos para referência rápida</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Favorite className="text-6xl mb-4 text-red-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum favorito ainda
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Explore nossos nutricionistas e salve seus favoritos clicando no ícone de coração.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Descobrir Nutricionistas
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((nutritionist) => (
            <div key={nutritionist.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {nutritionist.avatar ? (
                      <img src={nutritionist.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">
                        {nutritionist.displayName?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{nutritionist.displayName}</h3>
                    <p className="text-sm text-gray-500">
                      {nutritionist.city && nutritionist.state ? `${nutritionist.city}, ${nutritionist.state}` : 'Localização não informada'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(nutritionist.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                  title="Remover dos favoritos"
                >
                  <Favorite className="text-xl" />
                </button>
              </div>

              {/* Especialidades */}
              <div className="flex flex-wrap gap-2 mb-4">
                {nutritionist.specialties?.slice(0, 3).map((spec, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {spec}
                  </span>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <Star className="text-yellow-500" />
                <span className="font-medium">{nutritionist.rating?.toFixed(1) || '—'}</span>
                <span className="text-gray-400">({nutritionist.reviewCount || 0} avaliações)</span>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Link
                  to={`/portfolio/${nutritionist.username}`}
                  className="flex-1 px-4 py-2 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Ver perfil
                </Link>
                <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm">
                  Mensagem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientFavorites


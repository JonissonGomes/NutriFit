import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { exploreService } from '../../services'
import type { PublicProfile } from '../../types/api'

const Community = () => {
  const [creators, setCreators] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCreators = async () => {
      setLoading(true)

      // Buscar arquitetos em destaque
      const response = await exploreService.searchArchitects({
        limit: 4,
        verified: true, // Priorizar verificados
      })

      if (response.data) {
        setCreators(response.data.data || [])
      }

      setLoading(false)
    }

    loadCreators()
  }, [])

  // Formatar localização
  const formatLocation = (profile: PublicProfile): string => {
    if (!profile.location?.address) return 'Localização não informada'
    const { city, state } = profile.location.address
    if (city && state) return `${city}, ${state}`
    if (city) return city
    if (state) return state
    return 'Localização não informada'
  }

  // Avatar fallback
  const renderAvatar = (profile: PublicProfile) => {
    if (profile.avatar) {
      return (
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
        />
      )
    }
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold border-2 border-primary-100">
        {profile.displayName.charAt(0).toUpperCase()}
      </div>
    )
  }

  if (loading) {
    return (
      <section id="comunidade" className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Comunidade de arquitetos
            </h2>
            <p className="text-xl text-gray-600">
              Carregando arquitetos...
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Se não houver arquitetos, não exibir a seção
  if (creators.length === 0) {
    return null
  }

  return (
    <section id="comunidade" className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Comunidade de arquitetos
          </h2>
          <p className="text-xl text-gray-600">
            Encontre arquitetos e designers por região. Descubra escritórios e profissionais especializados em projetos residenciais, comerciais e interiores.
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              to={`/portfolio/${creator.username}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                {renderAvatar(creator)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{creator.displayName}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formatLocation(creator)}</span>
                  </div>
                </div>
              </div>

              {/* Specialty */}
              {creator.specialty && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                    {creator.specialty}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {creator.ratings?.average?.toFixed(1) || 'Novo'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {creator.projectsCount || 0} projetos
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/explore" className="text-primary-600 hover:text-primary-700 font-semibold text-lg">
            Ver todos os arquitetos →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Community

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Star } from 'lucide-react'
import { exploreService } from '../../services'
import type { PublicProfile } from '../../types/api'

const FeaturedProjects = () => {
  const [nutritionists, setNutritionists] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const response = await exploreService.searchArchitects({
        limit: 4,
        verified: true,
      })
      if (response.data?.data) {
        setNutritionists(response.data.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Nutricionistas em destaque
            </h2>
            <p className="text-xl text-gray-600">
              Carregando...
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl bg-primary-100 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (nutritionists.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Nutricionistas em destaque
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Conheça profissionais verificados da nossa comunidade. Especialidades em emagrecimento, performance, saúde e mais.
          </p>
          <Link
            to="/explore"
            className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 mx-auto justify-center"
          >
            Ver todos os nutricionistas
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {nutritionists.map((profile) => (
            <Link
              key={profile.id}
              to={`/portfolio/${profile.username}`}
              className="group bg-white rounded-xl border border-primary-100 p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                    {profile.displayName?.charAt(0).toUpperCase() || 'N'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{profile.displayName}</h3>
                  {profile.specialty && (
                    <span className="text-sm text-primary-600">{profile.specialty}</span>
                  )}
                </div>
              </div>
              {profile.ratings?.average != null && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-accent-500 fill-accent-500" />
                  <span className="font-semibold text-gray-900">
                    {profile.ratings.average.toFixed(1)}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects

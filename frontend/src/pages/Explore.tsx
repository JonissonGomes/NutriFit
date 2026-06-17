import { useState, useEffect, useRef } from 'react'
import { CheckCircle } from '@mui/icons-material'
import { Search, MapPin, Star, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { exploreService } from '../services'
import { INPUT_LIMITS, limitLength, sanitizeInput } from '../utils/inputUtils'
import { useToast } from '../contexts/ToastContext'
import { getProfileAvatarUrl, getProfileCoverUrl } from '../utils/mediaUrl'
import type { PublicProfile } from '../types/api'

const categories = [
  { value: '', label: 'Todas as categorias' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'ganho-massa', label: 'Ganho de massa' },
  { value: 'nutricao-esportiva', label: 'Nutrição esportiva' },
  { value: 'clinica', label: 'Nutrição clínica' },
  { value: 'vegetariana', label: 'Vegetariana/vegana' },
  { value: 'saude-intestinal', label: 'Saúde intestinal' },
]

const locations = [
  { value: '', label: 'Todas as localizações' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PR', label: 'Paraná' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'DF', label: 'Distrito Federal' },
]

const formatLocation = (profile: PublicProfile): string => {
  if (!profile.location?.address) return 'Localização não informada'
  const { city, state } = profile.location.address
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  return 'Localização não informada'
}

const formatRating = (profile: PublicProfile): string => {
  if (!profile.ratings || profile.ratings.total === 0) return 'Novo'
  return profile.ratings.average.toFixed(1)
}

const NutritionistCard = ({ profile }: { profile: PublicProfile }) => {
  const [coverFailed, setCoverFailed] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  const coverUrl = getProfileCoverUrl(profile)
  const avatarUrl = getProfileAvatarUrl(profile)
  const showCover = coverUrl && !coverFailed
  const showAvatar = avatarUrl && !avatarFailed

  return (
    <Link
      to={`/profile/${profile.username}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800">
        {showCover ? (
          <img
            src={coverUrl}
            alt={`Capa de ${profile.displayName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setCoverFailed(true)}
          />
        ) : null}

        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-sm">{formatRating(profile)}</span>
        </div>
        {profile.boost?.active && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3" />
            Destaque
          </div>
        )}
        {profile.verification?.verified && (
          <div className="absolute bottom-4 left-4 bg-green-500 px-2 py-1 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-1">
            <CheckCircle sx={{ fontSize: 14 }} />
            Verificado
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {showAvatar ? (
            <img
              src={avatarUrl}
              alt={profile.displayName}
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover bg-white shrink-0"
              loading="lazy"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shrink-0 border-2 border-white shadow-sm">
              {profile.displayName?.charAt(0).toUpperCase() || 'N'}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
              {profile.displayName}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {formatLocation(profile)}
            </p>
          </div>
        </div>

        {profile.specialty && (
          <div className="mb-2">
            <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
              {profile.specialty}
            </span>
          </div>
        )}

        {profile.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{profile.bio}</p>
        )}

        {profile.specialties && profile.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.specialties.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-gray-600 text-sm">
            <Building2 className="h-4 w-4" />
            <span>{profile.projectsCount || 0} atendimentos</span>
          </div>
          {profile.experience && (
            <span className="text-sm font-medium text-primary-600">{profile.experience}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

const Explore = () => {
  const { showToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [architects, setArchitects] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      const response = await exploreService.searchArchitects({
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        state: selectedLocation || undefined,
      })

      if (response.data) {
        setArchitects(response.data.data || [])
      } else if (response.error) {
        showToast(response.error, 'error')
      }

      setLoading(false)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, selectedCategory, selectedLocation, showToast])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="app-page-title">Encontre o Nutricionista Ideal</h1>
          <p className="app-page-subtitle mt-1">
            Conecte-se com profissionais qualificados para o seu acompanhamento
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar por nome, especialidade ou área de atuação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(limitLength(sanitizeInput(e.target.value), INPUT_LIMITS.SEARCH_QUERY))}
                maxLength={INPUT_LIMITS.SEARCH_QUERY}
                className="w-full h-full min-h-[44px] pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Categoria"
              className="w-full lg:w-52 min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              {categories.map((category) => (
                <option key={category.value || 'all'} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              aria-label="Localização"
              className="w-full lg:w-52 min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              {locations.map((location) => (
                <option key={location.value || 'all'} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{architects.length}</span>{' '}
            {architects.length === 1 ? 'nutricionista encontrado' : 'nutricionistas encontrados'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Carregando nutricionistas...</div>
        ) : architects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {architects.map((architect) => (
              <NutritionistCard key={architect.id || architect.username} profile={architect} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum nutricionista encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou o termo de busca</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Explore

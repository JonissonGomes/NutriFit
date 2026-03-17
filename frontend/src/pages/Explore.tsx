import { useState, useEffect } from 'react'
import { CheckCircle } from '@mui/icons-material'
import { Search, MapPin, Star, Building2, Filter, ChevronDown, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { exploreService } from '../services'
import { useToast } from '../contexts/ToastContext'
import type { PublicProfile } from '../types/api'

const Explore = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [architects, setArchitects] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const categories = [
    { value: '', label: 'Todas as Categorias' },
    { value: 'emagrecimento', label: 'Emagrecimento' },
    { value: 'ganho-massa', label: 'Ganho de massa' },
    { value: 'nutricao-esportiva', label: 'Nutrição esportiva' },
    { value: 'clinica', label: 'Nutrição clínica' },
    { value: 'vegetariana', label: 'Vegetariana/vegana' },
    { value: 'saude-intestinal', label: 'Saúde intestinal' },
  ]

  // Estados brasileiros
  const locations = [
    { value: '', label: 'Todas as Localizações' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PR', label: 'Paraná' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'DF', label: 'Distrito Federal' },
  ]

  // Carregar arquitetos
  useEffect(() => {
    const loadArchitects = async () => {
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
    }

    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(loadArchitects, 300)
    setSearchTimeout(timeout)

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTerm, selectedCategory, selectedLocation])

  // Formatar localização
  const formatLocation = (profile: PublicProfile): string => {
    if (!profile.location?.address) return 'Localização não informada'
    const { city, state } = profile.location.address
    if (city && state) return `${city}, ${state}`
    if (city) return city
    if (state) return state
    return 'Localização não informada'
  }

  // Formatar rating
  const formatRating = (profile: PublicProfile): string => {
    if (!profile.ratings || profile.ratings.total === 0) return 'Novo'
    return profile.ratings.average.toFixed(1)
  }

  // Avatar fallback
  const renderAvatar = (profile: PublicProfile) => {
    if (profile.avatar) {
      return (
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="w-12 h-12 rounded-full border-2 border-gray-200"
        />
      )
    }
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
        {profile.displayName.charAt(0).toUpperCase()}
      </div>
    )
  }

  // Cover image fallback
  const getCoverImage = (profile: PublicProfile): string => {
    if (profile.coverImage) return profile.coverImage
    // Placeholder baseado na especialidade
    const placeholders: Record<string, string> = {
      residencial: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop',
      comercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
      interiores: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=400&fit=crop',
      sustentavel: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=400&fit=crop',
      reforma: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=400&fit=crop',
      urbanismo: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=400&fit=crop',
    }
    
    // Tentar encontrar placeholder baseado na especialidade
    const specialty = profile.specialty?.toLowerCase() || ''
    for (const [key, url] of Object.entries(placeholders)) {
      if (specialty.includes(key)) return url
    }
    
    return placeholders.residencial
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Encontre o Nutricionista Ideal
          </h1>
          <p className="text-gray-600 text-lg">
            Conecte-se com profissionais qualificados para o seu projeto
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou área de atuação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg mb-4"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{architects.length}</span>{' '}
            {architects.length === 1 ? 'nutricionista encontrado' : 'nutricionistas encontrados'}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 text-gray-600">
            Carregando nutricionistas...
          </div>
        ) : architects.length > 0 ? (
          /* Architects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {architects.map((architect) => (
              <Link
                key={architect.id}
                to={`/portfolio/${architect.username}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getCoverImage(architect)}
                    alt={architect.displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-sm">{formatRating(architect)}</span>
                  </div>
                  {architect.boost?.active && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                      <Star className="text-xs" />
                      Destaque
                    </div>
                  )}
                  {architect.verification?.verified && (
                    <div className="absolute bottom-4 left-4 bg-green-500 px-2 py-1 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                      <CheckCircle className="text-xs" />
                      Verificado
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-3 mb-4">
                    {renderAvatar(architect)}
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {architect.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatLocation(architect)}
                      </p>
                    </div>
                  </div>

                  {/* Specialty */}
                  {architect.specialty && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                        {architect.specialty}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {architect.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {architect.bio}
                    </p>
                  )}

                  {/* Specialties Tags */}
                  {architect.specialties && architect.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {architect.specialties.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Building2 className="h-4 w-4" />
                      <span>{architect.projectsCount || 0} projetos</span>
                    </div>
                    {architect.experience && (
                      <span className="text-sm font-medium text-primary-600">
                        {architect.experience}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum arquiteto encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Explore

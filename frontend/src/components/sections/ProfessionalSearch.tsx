import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Filter, X } from 'lucide-react'
import { geolocationService } from '../../services/geolocation.service'

const ProfessionalSearch = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const locationSearchTimeout = useRef<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    'Emagrecimento',
    'Ganho de massa',
    'Performance',
    'Saúde geral',
    'Gestante',
    'Vegetariano',
    'Vegano',
    'Intolerâncias',
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (location) params.set('location', location)
    if (selectedCategory) params.set('category', selectedCategory)

    navigate(`/explore?${params.toString()}`)
  }

  const handleQuickSearch = (category: string) => {
    navigate(`/explore?category=${category}`)
  }

  useEffect(() => {
    if (locationSearchTimeout.current) {
      window.clearTimeout(locationSearchTimeout.current)
    }

    const q = location.trim()
    if (!q || q.length < 2) {
      setLocationSuggestions([])
      setIsSearchingLocation(false)
      return
    }

    setIsSearchingLocation(true)
    locationSearchTimeout.current = window.setTimeout(async () => {
      try {
        const resp = await geolocationService.autocompleteAddress(q, 6)
        const suggestions = resp.data?.suggestions?.map((s) => s.value) ?? []
        setLocationSuggestions(suggestions)
      } finally {
        setIsSearchingLocation(false)
      }
    }, 350)

    return () => {
      if (locationSearchTimeout.current) {
        window.clearTimeout(locationSearchTimeout.current)
      }
    }
  }, [location])

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-primary-50/50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-4">
            Encontre o nutricionista ideal para você
          </h2>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">
            Busque por especialidade, localização ou explore profissionais verificados
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-primary-100 p-4 md:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, especialidade ou palavra-chave..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-stone-900 placeholder-stone-400"
                />
              </div>

              <div className="md:w-64 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Localização (cidade, estado)"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-stone-900 placeholder-stone-400"
                />
                {(isSearchingLocation || locationSuggestions.length > 0) && (
                  <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
                    {isSearchingLocation ? (
                      <div className="px-4 py-2 text-sm text-stone-500">Buscando...</div>
                    ) : (
                      locationSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm hover:bg-stone-50"
                          onClick={() => {
                            setLocation(s)
                            setLocationSuggestions([])
                          }}
                        >
                          {s}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg shadow-primary-600/30 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-stone-600 hover:text-primary-600 transition-colors text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Ocultar' : 'Mostrar'} filtros</span>
              </button>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-stone-200">
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm font-medium text-stone-700 self-center">Objetivo / Especialidade:</span>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-primary-50 hover:text-primary-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('')}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-stone-200 text-stone-700 hover:bg-stone-300 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-stone-700 mb-4">Buscar por objetivo:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleQuickSearch(category)}
                className="px-4 py-3 rounded-xl bg-white border border-primary-100 hover:border-primary-500 hover:bg-primary-50 text-stone-700 hover:text-primary-700 font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-stone-600 mb-4">
            Não encontrou o que procura?
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-4 transition-colors"
          >
            Ver todos os nutricionistas
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProfessionalSearch

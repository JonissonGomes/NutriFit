import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Filter, X } from 'lucide-react'

const ProfessionalSearch = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    'Residencial',
    'Comercial',
    'Interiores',
    'Reforma',
    'Paisagismo',
    'Sustentável'
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

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-stone-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-4">
            Encontre o arquiteto ideal para seu projeto
          </h2>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">
            Busque por especialidade, localização ou explore nossos profissionais verificados
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 md:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
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

              {/* Location Input */}
              <div className="md:w-64 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Localização (cidade, estado)"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-stone-900 placeholder-stone-400"
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>

            {/* Filters Toggle */}
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

            {/* Filters Panel */}
            {showFilters && (
              <div className="pt-4 border-t border-stone-200 animate-in slide-in-from-top-2">
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm font-medium text-stone-700 self-center">Categoria:</span>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
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

        {/* Quick Search Categories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-stone-700 mb-4">Buscar por categoria:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleQuickSearch(category)}
                className="px-4 py-3 rounded-xl bg-white border border-stone-200 hover:border-primary-500 hover:bg-primary-50 text-stone-700 hover:text-primary-700 font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-stone-600 mb-4">
            Não encontrou o que procura?
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-4 transition-colors"
          >
            Ver todos os arquitetos
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProfessionalSearch





import { useState } from 'react'
import GridViewIcon from '@mui/icons-material/GridView'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel'
import StarIcon from '@mui/icons-material/Star'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import WorkIcon from '@mui/icons-material/Work'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  type ProfileCustomization,
  type ProfileLayoutType,
  LAYOUT_OPTIONS,
  GRID_COLUMN_OPTIONS,
  HERO_STYLE_OPTIONS,
  PROJECT_CARD_STYLE_OPTIONS,
  BACKGROUND_STYLE_OPTIONS,
  DEFAULT_CUSTOMIZATION,
} from '../../services/profile.service'

interface LayoutCustomizerProps {
  customization?: ProfileCustomization
  onChange: (customization: ProfileCustomization) => void
}

const LAYOUT_ICONS: Record<ProfileLayoutType, React.ReactNode> = {
  grid: <GridViewIcon sx={{ fontSize: 24 }} />,
  masonry: <DashboardIcon sx={{ fontSize: 24 }} />,
  carousel: <ViewCarouselIcon sx={{ fontSize: 24 }} />,
  featured: <StarIcon sx={{ fontSize: 24 }} />,
  minimalist: <CropSquareIcon sx={{ fontSize: 24 }} />,
  portfolio: <WorkIcon sx={{ fontSize: 24 }} />,
}

const LayoutCustomizer = ({ customization = DEFAULT_CUSTOMIZATION, onChange }: LayoutCustomizerProps) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'options' | 'style'>('layout')

  const handleChange = <K extends keyof ProfileCustomization>(
    key: K,
    value: ProfileCustomization[K]
  ) => {
    onChange({ ...customization, [key]: value })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">Personalização do Perfil</h2>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Escolha como seus projetos serão exibidos para os visitantes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'layout', label: 'Layout' },
          { id: 'options', label: 'Opções' },
          { id: 'style', label: 'Estilo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Layout Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Estilo de Exibição dos Projetos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LAYOUT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('layout', option.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      customization.layout === option.value
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {customization.layout === option.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                      </div>
                    )}
                    <div className={`mb-2 ${
                      customization.layout === option.value ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      {LAYOUT_ICONS[option.value]}
                    </div>
                    <h3 className={`font-semibold text-sm ${
                      customization.layout === option.value ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Columns (only for grid and masonry layouts) */}
            {['grid', 'masonry', 'featured'].includes(customization.layout) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Número de Colunas
                </label>
                <div className="flex gap-3">
                  {GRID_COLUMN_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('gridColumns', option.value)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                        customization.gridColumns === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Escolha o que será exibido no seu perfil público
            </p>
            
            {[
              { key: 'showStats', label: 'Mostrar Estatísticas', description: 'Exibe número de projetos, visualizações e avaliações' },
              { key: 'showServices', label: 'Mostrar Serviços', description: 'Lista os serviços que você oferece' },
              { key: 'showReviews', label: 'Mostrar Avaliações', description: 'Exibe avaliações de clientes anteriores' },
              { key: 'showContact', label: 'Mostrar Contato', description: 'Exibe informações de contato (email, telefone, etc)' },
              { key: 'show3DModels', label: 'Mostrar Projetos 3D', description: 'Exibe seus modelos 3D no perfil público' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={customization[item.key as keyof ProfileCustomization] as boolean}
                  onChange={(e) => handleChange(item.key as keyof ProfileCustomization, e.target.checked as any)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                />
                <div>
                  <span className="block font-medium text-gray-900 text-sm">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Style Tab */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            {/* Hero Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Estilo do Cabeçalho
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {HERO_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('heroStyle', option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      customization.heroStyle === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-sm text-gray-900">{option.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Card Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Estilo dos Cards de Projeto
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PROJECT_CARD_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('projectCardStyle', option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      customization.projectCardStyle === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-sm text-gray-900">{option.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tema de Fundo
              </label>
              <div className="flex gap-3">
                {BACKGROUND_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('backgroundStyle', option.value)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                      customization.backgroundStyle === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customization.primaryColor || '#2563eb'}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
                <input
                  type="text"
                  value={customization.primaryColor || '#2563eb'}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="#2563eb"
                />
                <button
                  type="button"
                  onClick={() => handleChange('primaryColor', undefined as any)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Redefinir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Hint */}
      <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Salve as alterações para ver as mudanças no seu perfil público
        </p>
      </div>
    </div>
  )
}

export default LayoutCustomizer



import { useMemo } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility'
import StarIcon from '@mui/icons-material/Star'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import type { ProfileCustomization, PublicProfile } from '../../services/profile.service'

interface LayoutPreviewProps {
  profile: Partial<PublicProfile>
  customization: ProfileCustomization
}

// Projetos de exemplo para o preview
const SAMPLE_PROJECTS = [
  { id: '1', title: 'Residência Moderna', category: 'Residencial', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop' },
  { id: '2', title: 'Escritório Corporativo', category: 'Comercial', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop' },
  { id: '3', title: 'Casa de Campo', category: 'Residencial', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop' },
  { id: '4', title: 'Loft Industrial', category: 'Interiores', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop' },
  { id: '5', title: 'Apartamento Minimalista', category: 'Interiores', image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&h=300&fit=crop' },
  { id: '6', title: 'Centro Cultural', category: 'Institucional', image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=300&fit=crop' },
]

const LayoutPreview = ({ profile, customization }: LayoutPreviewProps) => {
  const bgClass = useMemo(() => {
    switch (customization.backgroundStyle) {
      case 'dark':
        return 'bg-gray-900 text-white'
      case 'gradient':
        return 'bg-gradient-to-br from-gray-50 via-primary-50 to-gray-100'
      default:
        return 'bg-gray-50'
    }
  }, [customization.backgroundStyle])

  const textClass = customization.backgroundStyle === 'dark' ? 'text-white' : 'text-gray-900'
  const subtextClass = customization.backgroundStyle === 'dark' ? 'text-gray-300' : 'text-gray-600'
  const cardBgClass = customization.backgroundStyle === 'dark' ? 'bg-gray-800' : 'bg-white'
  const borderClass = customization.backgroundStyle === 'dark' ? 'border-gray-700' : 'border-gray-200'

  const primaryColor = customization.primaryColor || '#2563eb'

  // Render Hero Section based on style
  const renderHero = () => {
    const heroHeight = customization.heroStyle === 'full' ? 'h-32' : customization.heroStyle === 'compact' ? 'h-20' : 'h-12'
    
    if (customization.heroStyle === 'minimal') {
      return (
        <div className={`p-4 ${cardBgClass} border-b ${borderClass}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {profile.displayName?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className={`font-bold text-sm ${textClass}`}>{profile.displayName || 'Nome do Arquiteto'}</h2>
              <p className={`text-xs ${subtextClass}`}>{profile.specialty || 'Arquitetura'}</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative">
        {/* Cover */}
        <div 
          className={`${heroHeight} bg-gradient-to-r from-gray-300 to-gray-400`}
          style={{ 
            backgroundImage: profile.coverImage ? `url(${profile.coverImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Profile Info */}
        <div className={`p-3 ${cardBgClass} ${customization.heroStyle === 'full' ? '-mt-6' : ''}`}>
          <div className="flex items-end gap-3">
            <div 
              className={`${customization.heroStyle === 'full' ? 'w-14 h-14 -mt-8' : 'w-10 h-10'} rounded-full flex items-center justify-center text-white font-bold border-2 ${customization.backgroundStyle === 'dark' ? 'border-gray-800' : 'border-white'} shadow-lg`}
              style={{ backgroundColor: primaryColor }}
            >
              {profile.displayName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h2 className={`font-bold text-sm ${textClass} truncate`}>
                  {profile.displayName || 'Nome do Arquiteto'}
                </h2>
                <VerifiedIcon sx={{ fontSize: 14, color: primaryColor }} />
              </div>
              <p className={`text-xs ${subtextClass} truncate`}>
                {profile.specialty || 'Arquitetura Residencial'}
              </p>
            </div>
          </div>
          
          {customization.heroStyle === 'full' && (
            <p className={`text-xs ${subtextClass} mt-2 line-clamp-2`}>
              {profile.bio || 'Descrição do arquiteto aparece aqui...'}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Render Stats Section
  const renderStats = () => {
    if (!customization.showStats) return null

    return (
      <div className={`grid grid-cols-3 gap-2 p-3 border-t ${borderClass}`}>
        {[
          { label: 'Projetos', value: profile.projectsCount || 12 },
          { label: 'Avaliações', value: profile.reviewsCount || 28 },
          { label: 'Views', value: '2.4k' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={`font-bold text-sm ${textClass}`}>{stat.value}</div>
            <div className={`text-xs ${subtextClass}`}>{stat.label}</div>
          </div>
        ))}
      </div>
    )
  }

  // Render Project Card based on style
  const renderProjectCard = (project: typeof SAMPLE_PROJECTS[0], index: number) => {
    const isMasonry = customization.layout === 'masonry'
    const height = isMasonry ? (index % 3 === 0 ? 'h-28' : index % 2 === 0 ? 'h-20' : 'h-24') : 'h-20'

    if (customization.projectCardStyle === 'overlay') {
      return (
        <div 
          key={project.id} 
          className={`relative ${height} rounded-lg overflow-hidden group cursor-pointer`}
        >
          <img 
            src={project.image} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
            <div>
              <h3 className="text-white font-medium text-xs truncate">{project.title}</h3>
              <p className="text-white/70 text-[10px]">{project.category}</p>
            </div>
          </div>
        </div>
      )
    }

    if (customization.projectCardStyle === 'detailed') {
      return (
        <div 
          key={project.id} 
          className={`${cardBgClass} rounded-lg overflow-hidden border ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
        >
          <div className={`${height} relative`}>
            <img 
              src={project.image} 
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-2">
            <h3 className={`font-medium text-xs ${textClass} truncate`}>{project.title}</h3>
            <p className={`text-[10px] ${subtextClass}`}>{project.category}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <VisibilityIcon sx={{ fontSize: 10 }} /> 234
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                <StarIcon sx={{ fontSize: 10 }} /> 4.8
              </span>
            </div>
          </div>
        </div>
      )
    }

    // Simple style (default)
    return (
      <div 
        key={project.id} 
        className={`${height} rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
      >
        <img 
          src={project.image} 
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Render Projects Grid based on layout
  const renderProjects = () => {
    const cols = customization.gridColumns
    const gridClass = `grid gap-2 ${cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3'}`
    const projects = SAMPLE_PROJECTS.slice(0, cols * 2)

    if (customization.layout === 'carousel') {
      return (
        <div className="p-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {projects.map((project) => (
              <div key={project.id} className="flex-shrink-0 w-32">
                {renderProjectCard(project, 0)}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (customization.layout === 'featured') {
      const featured = projects[0]
      const rest = projects.slice(1)
      
      return (
        <div className="p-3 space-y-2">
          {/* Featured */}
          <div className="relative h-32 rounded-lg overflow-hidden">
            <img 
              src={featured.image} 
              alt={featured.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
              <div>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full text-white mb-1 inline-block"
                  style={{ backgroundColor: primaryColor }}
                >
                  Destaque
                </span>
                <h3 className="text-white font-bold text-sm">{featured.title}</h3>
              </div>
            </div>
          </div>
          
          {/* Grid */}
          <div className={gridClass}>
            {rest.map((project, index) => renderProjectCard(project, index))}
          </div>
        </div>
      )
    }

    if (customization.layout === 'minimalist') {
      return (
        <div className="p-3">
          <div className="space-y-2">
            {projects.slice(0, 3).map((project) => (
              <div 
                key={project.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${cardBgClass} border ${borderClass}`}
              >
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-xs ${textClass} truncate`}>{project.title}</h3>
                  <p className={`text-[10px] ${subtextClass}`}>{project.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (customization.layout === 'portfolio') {
      return (
        <div className="p-3">
          {projects.slice(0, 2).map((project) => (
            <div 
              key={project.id}
              className={`mb-3 last:mb-0 ${cardBgClass} rounded-lg overflow-hidden border ${borderClass}`}
            >
              <div className="h-24">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className={`font-bold text-sm ${textClass}`}>{project.title}</h3>
                <p className={`text-xs ${subtextClass} mt-1`}>{project.category} • 2024</p>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Grid or Masonry
    return (
      <div className="p-3">
        <div className={gridClass}>
          {projects.map((project, index) => renderProjectCard(project, index))}
        </div>
      </div>
    )
  }

  // Render 3D Models Section
  const render3DModels = () => {
    if (!customization.show3DModels) return null

    const sample3DModels = [
      { id: '1', title: 'Modelo 3D - Residência', thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop' },
      { id: '2', title: 'Modelo 3D - Escritório', thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop' },
      { id: '3', title: 'Modelo 3D - Loft', thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=200&fit=crop' },
    ]

    return (
      <div className={`border-t ${borderClass}`}>
        <div className="px-3 pt-3 pb-1">
          <h3 className={`font-semibold text-xs ${textClass}`}>Modelos 3D</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {sample3DModels.map((model) => (
              <div 
                key={model.id}
                className={`relative aspect-square rounded-lg overflow-hidden ${cardBgClass} border ${borderClass} group cursor-pointer`}
              >
                <img 
                  src={model.thumbnail} 
                  alt={model.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-[10px] font-medium truncate w-full">{model.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render Contact Section
  const renderContact = () => {
    if (!customization.showContact) return null

    return (
      <div className={`p-3 border-t ${borderClass}`}>
        <div className="flex flex-wrap gap-2">
          {profile.location && (
            <span className={`flex items-center gap-1 text-[10px] ${subtextClass}`}>
              <LocationOnIcon sx={{ fontSize: 12 }} />
              {profile.location.address?.city || 'São Paulo'}
            </span>
          )}
          {profile.email && (
            <span className={`flex items-center gap-1 text-[10px] ${subtextClass}`}>
              <EmailIcon sx={{ fontSize: 12 }} />
              Contato
            </span>
          )}
          {profile.phone && (
            <span className={`flex items-center gap-1 text-[10px] ${subtextClass}`}>
              <PhoneIcon sx={{ fontSize: 12 }} />
              WhatsApp
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${borderClass} shadow-lg ${bgClass}`}>
      {/* Preview Label */}
      <div 
        className="px-3 py-1.5 text-[10px] font-semibold text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        Preview do Perfil
      </div>

      {/* Hero */}
      {renderHero()}

      {/* Stats */}
      {renderStats()}

      {/* Projects */}
      <div className={`border-t ${borderClass}`}>
        <div className="px-3 pt-3 pb-1">
          <h3 className={`font-semibold text-xs ${textClass}`}>Projetos</h3>
        </div>
        {renderProjects()}
      </div>

      {/* 3D Models */}
      {render3DModels()}

      {/* Contact */}
      {renderContact()}
    </div>
  )
}

export default LayoutPreview



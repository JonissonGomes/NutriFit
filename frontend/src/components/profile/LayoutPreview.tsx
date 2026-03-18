import { useMemo } from 'react'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import type { ProfileCustomization, PublicProfile } from '../../services/profile.service'

interface LayoutPreviewProps {
  profile: Partial<PublicProfile>
  customization: ProfileCustomization
}

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
              <h2 className={`font-bold text-sm ${textClass}`}>{profile.displayName || 'Nome do nutricionista'}</h2>
              <p className={`text-xs ${subtextClass}`}>{profile.specialty || 'Nutrição'}</p>
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
                  {profile.displayName || 'Nome do nutricionista'}
                </h2>
                <VerifiedIcon sx={{ fontSize: 14, color: primaryColor }} />
              </div>
              <p className={`text-xs ${subtextClass} truncate`}>
                {profile.specialty || 'Nutrição Clínica'}
              </p>
            </div>
          </div>
          
          {customization.heroStyle === 'full' && (
            <p className={`text-xs ${subtextClass} mt-2 line-clamp-2`}>
              {profile.bio || 'Escreva uma breve descrição sobre você e sua abordagem.'}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Render Stats Section
  const renderStats = () => {
    if (!customization.showStats) return null

    const viewsValue = typeof profile.viewsCount === 'number' ? profile.viewsCount : undefined

    return (
      <div className={`grid grid-cols-3 gap-2 p-3 border-t ${borderClass}`}>
        {[
          { label: 'Conteúdos', value: profile.projectsCount ?? 0 },
          { label: 'Avaliações', value: profile.reviewsCount ?? 0 },
          { label: 'Visualizações', value: viewsValue ?? '—' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={`font-bold text-sm ${textClass}`}>{stat.value}</div>
            <div className={`text-xs ${subtextClass}`}>{stat.label}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderContents = () => {
    return (
      <div className={`border-t ${borderClass}`}>
        <div className="px-3 pt-3 pb-1">
          <h3 className={`font-semibold text-xs ${textClass}`}>Conteúdos</h3>
          <p className={`text-[10px] ${subtextClass}`}>Posts e materiais compartilhados no NuFit</p>
        </div>
        <div className="p-3">
          <div className={`${cardBgClass} border ${borderClass} rounded-lg p-3`}>
            <p className={`text-xs ${subtextClass}`}>
              Nenhum conteúdo publicado ainda.
            </p>
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

      {/* Conteúdos */}
      {renderContents()}

      {/* Contact */}
      {renderContact()}
    </div>
  )
}

export default LayoutPreview



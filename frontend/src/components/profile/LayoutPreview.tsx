import { useMemo } from 'react'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import type { ProfileCustomization, PublicProfile } from '../../services/profile.service'
import { getProfileAvatarUrl, getProfileCoverUrl } from '../../utils/mediaUrl'
import {
  mergeCustomization,
  hasContactInfo,
  isEnabled,
  contentLayoutClass,
  projectCardClasses,
} from '../../utils/profileCustomization'

interface LayoutPreviewProps {
  profile: Partial<PublicProfile>
  customization: ProfileCustomization
}

const PREVIEW_CONTENT_ITEMS = [
  {
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=480&h=320&fit=crop',
    title: 'Alimentação equilibrada',
  },
  {
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=480&h=320&fit=crop',
    title: 'Saladas nutritivas',
  },
  {
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&fit=crop',
    title: 'Refeições coloridas',
  },
] as const

const PREVIEW_RECIPE_ITEMS = [
  {
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=320&h=200&fit=crop',
    title: 'Salmão grelhado',
  },
  {
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=320&h=200&fit=crop',
    title: 'Bowl proteico',
  },
] as const

const LayoutPreview = ({ profile, customization: rawCustomization }: LayoutPreviewProps) => {
  const customization = mergeCustomization(rawCustomization)
  const cardClasses = projectCardClasses(customization.projectCardStyle ?? 'simple')

  const showBio = isEnabled(customization.showBio) && Boolean(profile.bio?.trim())
  const showStats = isEnabled(customization.showStats)
  const showServices = isEnabled(customization.showServices) && Boolean(profile.specialties?.length)
  const showExperience = isEnabled(customization.showExperience) && Boolean(profile.experience?.trim())
  const showEducation = isEnabled(customization.showEducation) && Boolean(profile.education?.trim())
  const showAwards = isEnabled(customization.showAwards) && Boolean(profile.awards?.trim())
  const showProfessionalInfo = showExperience || showEducation || showAwards
  const showContents = isEnabled(customization.showContents)
  const showRecipes = isEnabled(customization.showRecipes)
  const showReviews = isEnabled(customization.showReviews)
  const showContact = isEnabled(customization.showContact) && hasContactInfo(profile as PublicProfile)

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
  const avatarUrl = getProfileAvatarUrl(profile)
  const coverUrl = getProfileCoverUrl(profile)
  const layoutType = customization.layout ?? 'grid'
  const contentsLayout = contentLayoutClass(layoutType, 3, customization.gridColumns)

  const renderAvatar = (sizeClass: string, overlapClass = '') => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={profile.displayName || 'Avatar'}
          className={`${sizeClass} ${overlapClass} rounded-full object-cover border-2 ${customization.backgroundStyle === 'dark' ? 'border-gray-800' : 'border-white'} shadow-lg`}
        />
      )
    }
    return (
      <div
        className={`${sizeClass} ${overlapClass} rounded-full flex items-center justify-center text-white font-bold border-2 ${customization.backgroundStyle === 'dark' ? 'border-gray-800' : 'border-white'} shadow-lg`}
        style={{ backgroundColor: primaryColor }}
      >
        {profile.displayName?.charAt(0) || 'A'}
      </div>
    )
  }

  const renderHero = () => {
    const heroHeight = customization.heroStyle === 'full' ? 'h-32' : customization.heroStyle === 'compact' ? 'h-20' : 'h-12'

    if (customization.heroStyle === 'minimal') {
      return (
        <div className={`p-4 ${cardBgClass} border-b ${borderClass}`}>
          <div className="flex items-center gap-3">
            {renderAvatar('w-12 h-12')}
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
        <div
          className={`${heroHeight} bg-gradient-to-r from-gray-300 to-gray-400`}
          style={{
            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className={`p-3 ${cardBgClass} ${customization.heroStyle === 'full' ? '-mt-6' : ''}`}>
          <div className="flex items-end gap-3">
            {renderAvatar(
              customization.heroStyle === 'full' ? 'w-14 h-14' : 'w-10 h-10',
              customization.heroStyle === 'full' ? '-mt-8' : ''
            )}
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
          {showBio && customization.heroStyle === 'full' && (
            <p className={`text-xs ${subtextClass} mt-2 line-clamp-2`}>{profile.bio}</p>
          )}
          {showServices && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.specialties?.slice(0, 4).map((s) => (
                <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-full ${customization.backgroundStyle === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} ${subtextClass}`}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderStats = () => {
    if (!showStats) return null
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

  const renderProfessionalInfo = () => {
    if (!showProfessionalInfo) return null
    return (
      <div className={`p-3 border-t ${borderClass}`}>
        <h3 className={`font-semibold text-xs ${textClass} mb-2`}>Trajetória profissional</h3>
        <div className="space-y-2">
          {showExperience && (
            <div className={`flex items-start gap-1.5 text-[10px] ${subtextClass}`}>
              <WorkIcon sx={{ fontSize: 12 }} />
              <span className="line-clamp-2">{profile.experience}</span>
            </div>
          )}
          {showEducation && (
            <div className={`flex items-start gap-1.5 text-[10px] ${subtextClass}`}>
              <SchoolIcon sx={{ fontSize: 12 }} />
              <span className="line-clamp-2">{profile.education}</span>
            </div>
          )}
          {showAwards && (
            <div className={`flex items-start gap-1.5 text-[10px] ${subtextClass}`}>
              <EmojiEventsIcon sx={{ fontSize: 12 }} />
              <span className="line-clamp-2">{profile.awards}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderContents = () => {
    if (!showContents) return null
    const cardStyle = customization.projectCardStyle ?? 'simple'
    const isOverlay = cardStyle === 'overlay'
    const showText = cardStyle === 'detailed' || isOverlay

    return (
      <div className={`border-t ${borderClass}`}>
        <div className="px-3 pt-3 pb-1">
          <h3 className={`font-semibold text-xs ${textClass}`}>Conteúdos</h3>
        </div>
        <div className="p-3">
          <div className={contentsLayout}>
            {PREVIEW_CONTENT_ITEMS.map((item) => (
              <div key={item.image} className={cardClasses.wrapper}>
                <img
                  src={item.image}
                  alt={item.title}
                  className={cardClasses.image}
                  loading="lazy"
                />
                {showText ? (
                  <div className={cardClasses.body}>
                    <p className={`${cardClasses.title} ${isOverlay ? '' : textClass}`}>{item.title}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderRecipes = () => {
    if (!showRecipes) return null
    return (
      <div className={`border-t ${borderClass} p-3`}>
        <h3 className={`font-semibold text-xs ${textClass} mb-2`}>Receitas</h3>
        <div className="grid grid-cols-2 gap-2">
          {PREVIEW_RECIPE_ITEMS.map((item) => (
            <div key={item.image} className={`${cardBgClass} border ${borderClass} rounded-lg overflow-hidden`}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-14 object-cover"
                loading="lazy"
              />
              <p className={`text-[10px] font-semibold ${textClass} px-2 py-1.5 truncate`}>{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderReviews = () => {
    if (!showReviews) return null
    return (
      <div className={`p-3 border-t ${borderClass}`}>
        <h3 className={`font-semibold text-xs ${textClass}`}>Avaliações</h3>
        <p className={`text-[10px] ${subtextClass} mt-1`}>Depoimentos de pacientes</p>
      </div>
    )
  }

  const renderContact = () => {
    if (!showContact) return null
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
              E-mail
            </span>
          )}
          {profile.phone && (
            <span className={`flex items-center gap-1 text-[10px] ${subtextClass}`}>
              <PhoneIcon sx={{ fontSize: 12 }} />
              Telefone
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${borderClass} shadow-lg ${bgClass}`}>
      <div
        className="px-3 py-1.5 text-[10px] font-semibold text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        Preview do Perfil
      </div>
      {renderHero()}
      {renderStats()}
      {renderProfessionalInfo()}
      {renderContents()}
      {renderRecipes()}
      {renderReviews()}
      {renderContact()}
    </div>
  )
}

export default LayoutPreview

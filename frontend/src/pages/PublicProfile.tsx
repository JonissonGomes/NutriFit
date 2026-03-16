import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import StarIcon from '@mui/icons-material/Star'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import ApartmentIcon from '@mui/icons-material/Apartment'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import VerifiedIcon from '@mui/icons-material/Verified'
import { profileService, favoritesService, projectService, model3dService, reviewService } from '../services'
import type { ReviewWithDetails } from '../services/review.service'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import type { Project } from '../types/api'
import type { PublicProfile as PublicProfileType } from '../services/profile.service'
import ConfirmModal from '../components/common/ConfirmModal'

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [models3D, setModels3D] = useState<any[]>([])
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showRemoveFavoriteModal, setShowRemoveFavoriteModal] = useState(false)
  const [removingFavorite, setRemovingFavorite] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await profileService.getPublicProfile(username)

      if (response.data) {
        setProfile(response.data)
        // Carregar projetos do arquiteto
        if (response.data?.userId) {
          const projectsResponse = await projectService.list()
          if (projectsResponse.data) {
            // Filtrar projetos do arquiteto (se necessário implementar no backend)
            setProjects(projectsResponse.data.data || [])
          }

          // Carregar modelos 3D do arquiteto (sempre tentar carregar, a exibição será controlada pela customização)
          try {
            // Tentar carregar modelos do arquiteto
            const modelsResponse = await model3dService.list({ 
              userId: response.data?.userId
            })
            if (modelsResponse.data?.data) {
              // Filtrar apenas modelos prontos e públicos (ou todos se for o próprio perfil)
              const readyModels = modelsResponse.data.data.filter((model: any) => 
                model.status === 'ready' && (model.isPublic !== false || user?.id === response.data?.userId)
              )
              setModels3D(readyModels)
              console.log('[PublicProfile] Modelos 3D carregados:', readyModels.length, 'de', modelsResponse.data.data.length)
            } else {
              console.log('[PublicProfile] Nenhum modelo 3D encontrado para userId:', response.data?.userId)
            }
          } catch (error) {
            console.error('[PublicProfile] Erro ao carregar modelos 3D:', error)
          }

          // Carregar avaliações do arquiteto se a customização permitir
          if (response.data.customization?.showReviews !== false) {
            try {
              const reviewsResponse = await reviewService.getByArchitect(response.data?.userId || '', 1, 10)
              if (reviewsResponse.data?.data) {
                setReviews(reviewsResponse.data.data)
              }
            } catch (error) {
              console.error('Erro ao carregar avaliações:', error)
            }
          }

          // Verificar se o arquiteto está nos favoritos
          if (isAuthenticated && user?.role !== 'arquiteto' && response.data?.userId) {
            try {
              console.log('[PublicProfile] Verificando favorito para userId:', response.data.userId)
              const favoriteCheck = await favoritesService.checkFavorite(response.data.userId)
              console.log('[PublicProfile] Resposta completa do checkFavorite:', JSON.stringify(favoriteCheck, null, 2))
              
              // Verificar se a resposta tem dados
              if (favoriteCheck.data !== undefined && favoriteCheck.data !== null) {
                const isFav = favoriteCheck.data.isFavorite === true
                console.log('[PublicProfile] isFavorite definido como:', isFav)
                setIsFavorite(isFav)
              } else if (favoriteCheck.error) {
                console.error('[PublicProfile] Erro ao verificar favorito:', favoriteCheck.error)
                setIsFavorite(false)
              } else {
                console.warn('[PublicProfile] Resposta do checkFavorite sem data nem error:', favoriteCheck)
                setIsFavorite(false)
              }
            } catch (error) {
              console.error('[PublicProfile] Erro ao verificar favorito:', error)
              setIsFavorite(false)
            }
          } else {
            // Se não for cliente autenticado, garantir que isFavorite seja false
            setIsFavorite(false)
          }
        }
      } else if (response.error) {
        showToast('Perfil não encontrado', 'error')
        navigate('/explore')
      }

      setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        showToast('Erro ao carregar perfil', 'error')
        setLoading(false)
      }
    }

    loadProfile()
  }, [username, isAuthenticated, user?.id, navigate, showToast])

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Faça login para adicionar aos favoritos', 'warning')
      navigate('/login')
      return
    }

    if (!profile?.userId) return

    // Se for favorito, mostrar modal de confirmação
    if (isFavorite) {
      setShowRemoveFavoriteModal(true)
      return
    }

    // Se não for favorito, adicionar diretamente
    try {
      const response = await favoritesService.addFavorite(profile.userId)
      if (response.data || !response.error) {
        setIsFavorite(true)
        showToast('Adicionado aos favoritos', 'success')
      } else {
        showToast(response.error || 'Erro ao adicionar aos favoritos', 'error')
      }
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error)
      showToast('Erro ao adicionar aos favoritos', 'error')
    }
  }

  const handleConfirmRemoveFavorite = async () => {
    if (!profile?.userId) return

    setRemovingFavorite(true)
    try {
      const response = await favoritesService.removeFavorite(profile.userId)
      if (response.data || !response.error) {
        setIsFavorite(false)
        showToast('Removido dos favoritos', 'success')
        setShowRemoveFavoriteModal(false)
      } else {
        showToast(response.error || 'Erro ao remover dos favoritos', 'error')
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error)
      showToast('Erro ao remover dos favoritos', 'error')
    } finally {
      setRemovingFavorite(false)
    }
  }

  // Formatar localização
  const formatLocation = (): string => {
    if (!profile?.location?.address) return 'Localização não informada'
    const { city, state } = profile.location.address
    if (city && state) return `${city}, ${state}`
    if (city) return city
    if (state) return state
    return 'Localização não informada'
  }

  // Avatar fallback
  const renderAvatar = () => {
    if (profile?.avatar) {
      return (
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl"
        />
      )
    }
    return (
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold">
        {profile?.displayName?.charAt(0).toUpperCase() || 'A'}
      </div>
    )
  }

  // Cover image fallback
  const getCoverImage = (): string => {
    if (profile?.coverImage) return profile.coverImage
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=400&fit=crop'
  }

  // Project cover fallback
  const getProjectCover = (project: Project): string => {
    if (project.coverImage) return project.coverImage
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil não encontrado</h2>
          <p className="text-gray-600 mb-4">O arquiteto que você procura não existe.</p>
          <Link to="/explore" className="text-primary-600 hover:underline">
            Voltar para explorar
          </Link>
        </div>
      </div>
    )
  }

  // Obter customização do perfil ou usar padrão
  const customization = profile?.customization ? {
    ...profile.customization,
    show3DModels: profile.customization.show3DModels !== undefined 
      ? profile.customization.show3DModels 
      : true
  } : {
    layout: 'grid',
    gridColumns: 3,
    showStats: true,
    showServices: true,
    showReviews: true,
    showContact: true,
    show3DModels: true,
    backgroundStyle: 'light',
    heroStyle: 'full',
    projectCardStyle: 'simple',
  }

  // Classes baseadas na customização
  const bgClass = customization.backgroundStyle === 'dark' 
    ? 'bg-gray-900 text-white' 
    : customization.backgroundStyle === 'gradient'
    ? 'bg-gradient-to-br from-gray-50 via-primary-50 to-gray-100'
    : 'bg-gray-50'
  
  const cardBgClass = customization.backgroundStyle === 'dark' ? 'bg-gray-800' : 'bg-white'
  const borderClass = customization.backgroundStyle === 'dark' ? 'border-gray-700' : 'border-gray-200'
  const textClass = customization.backgroundStyle === 'dark' ? 'text-white' : 'text-gray-900'
  const subtextClass = customization.backgroundStyle === 'dark' ? 'text-gray-300' : 'text-gray-600'

  // Função para renderizar cards de projeto baseado no estilo
  const renderProjectCard = (project: Project, index: number) => {
    const isMasonry = customization.layout === 'masonry'
    const height = isMasonry ? (index % 3 === 0 ? 'h-64' : index % 2 === 0 ? 'h-48' : 'h-56') : 'aspect-video'

    if (customization.projectCardStyle === 'overlay') {
      return (
        <Link
          key={project.id}
          to={`/project/${project.id}`}
          className={`relative ${height} rounded-lg overflow-hidden group cursor-pointer`}
        >
          <img
            src={getProjectCover(project)}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
            <div>
              <h3 className="text-white font-medium text-base md:text-lg truncate">{project.title}</h3>
              <p className="text-white/70 text-sm">{project.category || 'Projeto'}</p>
            </div>
          </div>
        </Link>
      )
    }

    if (customization.projectCardStyle === 'detailed') {
      return (
        <Link
          key={project.id}
          to={`/project/${project.id}`}
          className={`${cardBgClass} rounded-lg overflow-hidden border ${borderClass} cursor-pointer hover:shadow-md transition-shadow`}
        >
          <div className={`${height} relative`}>
            <img
              src={getProjectCover(project)}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className={`font-medium text-base ${textClass} truncate`}>{project.title}</h3>
            <p className={`text-sm ${subtextClass} mt-1`}>{project.category || 'Projeto'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`flex items-center gap-1 text-sm ${subtextClass}`}>
                <VisibilityIcon sx={{ fontSize: 14 }} /> {project.views || 0}
              </span>
            </div>
          </div>
        </Link>
      )
    }

    // Simple style (default)
    return (
      <Link
        key={project.id}
        to={`/project/${project.id}`}
        className={`${height} rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group`}
      >
        <img
          src={getProjectCover(project)}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
    )
  }

  // Função para renderizar grid de projetos baseado no layout
  const renderProjectsGrid = () => {
    if (projects.length === 0) return null

    const cols = customization.gridColumns
    const gridClass = `grid gap-4 md:gap-6 ${
      cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
      cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }`

    if (customization.layout === 'carousel') {
      return (
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {projects.map((project) => (
              <div key={project.id} className="flex-shrink-0 w-64 md:w-80">
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
        <div className="space-y-4 md:space-y-6">
          {/* Featured */}
          {featured && (
            <Link
              to={`/project/${featured.id}`}
              className="relative h-64 md:h-80 rounded-lg overflow-hidden group cursor-pointer block"
            >
              <img
                src={getProjectCover(featured)}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs px-3 py-1 rounded-full text-white mb-2 inline-block bg-primary-600">
                    Destaque
                  </span>
                  <h3 className="text-white font-bold text-xl md:text-2xl">{featured.title}</h3>
                </div>
              </div>
            </Link>
          )}
          
          {/* Grid */}
          <div className={gridClass}>
            {rest.map((project, index) => renderProjectCard(project, index + 1))}
          </div>
        </div>
      )
    }

    if (customization.layout === 'minimalist') {
      return (
        <div className="space-y-3">
          {projects.slice(0, 6).map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className={`flex items-center gap-4 p-4 rounded-lg ${cardBgClass} border ${borderClass} hover:shadow-md transition-shadow`}
            >
              <img
                src={getProjectCover(project)}
                alt={project.title}
                className="w-20 h-20 md:w-24 md:h-24 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-base ${textClass} truncate`}>{project.title}</h3>
                <p className={`text-sm ${subtextClass} mt-1`}>{project.category || 'Projeto'}</p>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    if (customization.layout === 'portfolio') {
      return (
        <div className="space-y-6">
          {projects.slice(0, 6).map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className={`${cardBgClass} rounded-lg overflow-hidden border ${borderClass} hover:shadow-lg transition-shadow block`}
            >
              <div className="h-48 md:h-64">
                <img
                  src={getProjectCover(project)}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 md:p-6">
                <h3 className={`font-bold text-lg md:text-xl ${textClass}`}>{project.title}</h3>
                <p className={`text-sm md:text-base ${subtextClass} mt-2`}>{project.category || 'Projeto'} • {new Date(project.createdAt).getFullYear()}</p>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    // Grid or Masonry (default)
    return (
      <div className={gridClass}>
        {projects.map((project, index) => renderProjectCard(project, index))}
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-12">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <Link
            to="/explore"
            className={`inline-flex items-center gap-1 px-3 md:px-4 py-2 ${cardBgClass} border ${borderClass} rounded-lg hover:opacity-90 transition-opacity ${textClass} text-sm font-medium shadow-sm`}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            Voltar
          </Link>
        </div>

        {/* Profile Header */}
        <div className={`${cardBgClass} rounded-xl shadow-xl overflow-hidden mb-6 md:mb-8 border ${borderClass}`}>
          {/* Cover Image with Overlapping Avatar */}
          <div className="relative">
            {/* Cover Image */}
            <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-80 bg-gray-900 overflow-hidden">
              <img
                src={getCoverImage()}
                alt="Cover"
                className="w-full h-full object-cover"
                style={{
                  objectPosition: 'center center'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Avatar Overlapping */}
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="relative -mt-12 md:-mt-16 inline-block">
                {renderAvatar()}
                {profile.verification?.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <VerifiedIcon sx={{ fontSize: 20, color: 'white' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-4 md:px-6 pb-6 md:pb-8">
            {/* Header with Name and Actions */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold ${textClass}`}>
                    {profile.displayName}
                  </h1>
                  {profile.verification?.verified && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      customization.backgroundStyle === 'dark' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Verificado
                    </span>
                  )}
                </div>
                <p className={`text-sm md:text-base lg:text-lg font-medium mb-2 ${
                  customization.backgroundStyle === 'dark' 
                    ? 'text-primary-400' 
                    : 'text-primary-600'
                }`}>
                  {profile.specialty || 'Arquiteto(a)'}
                </p>
                <div className={`flex flex-wrap items-center gap-2 md:gap-3 ${subtextClass} text-xs md:text-sm`}>
                  <span className="flex items-center gap-1">
                    <LocationOnIcon sx={{ fontSize: 14 }} />
                    {formatLocation()}
                  </span>
                  {profile.cau && (
                    <span className="flex items-center gap-1">
                      <ApartmentIcon sx={{ fontSize: 14 }} />
                      {profile.cau.startsWith('CAU/') ? profile.cau : `CAU/${profile.cau}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {user?.role !== 'arquiteto' && (
                  <button
                    onClick={handleToggleFavorite}
                    className={`px-4 md:px-6 py-2 md:py-3 rounded-lg border transition-all flex items-center justify-center ${
                      isFavorite
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                    title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {isFavorite ? (
                      <FavoriteIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login')
                      return
                    }
                    // Navegar para mensagens com query params para pré-preencher mensagem
                    const initialMessage = `Olá ${profile.displayName}! Gostaria de solicitar um orçamento para meu projeto. Poderia me enviar mais informações?`
                    navigate(`/client/messages?architect=${profile.userId}&initialMessage=${encodeURIComponent(initialMessage)}`)
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-xs md:text-sm"
                >
                  Solicitar Orçamento
                </button>
              </div>
            </div>

            {/* Stats */}
            {customization.showStats && (
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-3 md:py-4 border-t border-b ${borderClass} mb-4`}>
              <div className="flex flex-col items-start">
                <div className={`flex items-center gap-1 mb-1`}>
                  <StarIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
                  <span className={`font-bold ${textClass} text-sm md:text-base`}>
                    {profile.ratings?.average?.toFixed(1) || 'Novo'}
                  </span>
                </div>
                <div className={`text-xs md:text-sm ${subtextClass}`}>
                  {profile.ratings?.total || 0} avaliações
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div className={`text-lg md:text-xl font-bold ${textClass} mb-1`}>
                  {profile.projectsCount || 0}
                </div>
                <div className={`text-xs md:text-sm ${subtextClass}`}>Projetos</div>
              </div>
              <div className="flex flex-col items-start">
                <div className={`text-lg md:text-xl font-bold ${textClass} mb-1`}>
                  {profile.experience || '-'}
                </div>
                <div className={`text-xs md:text-sm ${subtextClass}`}>Anos</div>
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 mb-1">
                  <VisibilityIcon sx={{ fontSize: 16, color: customization.backgroundStyle === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  <span className={`font-bold ${textClass} text-sm md:text-base`}>
                    {profile.viewsCount?.toLocaleString('pt-BR') || 0}
                  </span>
                </div>
                <div className={`text-xs md:text-sm ${subtextClass}`}>Visualizações</div>
              </div>
            </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className={`${subtextClass} leading-relaxed text-sm md:text-base mb-4 md:mb-6`}>
                {profile.bio}
              </p>
            )}

            {/* Specialties */}
            {profile.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                {profile.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-2 md:px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs md:text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {customization.showContact && (profile.contact?.email || profile.contact?.phone || profile.contact?.website || profile.social) && (
          <div className={`${cardBgClass} rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border ${borderClass}`}>
            <h2 className={`text-base md:text-lg font-bold ${textClass} mb-4`}>Informações de Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {profile.contact?.email && (
                <a
                  href={`mailto:${profile.contact.email}`}
                  className={`flex items-center gap-2 ${subtextClass} hover:text-primary-600 transition-colors text-sm`}
                >
                  <EmailIcon sx={{ fontSize: 18 }} />
                  <span className="truncate">{profile.contact.email}</span>
                </a>
              )}
              {profile.contact?.phone && (
                <a
                  href={`tel:${profile.contact.phone}`}
                  className={`flex items-center gap-2 ${subtextClass} hover:text-primary-600 transition-colors text-sm`}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                  <span>{profile.contact.phone}</span>
                </a>
              )}
              {profile.contact?.website && (
                <a
                  href={profile.contact.website.startsWith('http') ? profile.contact.website : `https://${profile.contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${subtextClass} hover:text-primary-600 transition-colors text-sm`}
                >
                  <LanguageIcon sx={{ fontSize: 18 }} />
                  <span className="truncate">{profile.contact.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {profile.social?.instagram && (
                <a
                  href={profile.social.instagram.url || `https://instagram.com/${profile.social.instagram.username?.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${subtextClass} hover:text-primary-600 transition-colors text-sm`}
                >
                  <InstagramIcon sx={{ fontSize: 18 }} />
                  <span className="truncate">{profile.social.instagram.username || ''}</span>
                </a>
              )}
              {profile.social?.facebook && (
                <a
                  href={profile.social.facebook.url || `https://facebook.com/${profile.social.facebook.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${subtextClass} hover:text-primary-600 transition-colors text-sm`}
                >
                  <FacebookIcon sx={{ fontSize: 18 }} />
                  <span className="truncate">{profile.social.facebook.username || ''}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Projects Gallery */}
        {projects.length > 0 ? (
          <div className={`${cardBgClass} rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border ${borderClass}`}>
            <h2 className={`text-xl md:text-2xl font-bold ${textClass} mb-4 md:mb-6`}>Portfólio</h2>
            {renderProjectsGrid()}
          </div>
        ) : (
          <div className={`${cardBgClass} rounded-xl shadow-lg p-8 text-center border ${borderClass} mb-6 md:mb-8`}>
            <ApartmentIcon sx={{ fontSize: 48, color: customization.backgroundStyle === 'dark' ? '#6b7280' : '#d1d5db' }} />
            <h3 className={`text-lg font-semibold ${textClass} mt-4 mb-2`}>Nenhum projeto publicado</h3>
            <p className={subtextClass}>Este arquiteto ainda não publicou projetos no portfólio.</p>
          </div>
        )}

        {/* 3D Models Section */}
        {customization.show3DModels !== false && models3D.length > 0 && (
          <div className={`${cardBgClass} rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border ${borderClass}`}>
            <h2 className={`text-xl md:text-2xl font-bold ${textClass} mb-4 md:mb-6`}>Modelos 3D</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {models3D.map((model) => (
                <div
                  key={model.id}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    // Navegar para visualização do modelo
                    window.location.href = `/models3d/${model.id}`
                  }}
                >
                  {model.thumbnailUrl ? (
                    <img
                      src={model.thumbnailUrl}
                      alt={model.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                      <ApartmentIcon sx={{ fontSize: 32, color: '#6b7280' }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 md:p-3">
                    <div className="w-full">
                      <p className="text-white text-xs md:text-sm font-medium truncate">{model.title}</p>
                      <p className="text-white/80 text-[10px] md:text-xs truncate">
                        {model.originalFormat?.toUpperCase() || '3D'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {customization.showReviews !== false && reviews.length > 0 && (
          <div className={`${cardBgClass} rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border ${borderClass}`}>
            <h2 className={`text-xl md:text-2xl font-bold ${textClass} mb-4 md:mb-6`}>
              Avaliações ({profile?.ratings?.total || reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className={`p-4 rounded-lg border ${borderClass}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      {review.clientAvatar ? (
                        <img
                          src={review.clientAvatar}
                          alt={review.clientName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className={`text-lg font-semibold ${textClass}`}>
                          {review.clientName?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${textClass}`}>
                          {review.clientName || 'Cliente'}
                        </span>
                        {review.verified && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              sx={{
                                fontSize: 16,
                                color: star <= review.rating ? '#fbbf24' : '#d1d5db',
                              }}
                            />
                          ))}
                        </div>
                        <span className={`text-xs ${subtextClass}`}>
                          {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className={`text-sm ${subtextClass} mt-2`}>{review.comment}</p>
                      )}
                      {review.projectTitle && (
                        <p className={`text-xs ${subtextClass} mt-1 italic`}>
                          Projeto: {review.projectTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação para remover favorito */}
      <ConfirmModal
        isOpen={showRemoveFavoriteModal}
        onClose={() => setShowRemoveFavoriteModal(false)}
        onConfirm={handleConfirmRemoveFavorite}
        title="Remover dos favoritos?"
        message={`Tem certeza que deseja remover ${profile?.displayName || 'este arquiteto'} dos seus favoritos?`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="warning"
        loading={removingFavorite}
      />
    </div>
  )
}

export default PublicProfile

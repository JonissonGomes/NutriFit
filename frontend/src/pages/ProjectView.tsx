import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Heart, Share2, Download, MapPin, Calendar,
  Building2, Eye, Star, ChevronLeft, ChevronRight
} from 'lucide-react'
import { projectService } from '../services'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import type { Project, Image } from '../types/api'

const ProjectView = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return

      setLoading(true)

      const response = await projectService.getById(id)

      if (response.data) {
        setProject(response.data)
        // Carregar imagens do projeto
        const imagesResponse = await projectService.getImages(id)
        if (imagesResponse.data) {
          setImages(imagesResponse.data)
        }
      } else if (response.error) {
        showToast('Projeto não encontrado', 'error')
        navigate('/explore')
      }

      setLoading(false)
    }

    loadProject()
  }, [id])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.description,
          url: window.location.href,
        })
      } catch (err) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      // Fallback: copiar URL
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copiado para a área de transferência', 'success')
    }
  }

  const nextImage = () => {
    if (images.length === 0) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    if (images.length === 0) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Formatar data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Obter imagem atual ou fallback
  const getCurrentImage = (): string => {
    if (images.length > 0 && images[currentImageIndex]) {
      return images[currentImageIndex].url
    }
    if (project?.coverImage) {
      return project.coverImage
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop'
  }

  // Obter caption da imagem atual
  const getCurrentCaption = (): string => {
    if (images.length > 0 && images[currentImageIndex]) {
      return images[currentImageIndex].caption || images[currentImageIndex].title || `Imagem ${currentImageIndex + 1}`
    }
    return 'Imagem do projeto'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Projeto não encontrado</h2>
          <p className="text-gray-600 mb-4">O projeto que você procura não existe.</p>
          <Link to="/explore" className="text-primary-600 hover:underline">
            Voltar para explorar
          </Link>
        </div>
      </div>
    )
  }

  // Criar array de imagens para exibição (combinar cover + imagens)
  const displayImages = images.length > 0 ? images : (project.coverImage ? [{ id: 'cover', url: project.coverImage, caption: 'Capa do projeto' }] : [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg border transition-all ${isFavorite
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Viewer */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={getCurrentImage()}
                  alt={getCurrentCaption()}
                  className="w-full h-full object-contain"
                />

                {/* Navigation Arrows */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-900" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-900" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {displayImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                )}

                {/* Caption */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm">
                  {getCurrentCaption()}
                </div>
              </div>

              {/* Thumbnails */}
              {displayImages.length > 1 && (
                <div className="p-4 grid grid-cols-6 gap-2">
                  {displayImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {project.category || 'Projeto'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {project.location || 'Localização não informada'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {project.views || 0} visualizações
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">{project.description}</p>

              {/* Specifications */}
              {project.specs && Object.keys(project.specs).length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Especificações</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(project.specs).map(([key, value]) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize mb-1">{key}</p>
                        <p className="font-semibold text-gray-900">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/explore?tag=${tag}`}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Architect Info */}
            {project.architect && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Link
                  to={`/portfolio/${project.architect.username}`}
                  className="flex items-center gap-3 mb-4 group"
                >
                  {project.architect.avatar ? (
                    <img
                      src={project.architect.avatar}
                      alt={project.architect.name}
                      className="w-16 h-16 rounded-full border-2 border-gray-200 group-hover:border-primary-300 transition-colors"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 group-hover:border-primary-300 transition-colors bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                      {project.architect.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Arquiteto</div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {project.architect.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {project.architect.rating?.toFixed(1) || 'Novo'}
                      </span>
                      <span>•</span>
                      <span>{project.architect.projectsCount || 0} projetos</span>
                    </div>
                  </div>
                </Link>

                <Link
                  to={isAuthenticated ? `/client/messages?architect=${project.architect.username}` : '/login'}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-center block"
                >
                  Solicitar Orçamento
                </Link>
              </div>
            )}

            {/* Related Projects - Placeholder */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">Projetos Relacionados</h3>
              <p className="text-gray-500 text-sm text-center py-4">
                Nenhum projeto relacionado encontrado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectView

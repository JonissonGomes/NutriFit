import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Eye } from 'lucide-react'
import { projectService } from '../../services'
import type { Project } from '../../types/api'

const FeaturedProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)

      // Buscar projetos públicos recentes
      const response = await projectService.list({
        status: 'published',
        accessType: 'public',
        limit: 4,
      })

      if (response.data) {
        setProjects(response.data.data || [])
      }

      setLoading(false)
    }

    loadProjects()
  }, [])

  // Fallback para imagem de capa
  const getCoverImage = (project: Project): string => {
    if (project.coverImage) return project.coverImage
    // Placeholder baseado na categoria
    const placeholders: Record<string, string> = {
      residencial: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      comercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
      interiores: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop',
    }

    const category = project.category?.toLowerCase() || ''
    for (const [key, url] of Object.entries(placeholders)) {
      if (category.includes(key)) return url
    }

    return placeholders.residencial
  }

  if (loading) {
    return (
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Projetos reais de arquitetos na ArckDesign
            </h2>
            <p className="text-xl text-gray-600">
              Carregando projetos...
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-xl bg-gray-200 aspect-[4/3] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Se não houver projetos, não exibir a seção
  if (projects.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Projetos reais de arquitetos na ArckDesign
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Explore projetos residenciais, comerciais e de interiores compartilhados pela nossa comunidade de arquitetos.
          </p>
          <Link to="/explore" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 mx-auto justify-center">
            Descobrir projetos
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="group relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] cursor-pointer hover:shadow-2xl transition-all duration-300"
            >
              {/* Image */}
              <div className="absolute inset-0">
                <img
                  src={getCoverImage(project)}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-xs font-medium text-primary-300 mb-1 block">
                    {project.category || 'Projeto'}
                  </span>
                  <h3 className="text-lg font-bold mb-1">{project.title}</h3>
                  {project.architect && (
                    <p className="text-sm text-gray-300 mb-2">por {project.architect.name}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Eye className="h-4 w-4" />
                    <span>{(project.views || 0).toLocaleString('pt-BR')} visualizações</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects

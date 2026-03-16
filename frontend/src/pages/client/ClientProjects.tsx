import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { dashboardService } from '../../services'
import type { ClientProject } from '../../services/dashboard.service'
import { FolderTree, Loader2, ArrowRight } from 'lucide-react'

const ClientProjects: React.FC = () => {
  const { showToast } = useToast()
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const response = await dashboardService.getClientProjects(50)
      if (response.data) {
        setProjects(response.data)
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } catch {
      showToast('Erro ao carregar projetos', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em-andamento': return 'bg-blue-100 text-blue-700'
      case 'concluido': return 'bg-green-100 text-green-700'
      case 'revisao': return 'bg-yellow-100 text-yellow-700'
      case 'aprovado': return 'bg-emerald-100 text-emerald-700'
      case 'pausado': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em-andamento': return 'Em andamento'
      case 'concluido': return 'Concluído'
      case 'revisao': return 'Em revisão'
      case 'aprovado': return 'Aprovado'
      case 'pausado': return 'Pausado'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projetos Contratados</h1>
        <p className="text-gray-600">Visualize e acompanhe o progresso dos projetos que você contratou com arquitetos</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <FolderTree className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum projeto ainda
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Você ainda não tem projetos em andamento. Explore nossos arquitetos e encontre o profissional ideal para o seu projeto.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Descobrir Arquitetos
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Cover */}
              <div className="aspect-video bg-gray-100">
                {project.coverImage ? (
                  <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <FolderTree className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                {project.architectName && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {project.architectName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.architectName}</p>
                      <p className="text-sm text-gray-500">Arquiteto</p>
                    </div>
                  </div>
                )}

                <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                
                {/* Progress bar */}
                {project.progress > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientProjects

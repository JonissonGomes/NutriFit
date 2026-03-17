import { useState, useEffect } from 'react'
import { 
  Plus, Search, MoreVertical, Eye, Download, 
  Share2, Lock, Unlock, FolderTree, ArrowLeft, Calendar,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import type { Project } from '../../types/api'
import { sanitizeInput, limitLength } from '../../utils/inputUtils'

const Galleries = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    totalFiles: 0,
    totalViews: 0,
    inProgress: 0,
  })

  // Carregar projetos
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      
      const response = await projectService.list({
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter as 'residencial' | 'comercial' | 'reforma' | 'interiores' : undefined,
        accessType: statusFilter !== 'all' ? statusFilter as 'public' | 'private' | 'password' : undefined,
      })
      
      if (response.data) {
        setProjects(response.data.data || [])
        
        // Calcular estatísticas
        const projectsData = response.data.data || []
        setStats({
          total: projectsData.length,
          totalFiles: projectsData.reduce((acc, p) => acc + (p.filesCount || 0), 0),
          totalViews: projectsData.reduce((acc, p) => acc + (p.views || 0), 0),
          inProgress: projectsData.filter(p => p.projectStatus === 'em-andamento').length,
        })
      } else if (response.error) {
        showToast(response.error, 'error')
      }
      
      setLoading(false)
    }

    loadProjects()
  }, [searchTerm, statusFilter, categoryFilter])

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.accessType === statusFilter
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'public':
        return <Unlock className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'password':
        return <Lock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'public':
        return 'bg-green-100 text-green-700'
      case 'private':
        return 'bg-gray-100 text-gray-700'
      case 'password':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'public':
        return 'Público'
      case 'private':
        return 'Privado'
      case 'password':
        return 'Com Senha'
      default:
        return status
    }
  }

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4" />
      case 'em-andamento':
        return <Clock className="h-4 w-4" />
      case 'revisao':
        return <AlertCircle className="h-4 w-4" />
      case 'concluido':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'em-andamento':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'revisao':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'concluido':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getProjectStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado'
      case 'em-andamento':
        return 'Em Andamento'
      case 'revisao':
        return 'Em Revisão'
      case 'concluido':
        return 'Concluído'
      default:
        return status
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'residencial':
        return 'Residencial'
      case 'comercial':
        return 'Comercial'
      case 'reforma':
        return 'Reforma'
      case 'interiores':
        return 'Interiores'
      default:
        return category
    }
  }

  // Cover image fallback
  const getCoverImage = (project: Project) => {
    if (project.coverImage) {
      return project.coverImage
    }
    // Placeholder baseado na categoria
    const placeholders: Record<string, string> = {
      residencial: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
      comercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
      reforma: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop',
      interiores: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=300&fit=crop',
    }
    return placeholders[project.category || 'residencial'] || placeholders.residencial
  }

  if (loading) {
    return (
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/architect/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Meus Projetos</h1>
            <p className="text-gray-600 mt-1 text-xs md:text-sm">Carregando...</p>
          </div>
        </div>
        <div className="text-center py-20 text-gray-600">Carregando projetos...</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/architect/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Meus Projetos</h1>
            <p className="text-gray-600 mt-1 text-xs md:text-sm">Gerencie e compartilhe seus projetos arquitetônicos</p>
          </div>
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center gap-2 w-fit">
            <Plus className="h-5 w-5" />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value)
                setSearchTerm(limitLength(sanitized, 100))
              }}
              maxLength={100}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="all">Todas as Categorias</option>
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="reforma">Reforma</option>
            <option value="interiores">Interiores</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="public">Público</option>
            <option value="private">Privado</option>
            <option value="password">Com Senha</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total de Projetos</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {stats.totalFiles.toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-gray-600">Arquivos Totais</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {stats.totalViews.toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-gray-600">Visualizações</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">
            {stats.inProgress}
          </div>
          <div className="text-sm text-gray-600">Em Andamento</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Cover Image */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={getCoverImage(project)}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.accessType || 'public')}`}>
                  {getStatusIcon(project.accessType || 'public')}
                  {getStatusLabel(project.accessType || 'public')}
                </span>
                {project.projectStatus && (
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getProjectStatusColor(project.projectStatus)}`}>
                    {getProjectStatusIcon(project.projectStatus)}
                    {getProjectStatusLabel(project.projectStatus)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                  <MoreVertical className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded">
                  {getCategoryLabel(project.category || '')}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                {project.title}
              </h3>
              {project.clientId && (
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <span className="font-medium">Cliente vinculado</span>
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <FolderTree className="h-4 w-4" />
                  <span>{project.filesCount || 0} arquivos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{project.views || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(`/architect/projects/${project.id}`)}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                >
                  Abrir Projeto
                </button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Compartilhar">
                  <Share2 className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Download">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <FolderTree className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Tente ajustar os filtros ou crie um novo projeto
          </p>
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Primeiro Projeto
          </button>
        </div>
      )}
    </div>
  )
}

export default Galleries

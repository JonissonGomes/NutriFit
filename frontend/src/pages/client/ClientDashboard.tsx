import { useEffect, useState } from 'react'
import { FolderTree, Calendar, ArrowRight, Plus, Loader2, Heart, Search, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardService } from '../../services'
import type { ClientStats, UpcomingEvent } from '../../services/dashboard.service'

const ClientDashboard = () => {
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [appointments, setAppointments] = useState<UpcomingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, projectsRes, appointmentsRes] = await Promise.all([
        dashboardService.getPatientStats(),
        dashboardService.getPatientMealPlans(3),
        dashboardService.getPatientAppointments(3),
      ])

      if (statsRes.data) {
        setStats(statsRes.data)
      }
      if (projectsRes.data) {
        setProjects(projectsRes.data)
      }
      if (appointmentsRes.data) {
        setAppointments(appointmentsRes.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em-andamento':
        return 'Em Andamento'
      case 'revisao':
        return 'Em Revisão'
      case 'aprovado':
        return 'Aprovado'
      case 'concluido':
        return 'Concluído'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em-andamento':
        return 'bg-blue-100 text-blue-700'
      case 'revisao':
        return 'bg-yellow-100 text-yellow-700'
      case 'aprovado':
        return 'bg-green-100 text-green-700'
      case 'concluido':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo de volta!</h1>
        <p className="text-gray-600 mt-2">Acompanhe seu plano alimentar, metas e consultas</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/explore"
          className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Descobrir Nutricionistas</h3>
              <p className="text-primary-100 text-sm">Encontre o profissional ideal</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/favorites"
          className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Heart className="h-6 w-6 text-red-600 fill-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Favoritos</h3>
              <p className="text-gray-600 text-sm">{stats?.favoriteArchitects || 0} nutricionistas salvos</p>
            </div>
          </div>
        </Link>

        <Link
          to="/patient/messages"
          className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Mensagens</h3>
              <p className="text-gray-600 text-sm">Converse com nutricionistas</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/patient/meal-plans"
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Planos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.activeProjects || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Em andamento</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <FolderTree className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </Link>

        <Link
          to="/patient/bookings"
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Próximas Reuniões</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.upcomingMeetings ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Agendamentos</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Calendar className="h-8 w-8 text-accent-600" />
            </div>
          </div>
        </Link>

        <Link
          to="/patient/favorites"
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nutricionistas Favoritos</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.favoriteArchitects || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Salvos para referência</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <Heart className="h-8 w-8 text-red-600 fill-red-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Planos recentes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Planos recentes</h2>
            <p className="text-sm text-gray-600 mt-1">Acesse seus planos alimentares publicados</p>
          </div>
          {projects.length > 0 && (
            <Link 
              to="/patient/meal-plans"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/patient/meal-plans/${project.id}`}
                className="group flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all hover:-translate-y-1"
              >
                {project.coverImage ? (
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FolderTree className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {project.title}
                  </h3>
                  {project.architectName && (
                    <p className="text-sm text-gray-600 mb-2">Nutricionista: {project.architectName}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Atualizado em {formatDate(project.updatedAt)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                    {project.progress > 0 && (
                      <span className="text-xs text-gray-500">{project.progress}% concluído</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Você ainda não tem planos</p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
            >
              <Plus className="h-4 w-4" />
              Encontrar um nutricionista
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Próximas Reuniões</h2>
          <Link 
            to="/patient/bookings"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
          >
            Ver agenda
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                  {appointment.clientName && (
                    <p className="text-sm text-gray-600 mb-1">com {appointment.clientName}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDate(appointment.date)} às {appointment.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma reunião agendada</p>
          </div>
        )}
      </div>

      {/* CTA - Explore Nutricionistas */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Encontre o nutricionista ideal</h2>
            <p className="text-primary-100">
              Explore nossa comunidade de profissionais e encontre o nutricionista perfeito para seus objetivos.
            </p>
          </div>
          <Link
            to="/explore"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Search className="h-5 w-5" />
            Descobrir Nutricionistas
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientDashboard

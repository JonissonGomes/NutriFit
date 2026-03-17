import React, { useEffect, useState } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderIcon from '@mui/icons-material/Folder'
import PeopleIcon from '@mui/icons-material/People'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Link } from 'react-router-dom'
import { dashboardService } from '../../services'
import type { ArchitectStats, RecentProject, UpcomingEvent } from '../../services/dashboard.service'

interface StatCard {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  trend: 'up' | 'down' | 'neutral'
  color: string
  bgGradient: string
}

const Dashboard = () => {
  const [stats, setStats] = useState<ArchitectStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, projectsRes, eventsRes] = await Promise.all([
        dashboardService.getArchitectStats(),
        dashboardService.getArchitectRecentProjects(3),
        dashboardService.getArchitectUpcomingEvents(3),
      ])

      if (statsRes.data) {
        setStats(statsRes.data)
      }
      if (projectsRes.data) {
        setRecentProjects(projectsRes.data)
      }
      if (eventsRes.data) {
        setUpcomingEvents(eventsRes.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    }
    return `R$ ${value.toFixed(0)}`
  }

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const statCards: StatCard[] = stats ? [
    {
      title: 'Visualizações',
      value: formatNumber(stats.totalViews),
      change: formatPercentage(stats.viewsChange),
      icon: <VisibilityIcon sx={{ fontSize: 20 }} />,
      trend: stats.viewsChange >= 0 ? 'up' : 'down',
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50',
    },
    {
      title: 'Projetos Ativos',
      value: stats.activeProjects.toString(),
      change: `+${stats.totalProjects - stats.activeProjects} arquivados`,
      icon: <FolderIcon sx={{ fontSize: 20 }} />,
      trend: 'neutral',
      color: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100/50',
    },
    {
      title: 'Clientes',
      value: stats.totalClients.toString(),
      change: formatPercentage(stats.clientsChange),
      icon: <PeopleIcon sx={{ fontSize: 20 }} />,
      trend: stats.clientsChange >= 0 ? 'up' : 'down',
      color: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100/50',
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(stats.monthlyRevenue),
      change: formatPercentage(stats.revenueChange),
      icon: <AttachMoneyIcon sx={{ fontSize: 20 }} />,
      trend: stats.revenueChange >= 0 ? 'up' : 'down',
      color: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100/50',
    },
  ] : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado'
      case 'draft':
        return 'Rascunho'
      case 'archived':
        return 'Arquivado'
      default:
        return status
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']
    const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
    const day = days[date.getDay()]
    const dayNum = date.getDate()
    const month = months[date.getMonth()]
    return `${day}, ${dayNum} de ${month}`
  }

  const formatProjectDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-base md:text-lg">
              Bem-vindo de volta! Aqui está um resumo do seu escritório.
            </p>
          </div>
          <Link
            to="/nutritionist/meal-plans"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <AddIcon sx={{ fontSize: 22 }} />
            Novo Plano
          </Link>
        </div>

        {/* Stats Grid */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-95 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
                
                <div className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 shadow-md">
                        <div className="text-white">
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                            {stat.value}
                          </h3>
                          <p className="text-xs text-white/90 font-medium mt-0.5">
                            {stat.title}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm ${
                          stat.trend === 'up' 
                            ? 'bg-white/20 text-white border border-white/30' 
                            : stat.trend === 'down'
                            ? 'bg-red-500/80 text-white border border-red-400/50'
                            : 'bg-white/20 text-white border border-white/30'
                        }`}>
                          {stat.trend === 'up' ? (
                            <TrendingUpIcon sx={{ fontSize: 11 }} />
                          ) : stat.trend === 'down' ? (
                            <TrendingDownIcon sx={{ fontSize: 11 }} />
                          ) : null}
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Projetos Recentes</h2>
                <Link 
                  to="/nutritionist/meal-plans" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  Ver todos
                  <ArrowForwardIcon sx={{ fontSize: 18 }} />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/nutritionist/meal-plans/${project.id}`}
                    className="block p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-5">
                      {/* Project Image */}
                      <div className="relative flex-shrink-0">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover border-2 border-gray-200 group-hover:border-primary-300 transition-colors shadow-sm"
                          />
                        ) : (
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 group-hover:border-primary-300 transition-colors">
                            <FolderIcon sx={{ fontSize: 32, color: '#9ca3af' }} />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-white shadow-md flex items-center justify-center">
                          <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />
                        </div>
                      </div>
                      
                      {/* Project Info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(project.status)}`}>
                              {getStatusLabel(project.status)}
                            </span>
                            <span className="text-sm text-gray-600 font-medium">
                              {project.filesCount} arquivos
                            </span>
                          </div>
                        </div>
                        
                        {/* Views */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                            <span>{project.views} visualizações</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarTodayIcon sx={{ fontSize: 16 }} />
                            <span>{formatProjectDate(project.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <FolderIcon sx={{ fontSize: 48, color: '#d1d5db' }} />
                  <p className="mt-4 text-gray-500">Nenhum projeto ainda</p>
                  <Link
                    to="/nutritionist/meal-plans"
                    className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                    Criar primeiro plano
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Próximos Eventos</h2>
                <Link 
                  to="/nutritionist/calendar" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  Ver agenda
                  <ArrowForwardIcon sx={{ fontSize: 18 }} />
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to="/nutritionist/calendar"
                    className="block p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group"
                  >
                    <div className="space-y-3">
                      <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1.5 bg-primary-100 rounded-lg">
                          <CalendarTodayIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                        </div>
                        <span className="font-semibold">{formatEventDate(event.date)} às {event.time}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <LocationOnIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                          </div>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <CalendarTodayIcon sx={{ fontSize: 48, color: '#d1d5db' }} />
                  <p className="mt-4 text-gray-500">Nenhum evento agendado</p>
                  <Link
                    to="/nutritionist/calendar"
                    className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                    Agendar evento
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

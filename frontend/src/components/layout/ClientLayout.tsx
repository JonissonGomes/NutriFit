import { ReactNode, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderTree,
  MessageSquare,
  Heart,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle,
  Trash2,
  ShoppingCart,
  Target,
  LineChart,
  BookText,
  Bot,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Logo } from '../brand/Logo'
import LoadingButton from '../common/LoadingButton'
import AppSidebar from './AppSidebar'
import { isNavItemActive, useSidebarCollapsed } from '../../hooks/useSidebarCollapsed'

interface ClientLayoutProps {
  children: ReactNode
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { collapsed: isSidebarCollapsed, toggleCollapsed: toggleSidebarCollapsed } = useSidebarCollapsed()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [, setMarkingAsReadId] = useState<string | null>(null)
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => isNavItemActive(location.pathname, path)

  const navItems = [
    { path: '/patient/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { path: '/patient/meal-plans', icon: BookText, label: 'Plano Alimentar' },
    { path: '/patient/food-diary', icon: FolderTree, label: 'Diário Alimentar' },
    { path: '/patient/goals', icon: Target, label: 'Metas' },
    { path: '/patient/progress', icon: LineChart, label: 'Evolução' },
    { path: '/patient/shopping-list', icon: ShoppingCart, label: 'Lista de Compras' },
    { path: '/patient/assistant', icon: Bot, label: 'Assistente' },
    { path: '/patient/recipes', icon: BookText, label: 'Receitas' },
    { path: '/patient/favorites', icon: Heart, label: 'Favoritos' },
    { path: '/patient/messages', icon: MessageSquare, label: 'Mensagens' },
    { path: '/patient/bookings', icon: Calendar, label: 'Agendamentos' },
    { path: '/patient/settings', icon: Settings, label: 'Configurações' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isSidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSidebarOpen])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'agora'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_update':
      case 'verification':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'event_reminder':
        return <Bell className="h-5 w-5 text-yellow-500" />
      case 'message':
      case 'favorite':
      case 'review':
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      setMarkingAsReadId(notification.id)
      try {
        await markAsRead(notification.id)
      } finally {
        setMarkingAsReadId(null)
      }
    }
    // Navegar baseado no tipo de notificação
    if (notification.relatedType && notification.relatedId) {
      switch (notification.relatedType) {
        case 'project':
          navigate(`/patient/meal-plans`)
          break
        case 'event':
        case 'booking':
          navigate(`/patient/bookings`)
          break
        case 'message':
          navigate(`/patient/messages`)
          break
        case 'favorite':
          navigate(`/patient/favorites`)
          break
      }
    }
    setIsNotificationOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAllAsRead(true)
    try {
      await markAllAsRead()
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    setDeletingNotificationId(id)
    try {
      await deleteNotification(id)
    } finally {
      setDeletingNotificationId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          {/* Logo + Menu Toggle */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/">
              <Logo size="sm" textClassName="font-bold text-primary-700" />
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 app-dropdown-panel bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-sm text-gray-900">Notificações</h3>
                    {unreadCount > 0 && (
                      <LoadingButton
                        onClick={handleMarkAllAsRead}
                        loading={markingAllAsRead}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium p-1"
                        icon={<CheckCircle className="h-3.5 w-3.5" />}
                      >
                        Marcar todas
                      </LoadingButton>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <p className="text-xs">Carregando...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-primary-50/30' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-xs text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <LoadingButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteNotification(notification.id)
                                  }}
                                  loading={deletingNotificationId === notification.id}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5 min-w-0"
                                  icon={<Trash2 className="h-3.5 w-3.5" />}
                                >
                                  <span className="sr-only">Excluir</span>
                                </LoadingButton>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                {!notification.read && (
                                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link to="/patient/dashboard" className="flex items-center gap-2 min-w-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Perfil"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <AppSidebar
        items={navItems.map((item) => ({
          path: item.path,
          label: item.label,
          icon: <item.icon className="h-5 w-5" />,
        }))}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        isItemActive={isActive}
        iconSet="lucide"
        footer={
          <button
            type="button"
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Sair' : undefined}
            className={`w-full flex items-center rounded-lg text-red-100 hover:bg-red-500/25 hover:text-white transition-colors text-sm ${
              isSidebarCollapsed && !isSidebarOpen ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(!isSidebarCollapsed || isSidebarOpen) && <span>Sair</span>}
          </button>
        }
      />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`pt-14 p-3 md:p-5 lg:p-6 min-h-screen transition-[margin] duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default ClientLayout


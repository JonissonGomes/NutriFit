import { ReactNode, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, FolderTree, MessageSquare, 
  Heart, Calendar, Settings, LogOut, Menu, X, Bell, CheckCircle, Trash2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import LoadingButton from '../common/LoadingButton'
import arkLogo from '../../assets/ark-logo.png'

interface ClientLayoutProps {
  children: ReactNode
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [, setMarkingAsReadId] = useState<string | null>(null)
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/client/projects', icon: FolderTree, label: 'Projetos Contratados' },
    { path: '/client/favorites', icon: Heart, label: 'Favoritos' },
    { path: '/client/messages', icon: MessageSquare, label: 'Mensagens' },
    { path: '/client/bookings', icon: Calendar, label: 'Agendamentos' },
    { path: '/client/settings', icon: Settings, label: 'Configurações' },
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
          navigate(`/client/projects`)
          break
        case 'event':
        case 'booking':
          navigate(`/client/bookings`)
          break
        case 'message':
          navigate(`/client/messages`)
          break
        case 'favorite':
          navigate(`/client/favorites`)
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
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo + Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={arkLogo} alt="ArckDesign" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
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
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
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
            <Link to="/client/dashboard" className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-30 overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-4 space-y-1 pb-32">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 mt-16 p-4 md:p-6 lg:p-8 min-h-screen">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default ClientLayout


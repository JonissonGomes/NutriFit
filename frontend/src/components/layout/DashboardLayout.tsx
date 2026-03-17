import { ReactNode, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FolderIcon from '@mui/icons-material/Folder'
import PersonIcon from '@mui/icons-material/Person'
import ChatIcon from '@mui/icons-material/Chat'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import BarChartIcon from '@mui/icons-material/BarChart'
import PeopleIcon from '@mui/icons-material/People'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import LoadingButton from '../common/LoadingButton'
import RestaurantIcon from '@mui/icons-material/Restaurant'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
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
    { path: '/nutritionist/dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { path: '/nutritionist/meal-plans', icon: FolderIcon, label: 'Planos Alimentares' },
    { path: '/nutritionist/patients', icon: PeopleIcon, label: 'Pacientes' },
    { path: '/nutritionist/profile', icon: PersonIcon, label: 'Perfil Público' },
    { path: '/nutritionist/messages', icon: ChatIcon, label: 'Mensagens' },
    { path: '/nutritionist/services', icon: WorkIcon, label: 'Serviços' },
    { path: '/nutritionist/calendar', icon: CalendarTodayIcon, label: 'Agenda' },
    { path: '/nutritionist/models', icon: ViewInArIcon, label: 'Modelos 3D' },
    { path: '/nutritionist/analytics', icon: BarChartIcon, label: 'Estatísticas' },
    { path: '/nutritionist/settings', icon: SettingsIcon, label: 'Configurações' },
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
          navigate(`/nutritionist/meal-plans`)
          break
        case 'event':
          navigate(`/nutritionist/calendar`)
          break
        case 'message':
          navigate(`/nutritionist/messages`)
          break
        case 'review':
          navigate(`/nutritionist/profile`)
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_update':
      case 'verification':
        return <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#10b981' }} />
      case 'event_reminder':
        return <WarningIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
      case 'review':
        return <InfoIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
      case 'message':
      case 'favorite':
        return <InfoIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
      default:
        return <InfoIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'agora mesmo'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`
    return `${Math.floor(seconds / 86400)}d atrás`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Refatorado */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          {/* Logo + Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? (
                <CloseIcon sx={{ fontSize: 22 }} />
              ) : (
                <MenuIcon sx={{ fontSize: 22 }} />
              )}
            </button>
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <RestaurantIcon sx={{ fontSize: 26, color: '#059669' }} />
              <span className="font-bold text-primary-700">NutriFit</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-1.5 md:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <NotificationsIcon sx={{ fontSize: 22 }} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
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
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
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
                                  icon={<DeleteIcon sx={{ fontSize: 14 }} />}
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
                        <NotificationsIcon sx={{ fontSize: 40, color: '#d1d5db', margin: '0 auto 8px' }} />
                        <p className="text-xs">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <Link 
              to="/architect/profile" 
              className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-gray-200 object-cover"
                />
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-gray-200 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden lg:block text-xs md:text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar - Refatorado */}
      <aside
        className={`fixed top-14 left-0 bottom-0 w-56 md:w-64 bg-white border-r border-gray-100 transform transition-transform duration-200 ease-in-out z-30 overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-3 md:p-4 space-y-1">
          {/* Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon sx={{ fontSize: 20 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Divider */}
          <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm"
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content - Refatorado */}
      <main className="lg:ml-56 xl:ml-64 pt-14 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout

import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useAuth } from '../../contexts/AuthContext'
import RestaurantIcon from '@mui/icons-material/Restaurant'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) =>
    `transition-colors text-sm ${
      isActive(path)
        ? 'text-primary-700 font-medium'
        : 'text-gray-600 hover:text-gray-900'
    }`

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } 
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  // Verificar role ou type para compatibilidade
  const userRole = user?.role || user?.type

  const getDashboardPath = () => {
    if (userRole === 'nutricionista') return '/nutritionist/dashboard'
    if (userRole === 'paciente') return '/patient/dashboard'
    return '/'
  }

  const getProfilePath = () => {
    if (userRole === 'nutricionista') return '/nutritionist/profile'
    if (userRole === 'paciente') return '/patient/dashboard'
    return '/'
  }

  const getSettingsPath = () => {
    if (userRole === 'nutricionista') return '/nutritionist/settings'
    if (userRole === 'paciente') return '/patient/settings'
    return '/'
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <RestaurantIcon sx={{ fontSize: 28, color: '#059669' }} className="text-primary-600" />
            <span className="text-xl font-bold text-primary-600">NutriFit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/explore" className={navLinkClass('/explore')}>
              Descobrir
            </Link>
            <Link to="/pricing" className={navLinkClass('/pricing')}>
              Planos
            </Link>
            <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Como Funciona
            </a>
            <a href="#comunidade" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Comunidade
            </a>
          </div>

          {/* User Menu or CTA Buttons */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <DashboardIcon sx={{ fontSize: 18 }} />
                        Dashboard
                      </Link>
                      <Link
                        to={getProfilePath()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <PersonIcon sx={{ fontSize: 18 }} />
                        Meu Perfil
                      </Link>
                      <Link
                        to={getSettingsPath()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <SettingsIcon sx={{ fontSize: 18 }} />
                        Configurações
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogoutIcon sx={{ fontSize: 18 }} />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
                >
                  Entrar
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Começar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5 text-gray-600 hover:text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <CloseIcon sx={{ fontSize: 24 }} />
            ) : (
              <MenuIcon sx={{ fontSize: 24 }} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-100">
            <Link
              to="/explore"
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Descobrir
            </Link>
            <Link
              to="/pricing"
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Planos
            </Link>
            <a
              href="#como-funciona"
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Como Funciona
            </a>
            <a
              href="#comunidade"
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Comunidade
            </a>
            {isAuthenticated && user ? (
              <div className="pt-3 space-y-2 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 py-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <DashboardIcon sx={{ fontSize: 18 }} />
                  Dashboard
                </Link>
                <Link
                  to={getProfilePath()}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PersonIcon sx={{ fontSize: 18 }} />
                  Meu Perfil
                </Link>
                <Link
                  to={getSettingsPath()}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <SettingsIcon sx={{ fontSize: 18 }} />
                  Configurações
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors py-2 px-2"
                >
                  <LogoutIcon sx={{ fontSize: 18 }} />
                  Sair
                </button>
              </div>
            ) : (
              <div className="pt-3 space-y-2 border-t border-gray-100">
                <Link
                  to="/login"
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/signup"
                  className="block w-full bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Começar
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header

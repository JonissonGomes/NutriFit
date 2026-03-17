import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/api'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  // Debug
  console.log('[ProtectedRoute] Estado:', { isAuthenticated, isLoading, userRole: user?.role, allowedRoles })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-stone-300">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    console.log('[ProtectedRoute] Não autenticado, redirecionando para /login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar se o usuário tem a role permitida
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] Role não permitida:', user.role, 'Permitidas:', allowedRoles)
    // Redirecionar baseado na role do usuário
    if (user.role === 'nutricionista') {
      return <Navigate to="/nutritionist/dashboard" replace />
    } else if (user.role === 'medico') {
      return <Navigate to="/medico/dashboard" replace />
    } else if (user.role === 'paciente') {
      return <Navigate to="/patient/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute


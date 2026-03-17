import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Building2, Eye, EyeOff, Briefcase, Ruler, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types/api'
import LoadingButton from '../components/common/LoadingButton'
import { sanitizeInput, validateEmail, INPUT_LIMITS, limitLength } from '../utils/inputUtils'

const Login = () => {
  // DEBUG: Log quando o componente renderiza
  console.log('=== LOGIN PAGE LOADED ===')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<UserRole>('nutricionista')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const { login, isLoading, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirecionar se já estiver autenticado (ao entrar na página)
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'nutricionista' ? '/nutritionist/dashboard' : '/patient/dashboard'
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Função para obter o caminho de redirecionamento
  const getRedirectPath = (userRole: string) => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    
    if (from) {
      const isNutritionistPath = from.startsWith('/nutritionist')
      const isPatientPath = from.startsWith('/patient')
      
      if ((userRole === 'nutricionista' && isNutritionistPath) ||
          (userRole === 'paciente' && isPatientPath)) {
        return from
      }
    }
    
    return userRole === 'nutricionista' ? '/nutritionist/dashboard' : '/patient/dashboard'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== FORM SUBMITTED ===')
    setError('')

    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim())
    
    if (!sanitizedEmail) {
      setError('Digite seu e-mail')
      return
    }
    
    if (!validateEmail(sanitizedEmail)) {
      setError('E-mail inválido')
      return
    }
    
    if (sanitizedEmail.length > INPUT_LIMITS.EMAIL) {
      setError(`E-mail muito longo (máximo ${INPUT_LIMITS.EMAIL} caracteres)`)
      return
    }

    if (!password) {
      setError('Digite sua senha')
      return
    }
    
    if (password.length > INPUT_LIMITS.PASSWORD_MAX) {
      setError(`Senha muito longa (máximo ${INPUT_LIMITS.PASSWORD_MAX} caracteres)`)
      return
    }

    console.log('[Login] Iniciando login...', { email, userType })
    
    try {
      const result = await login(email, password, userType)
      
      console.log('[Login] Resultado completo:', JSON.stringify(result, null, 2))
      
      if (result.success && result.user) {
        console.log('[Login] Sucesso! User:', result.user)
        console.log('[Login] User role:', result.user.role)
        
        // Redirecionar imediatamente com o user retornado
        const redirectPath = getRedirectPath(result.user.role)
        console.log('[Login] Redirecionando para:', redirectPath)
        
        // Usar navigate do React Router para manter o estado
        navigate(redirectPath, { replace: true })
      } else {
        console.log('[Login] Falha:', result.error)
        
        // Mensagens de erro em português
        let errorMessage = result.error || 'Erro ao fazer login'
        
        // Traduzir erros comuns
        if (errorMessage.toLowerCase().includes('invalid credentials') || 
            errorMessage.toLowerCase().includes('wrong password')) {
          errorMessage = 'E-mail ou senha incorretos'
        } else if (errorMessage.toLowerCase().includes('user not found')) {
          errorMessage = 'Usuário não encontrado'
        } else if (errorMessage.toLowerCase().includes('type mismatch') ||
                   errorMessage.toLowerCase().includes('role mismatch')) {
          errorMessage = 'Tipo de conta não corresponde ao cadastro'
        } else if (errorMessage.toLowerCase().includes('too many')) {
          errorMessage = 'Muitas tentativas. Aguarde um momento e tente novamente.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error('[Login] Erro catch:', err)
      setError('Erro de conexão. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">ArckDesign</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-stone-300">
            Entre na sua conta para continuar
          </p>
        </div>

        {/* User Type Selection */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUserType('nutricionista')}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
              userType === 'nutricionista'
                ? 'border-primary-500 bg-primary-600/20 shadow-lg shadow-primary-500/30'
                : 'border-stone-700 hover:border-stone-600 bg-stone-800/50'
            }`}
          >
            <div className={`flex flex-col items-center ${
              userType === 'nutricionista' ? 'text-white' : 'text-stone-400'
            }`}>
              <Ruler className={`h-7 w-7 mb-2 ${
                userType === 'nutricionista' ? 'text-primary-400' : 'text-stone-500'
              }`} />
              <div className="text-sm font-semibold">Nutricionista</div>
              <div className="text-xs mt-1 opacity-75">Profissional</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUserType('paciente')}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
              userType === 'paciente'
                ? 'border-accent-500 bg-accent-600/20 shadow-lg shadow-accent-500/30'
                : 'border-stone-700 hover:border-stone-600 bg-stone-800/50'
            }`}
          >
            <div className={`flex flex-col items-center ${
              userType === 'paciente' ? 'text-white' : 'text-stone-400'
            }`}>
              <Briefcase className={`h-7 w-7 mb-2 ${
                userType === 'paciente' ? 'text-accent-400' : 'text-stone-500'
              }`} />
              <div className="text-sm font-semibold">Paciente</div>
              <div className="text-xs mt-1 opacity-75">Buscar acompanhamento</div>
            </div>
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-stone-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-stone-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value.toLowerCase().trim())
                    setEmail(limitLength(sanitized, INPUT_LIMITS.EMAIL))
                  }}
                  maxLength={INPUT_LIMITS.EMAIL}
                  className="w-full pl-10 pr-4 py-3 bg-stone-900/50 border border-stone-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-stone-500"
                  placeholder="Digite seu e-mail"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(limitLength(e.target.value, INPUT_LIMITS.PASSWORD_MAX))}
                  maxLength={INPUT_LIMITS.PASSWORD_MAX}
                  className="w-full pl-10 pr-12 py-3 bg-stone-900/50 border border-stone-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-stone-500"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-stone-600 rounded focus:ring-primary-500 bg-stone-900/50"
                />
                <span className="ml-2 text-sm text-stone-300">Lembrar de mim</span>
              </label>
              <Link to="/recuperar-senha" className="text-sm text-primary-400 hover:text-primary-300 font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              loading={isLoading}
              variant={userType === 'nutricionista' ? 'primary' : 'secondary'}
              fullWidth
              size="lg"
              className={`w-full font-semibold shadow-lg hover:shadow-xl ${
                userType === 'nutricionista'
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-accent-500 hover:bg-accent-600'
              }`}
            >
              Entrar
            </LoadingButton>
          </form>
        </div>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-stone-300">
          Não tem uma conta?{' '}
          <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-semibold">
            Cadastre-se gratuitamente
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

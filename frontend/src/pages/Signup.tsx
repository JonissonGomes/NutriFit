import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Building2, Eye, EyeOff, Briefcase, Ruler, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { isStrongPassword } from '../services'
import type { UserRole } from '../types/api'
import LoadingButton from '../components/common/LoadingButton'
import { sanitizeInput, validateEmail, INPUT_LIMITS, limitLength } from '../utils/inputUtils'

const Signup = () => {
  const { showToast } = useToast()
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'nutricionista' as UserRole,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')

  const validatePassword = (password: string) => {
    const result = isStrongPassword(password)
    return result
  }

  const passwordValidation = validatePassword(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    const sanitizedName = sanitizeInput(formData.name.trim())
    if (sanitizedName.length < 2) {
      setError('O nome deve ter pelo menos 2 caracteres')
      return
    }
    
    if (sanitizedName.length > INPUT_LIMITS.NAME) {
      setError(`O nome deve ter no máximo ${INPUT_LIMITS.NAME} caracteres`)
      return
    }

    if (!validateEmail(formData.email)) {
      setError('E-mail inválido')
      return
    }

    if (!passwordValidation.valid) {
      setError('A senha não atende aos requisitos de segurança')
      return
    }
    
    if (formData.password.length < INPUT_LIMITS.PASSWORD_MIN) {
      setError(`A senha deve ter no mínimo ${INPUT_LIMITS.PASSWORD_MIN} caracteres`)
      return
    }
    
    if (formData.password.length > INPUT_LIMITS.PASSWORD_MAX) {
      setError(`A senha deve ter no máximo ${INPUT_LIMITS.PASSWORD_MAX} caracteres`)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!acceptTerms) {
      showToast('Você deve aceitar os termos de uso', 'warning')
      return
    }

    console.log('[Signup] Enviando registro com accountType:', formData.accountType)
    
    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.accountType
    )

    if (result.success && result.user) {
      showToast('Conta criada com sucesso! Bem-vindo ao NutriFit.', 'success')
      console.log('[Signup] Sucesso! User:', result.user)
      
      const redirectPath = result.user.role === 'nutricionista'
        ? '/nutritionist/dashboard'
        : '/patient/dashboard'
      
      console.log('[Signup] Redirecionando para:', redirectPath)
      
      // Usar navigate do React Router para manter o estado
      navigate(redirectPath, { replace: true })
    } else {
      console.log('[Signup] Erro:', result.error)
      setError(result.error || 'Erro ao criar conta. Tente novamente.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let sanitizedValue = value
    
    // Sanitização e limites baseados no campo
    switch (name) {
      case 'name':
        sanitizedValue = sanitizeInput(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.NAME)
        break
      case 'email':
        sanitizedValue = sanitizeInput(value.toLowerCase().trim())
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.EMAIL)
        break
      case 'password':
      case 'confirmPassword':
        // Senha não deve ser sanitizada (pode conter caracteres especiais)
        sanitizedValue = limitLength(value, INPUT_LIMITS.PASSWORD_MAX)
        break
      default:
        sanitizedValue = sanitizeInput(value)
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary-600 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">NuFit</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Crie sua conta
          </h2>
          <p className="mt-2 text-stone-300">
            Comece gratuitamente, sem cartão de crédito
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, accountType: 'nutricionista' })}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
              formData.accountType === 'nutricionista'
                ? 'border-primary-500 bg-primary-600/20 shadow-lg shadow-primary-500/30'
                : 'border-stone-700 hover:border-stone-600 bg-stone-800/50'
            }`}
          >
            <div className={`flex flex-col items-center ${
              formData.accountType === 'nutricionista' ? 'text-white' : 'text-stone-400'
            }`}>
              <Ruler className={`h-7 w-7 mb-2 ${
                formData.accountType === 'nutricionista' ? 'text-primary-400' : 'text-stone-500'
              }`} />
              <div className="text-sm font-semibold">Nutricionista</div>
              <div className="text-xs mt-1 opacity-75">Profissional</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, accountType: 'paciente' })}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
              formData.accountType === 'paciente'
                ? 'border-accent-500 bg-accent-600/20 shadow-lg shadow-accent-500/30'
                : 'border-stone-700 hover:border-stone-600 bg-stone-800/50'
            }`}
          >
            <div className={`flex flex-col items-center ${
              formData.accountType === 'paciente' ? 'text-white' : 'text-stone-400'
            }`}>
              <Briefcase className={`h-7 w-7 mb-2 ${
                formData.accountType === 'paciente' ? 'text-accent-400' : 'text-stone-500'
              }`} />
              <div className="text-sm font-semibold">Paciente</div>
              <div className="text-xs mt-1 opacity-75">Buscar acompanhamento</div>
            </div>
          </button>
        </div>

        {/* Signup Form */}
        <div className="bg-stone-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-stone-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-300 mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={INPUT_LIMITS.NAME}
                  className="w-full pl-10 pr-4 py-3 bg-stone-900/50 border border-stone-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-stone-500"
                  placeholder="Digite seu nome completo"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  minLength={INPUT_LIMITS.PASSWORD_MIN}
                  maxLength={INPUT_LIMITS.PASSWORD_MAX}
                  className="w-full pl-10 pr-12 py-3 bg-stone-900/50 border border-stone-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-stone-500"
                  placeholder="Crie uma senha forte"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <PasswordRequirement
                    met={formData.password.length >= 8}
                    text="Pelo menos 8 caracteres"
                  />
                  <PasswordRequirement
                    met={/[A-Z]/.test(formData.password)}
                    text="Uma letra maiúscula"
                  />
                  <PasswordRequirement
                    met={/[a-z]/.test(formData.password)}
                    text="Uma letra minúscula"
                  />
                  <PasswordRequirement
                    met={/[0-9]/.test(formData.password)}
                    text="Um número"
                  />
                  <PasswordRequirement
                    met={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)}
                    text="Um caractere especial (!@#$%...)"
                  />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-300 mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength={INPUT_LIMITS.PASSWORD_MIN}
                  maxLength={INPUT_LIMITS.PASSWORD_MAX}
                  className={`w-full pl-10 pr-12 py-3 bg-stone-900/50 border text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-stone-500 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500'
                      : 'border-stone-700'
                  }`}
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-stone-600 rounded focus:ring-primary-500 bg-stone-900/50 mt-1"
                />
                <span className="ml-2 text-sm text-stone-300">
                  Aceito os{' '}
                  <Link to="/termos" className="text-primary-400 hover:text-primary-300 font-medium">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to="/privacidade" className="text-primary-400 hover:text-primary-300 font-medium">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              loading={isLoading}
              variant={formData.accountType === 'nutricionista' ? 'primary' : 'secondary'}
              fullWidth
              size="lg"
              disabled={!acceptTerms || !passwordValidation.valid || formData.password !== formData.confirmPassword}
              className={`w-full font-semibold shadow-lg hover:shadow-xl ${
                formData.accountType === 'nutricionista'
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-accent-500 hover:bg-accent-600'
              }`}
            >
              Criar conta gratuitamente
            </LoadingButton>
          </form>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-stone-300">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

// Componente auxiliar para requisitos de senha
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-400' : 'text-stone-400'}`}>
    {met ? (
      <CheckCircle className="h-3.5 w-3.5" />
    ) : (
      <div className="h-3.5 w-3.5 rounded-full border border-stone-500" />
    )}
    <span>{text}</span>
  </div>
)

export default Signup

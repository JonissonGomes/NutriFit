import { useState, useEffect } from 'react'
import { ArrowLeft, User, Building2, Bell, Lock, CreditCard, Globe, Save, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { settingsService, type NotificationSettings, type Preferences, type PrivacySettings, type UserProfile } from '../../services/settings.service'
import LoadingButton from '../../components/common/LoadingButton'
import { sanitizeInput, sanitizeText, sanitizeUrl, maskPhone, maskCNPJ, INPUT_LIMITS, limitLength } from '../../utils/inputUtils'

const Settings = () => {
  const navigate = useNavigate()
  const { isDarkMode, setDarkMode } = useTheme()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const isClient = user?.role === 'cliente'
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    companyName: '',
    cnpj: '',
    address: '',
    website: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    projectUpdates: true,
    clientMessages: true,
    marketingEmails: false,
  })

  // Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'pt-BR',
    theme: isDarkMode ? 'dark' : 'light',
  })

  // Privacy (usado na aba de preferências)
  const [, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: true,
  })

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load settings
        const settingsResponse = await settingsService.getSettings()
        if (settingsResponse.data) {
          setNotifications(settingsResponse.data.notifications)
          setPreferences(settingsResponse.data.preferences)
          setPrivacy(settingsResponse.data.privacy)
          // Sync dark mode with saved preference
          if (settingsResponse.data.preferences.theme) {
            setDarkMode(settingsResponse.data.preferences.theme === 'dark')
          }
        }

        // Load profile
        const profileResponse = await settingsService.getProfile()
        if (profileResponse.data) {
          // Mapear dados retornados para o formato esperado
          setProfile({
            id: profileResponse.data.id || user?.id || '',
            name: profileResponse.data.name || user?.name || '',
            email: profileResponse.data.email || user?.email || '',
            phone: profileResponse.data.phone || '',
            bio: profileResponse.data.bio || '',
            avatar: profileResponse.data.avatar || user?.avatar || '',
            companyName: profileResponse.data.companyName || '',
            cnpj: profileResponse.data.cnpj || '',
            address: profileResponse.data.address || '',
            website: profileResponse.data.website || '',
          })
        } else if (user) {
          // Fallback to auth user data - apenas campos básicos
          setProfile({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            phone: '',
            bio: '',
            avatar: user.avatar || '',
            companyName: '',
            cnpj: '',
            address: '',
            website: '',
          })
          // Se não encontrou perfil mas tem dados do user, tentar criar um perfil básico
          if (profileResponse.error) {
            console.log('[Settings] Perfil não encontrado, usando dados do usuário autenticado')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        // Use auth data as fallback
        if (user) {
          setProfile({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            phone: '',
            bio: '',
            avatar: user.avatar || '',
            companyName: '',
            cnpj: '',
            address: '',
            website: '',
          })
        }
        showToast('Erro ao carregar configurações. Alguns dados podem estar incompletos.', 'warning')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, setDarkMode])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await settingsService.updateProfile(profile)
      if (response.data) {
        showToast('Perfil atualizado com sucesso!', 'success')
      } else {
        showToast(response.error || 'Erro ao atualizar perfil', 'error')
      }
    } catch (error) {
      showToast('Erro ao salvar alterações', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      const response = await settingsService.updateNotifications(notifications)
      if (response.data) {
        showToast('Notificações atualizadas com sucesso!', 'success')
      } else {
        showToast(response.error || 'Erro ao atualizar notificações', 'error')
      }
    } catch (error) {
      showToast('Erro ao salvar alterações', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      const updatedPreferences: Preferences = {
        ...preferences,
        theme: isDarkMode ? 'dark' : 'light',
      }
      const response = await settingsService.updatePreferences(updatedPreferences)
      if (response.data) {
        showToast('Preferências atualizadas com sucesso!', 'success')
      } else {
        showToast(response.error || 'Erro ao atualizar preferências', 'error')
      }
    } catch (error) {
      showToast('Erro ao salvar alterações', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('As senhas não coincidem', 'error')
      return
    }

    if (passwordData.newPassword.length < 8) {
      showToast('A senha deve ter pelo menos 8 caracteres', 'error')
      return
    }

    setIsSaving(true)
    try {
      const response = await settingsService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )
      if (response.data) {
        showToast('Senha alterada com sucesso!', 'success')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        showToast(response.error || 'Erro ao alterar senha', 'error')
      }
    } catch (error) {
      showToast('Erro ao alterar senha', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = () => {
    switch (activeTab) {
      case 'profile':
      case 'company':
        handleSaveProfile()
        break
      case 'notifications':
        handleSaveNotifications()
        break
      case 'preferences':
        handleSavePreferences()
        break
      case 'security':
        handleChangePassword()
        break
      default:
        showToast('Configurações salvas!', 'success')
    }
  }

  // Tabs diferentes para cliente e arquiteto
  const tabs = isClient
    ? [
        { id: 'profile', label: 'Perfil', icon: User },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'security', label: 'Segurança', icon: Lock },
        { id: 'billing', label: 'Pagamento', icon: CreditCard },
        { id: 'preferences', label: 'Preferências', icon: Globe },
      ]
    : [
        { id: 'profile', label: 'Perfil', icon: User },
        { id: 'company', label: 'Empresa', icon: Building2 },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'security', label: 'Segurança', icon: Lock },
        { id: 'billing', label: 'Pagamento', icon: CreditCard },
        { id: 'preferences', label: 'Preferências', icon: Globe },
      ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs md:text-sm">Gerencie suas preferências e informações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informações do Perfil</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value)
                      setProfile({...profile, name: limitLength(sanitized, INPUT_LIMITS.NAME)})
                    }}
                    maxLength={INPUT_LIMITS.NAME}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    title="Email não pode ser alterado"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email não pode ser alterado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => {
                      const masked = maskPhone(e.target.value)
                      setProfile({...profile, phone: limitLength(masked, INPUT_LIMITS.PHONE)})
                    }}
                    maxLength={INPUT_LIMITS.PHONE}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => {
                    // Para biografia, permitir todos os caracteres acentuados e especiais comuns
                    const sanitized = sanitizeText(e.target.value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';', '(', ')', '[', ']', '{', '}', '/', '\\', '@', '#', '$', '%', '*', '+', '=', '_', '|', '~', '`', '^', '´', '°', 'ª', 'º'])
                    setProfile({...profile, bio: limitLength(sanitized, INPUT_LIMITS.BIO)})
                  }}
                  maxLength={INPUT_LIMITS.BIO}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(profile.bio || '').length}/{INPUT_LIMITS.BIO} caracteres
                </p>
              </div>
            </div>
          )}

          {activeTab === 'company' && !isClient && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informações da Empresa</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={profile.companyName || ''}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value)
                      setProfile({...profile, companyName: limitLength(sanitized, INPUT_LIMITS.COMPANY_NAME)})
                    }}
                    maxLength={INPUT_LIMITS.COMPANY_NAME}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={profile.cnpj || ''}
                    onChange={(e) => {
                      const masked = maskCNPJ(e.target.value)
                      setProfile({...profile, cnpj: limitLength(masked, INPUT_LIMITS.CNPJ)})
                    }}
                    maxLength={INPUT_LIMITS.CNPJ}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => {
                      const sanitized = sanitizeText(e.target.value, [' ', ',', '.', '-', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
                      setProfile({...profile, address: limitLength(sanitized, INPUT_LIMITS.ADDRESS)})
                    }}
                    maxLength={INPUT_LIMITS.ADDRESS}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => {
                      const sanitized = sanitizeUrl(e.target.value)
                      setProfile({...profile, website: limitLength(sanitized, INPUT_LIMITS.WEBSITE)})
                    }}
                    maxLength={INPUT_LIMITS.WEBSITE}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notificações</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Notificações por Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receba atualizações por email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isClient ? 'Atualizações de Projetos Contratados' : 'Atualizações de Projeto'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isClient ? 'Quando houver mudanças nos projetos que você contratou' : 'Quando houver mudanças nos projetos'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.projectUpdates}
                      onChange={(e) => setNotifications({...notifications, projectUpdates: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {!isClient && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Mensagens de Clientes</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Novas mensagens dos clientes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.clientMessages}
                        onChange={(e) => setNotifications({...notifications, clientMessages: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                )}
                {isClient && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Mensagens de Arquitetos</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Respostas de arquitetos às suas mensagens</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.clientMessages}
                        onChange={(e) => setNotifications({...notifications, clientMessages: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Emails de Marketing</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Novidades e promoções</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.marketingEmails}
                      onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Segurança</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {profile.phone && profile.phone.trim() !== '' && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Autenticação de Dois Fatores</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Ativar 2FA
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plano e Pagamento</h2>
              
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 p-6 rounded-xl border border-primary-200 dark:border-primary-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Plano Atual</p>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {user?.plan || 'Free'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {user?.plan === 'free' ? 'Gratuito' : 
                       user?.plan === 'starter' ? 'R$ 49/mês' :
                       user?.plan === 'professional' ? 'R$ 149/mês' :
                       user?.plan === 'business' ? 'R$ 399/mês' : 'Gratuito'}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Fazer Upgrade
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Método de Pagamento</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Nenhum método de pagamento cadastrado
                  </p>
                  <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Adicionar cartão
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferências</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Modo Escuro</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ativar tema escuro</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={async (e) => {
                        const newValue = e.target.checked
                        setDarkMode(newValue)
                        // Salvar automaticamente nas preferências
                        try {
                          const updatedPreferences: Preferences = {
                            ...preferences,
                            theme: newValue ? 'dark' : 'light',
                          }
                          await settingsService.updatePreferences(updatedPreferences)
                          setPreferences(updatedPreferences)
                        } catch (error) {
                          console.error('Erro ao salvar preferência de tema:', error)
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="py-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idioma
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <LoadingButton
              onClick={handleSave}
              loading={isSaving}
              variant="primary"
              size="lg"
              icon={<Save className="h-5 w-5" />}
            >
              Salvar Alterações
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

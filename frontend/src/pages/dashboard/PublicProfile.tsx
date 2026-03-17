import { useState, useEffect, useRef } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import SaveIcon from '@mui/icons-material/Save'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, DEFAULT_CUSTOMIZATION } from '../../services'
import type { ProfileCustomization, PublicProfile as ProfileServicePublicProfile } from '../../services/profile.service'
import LoadingButton from '../../components/common/LoadingButton'
import { sanitizeInput, sanitizeText, sanitizeUrl, maskPhone, maskCAU, validateUsername, validateUrl, validatePhone, unmask, INPUT_LIMITS, limitLength } from '../../utils/inputUtils'

type PublicProfileType = ProfileServicePublicProfile
import LayoutCustomizer from '../../components/profile/LayoutCustomizer'
import LayoutPreview from '../../components/profile/LayoutPreview'

const PublicProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { user } = useAuth()
  const dashboardPath = location.pathname.startsWith('/medico') ? '/medico/dashboard' : '/nutritionist/dashboard'
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileExists, setProfileExists] = useState(false)
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    specialty: '',
    experience: '',
    cau: '',
    website: '',
    email: '',
    phone: '',
    instagram: '',
    instagramUrl: '',
    facebook: '',
    facebookUrl: '',
    specialties: [] as string[],
    awards: '',
    education: '',
    avatar: '',
    coverImage: '',
  })
  
  const [customization, setCustomization] = useState<ProfileCustomization>(DEFAULT_CUSTOMIZATION)
  const [newSpecialty, setNewSpecialty] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Carregar perfil existente
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const response = await profileService.getMyProfile()
      
      if (response.data) {
        const profile = response.data
        setProfileExists(true)
        setFormData({
          displayName: profile.displayName || '',
          username: profile.username || '',
          bio: profile.bio || '',
          location: profile.location?.address?.city 
            ? `${profile.location.address.city}, ${profile.location.address.state}` 
            : '',
          specialty: profile.specialty || '',
          experience: profile.experience || '',
          cau: profile.cau ? (profile.cau.startsWith('CAU/') ? profile.cau : `CAU/${profile.cau}`) : '',
          website: profile.website || '',
          email: profile.email || '',
          phone: profile.phone || '',
          instagram: profile.social?.instagram?.username || '',
          instagramUrl: profile.social?.instagram?.url || '',
          facebook: profile.social?.facebook?.username || '',
          facebookUrl: profile.social?.facebook?.url || '',
          specialties: profile.specialties || [],
          awards: profile.awards || '',
          education: profile.education || '',
          avatar: profile.avatar || '',
          coverImage: profile.coverImage || '',
        })
        
        if (profile.customization) {
          // Garantir que show3DModels esteja presente (compatibilidade com perfis antigos)
          setCustomization({
            ...DEFAULT_CUSTOMIZATION,
            ...profile.customization,
            show3DModels: profile.customization.show3DModels !== undefined 
              ? profile.customization.show3DModels 
              : DEFAULT_CUSTOMIZATION.show3DModels
          })
        } else {
          // Se não houver customização, usar a padrão
          setCustomization(DEFAULT_CUSTOMIZATION)
        }
      } else {
        // Perfil não existe (404) ou outro erro - preencher com dados do usuário para criação
        setProfileExists(false)
        if (user) {
          setFormData(prev => ({
            ...prev,
            displayName: user.name || '',
            email: user.email || '',
            username: user.name?.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._]/g, '') || '',
          }))
        }
        
        // Log para debug - perfil não encontrado é esperado para novos usuários
        if (response.error?.includes('não encontrado') || response.error?.includes('not found')) {
          console.log('[PublicProfile] Perfil ainda não criado - mostrando formulário de criação')
        } else if (response.error) {
          console.error('[PublicProfile] Erro ao carregar perfil:', response.error)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      // Em caso de erro de rede, ainda permitir criar perfil
      setProfileExists(false)
      if (user) {
        setFormData(prev => ({
          ...prev,
          displayName: user.name || '',
          email: user.email || '',
          username: user.name?.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._]/g, '') || '',
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let sanitizedValue = value
    
    // Aplicar sanitização e máscaras baseado no campo
    switch (name) {
      case 'displayName':
        sanitizedValue = sanitizeInput(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.NAME)
        break
      case 'username':
        // Username: apenas letras minúsculas, números, pontos e underscores
        sanitizedValue = value.toLowerCase().replace(/[^a-z0-9._]/g, '')
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.USERNAME)
        break
      case 'bio':
        sanitizedValue = sanitizeText(value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';'])
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.BIO)
        break
      case 'location':
        sanitizedValue = sanitizeText(value, [',', ' ', '-'])
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.LOCATION)
        break
      case 'specialty':
        sanitizedValue = sanitizeInput(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.SPECIALTY)
        break
      case 'experience':
        sanitizedValue = sanitizeText(value, ['+', ' ', 'a', 'n', 'o', 's', 'A', 'N', 'O', 'S'])
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.EXPERIENCE)
        break
      case 'cau':
        sanitizedValue = maskCAU(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.CAU)
        break
      case 'website':
        sanitizedValue = sanitizeUrl(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.WEBSITE)
        break
      case 'email':
        // Email não deve ser editado aqui, mas sanitizar caso seja
        sanitizedValue = sanitizeInput(value.toLowerCase().trim())
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.EMAIL)
        break
      case 'phone':
        sanitizedValue = maskPhone(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.PHONE)
        break
      case 'instagram':
        sanitizedValue = sanitizeInput(value.replace(/[^a-zA-Z0-9._@]/g, ''))
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.INSTAGRAM)
        break
      case 'facebook':
        sanitizedValue = sanitizeInput(value.replace(/[^a-zA-Z0-9._]/g, ''))
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.FACEBOOK)
        break
      case 'instagramUrl':
      case 'facebookUrl':
        sanitizedValue = sanitizeUrl(value)
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.WEBSITE)
        break
      case 'education':
        sanitizedValue = sanitizeText(value, [' ', ',', '.', '-', '/'])
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.EDUCATION)
        break
      case 'awards':
        sanitizedValue = sanitizeText(value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';'])
        sanitizedValue = limitLength(sanitizedValue, INPUT_LIMITS.AWARDS)
        break
      default:
        sanitizedValue = sanitizeInput(value)
    }
    
    setFormData({
      ...formData,
      [name]: sanitizedValue,
    })
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleCoverClick = () => {
    coverInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem', 'error')
      return
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 10MB', 'error')
      return
    }

    setUploadingAvatar(true)
    try {
      const response = await profileService.uploadAvatar(file)
      if (response.data?.url) {
        setFormData(prev => ({ ...prev, avatar: response.data!.url }))
        showToast('Avatar atualizado com sucesso!', 'success')
      } else {
        showToast(response.error || 'Erro ao fazer upload do avatar', 'error')
      }
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
      showToast('Erro ao fazer upload do avatar', 'error')
    } finally {
      setUploadingAvatar(false)
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem', 'error')
      return
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 10MB', 'error')
      return
    }

    setUploadingCover(true)
    try {
      const response = await profileService.uploadCover(file)
      if (response.data?.url) {
        setFormData(prev => ({ ...prev, coverImage: response.data!.url }))
        showToast('Imagem de capa atualizada com sucesso!', 'success')
      } else {
        showToast(response.error || 'Erro ao fazer upload da imagem de capa', 'error')
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem de capa:', error)
      showToast('Erro ao fazer upload da imagem de capa', 'error')
    } finally {
      setUploadingCover(false)
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }
    }
  }

  const handleAddSpecialty = () => {
    const trimmed = newSpecialty.trim()
    if (trimmed && !formData.specialties.includes(trimmed)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, trimmed],
      })
      setNewSpecialty('')
    }
  }

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    })
  }

  const handleSpecialtyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSpecialty()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validar username
      if (!formData.username) {
        showToast('Nome de usuário é obrigatório', 'error')
        setIsSaving(false)
        return
      }
      
      if (!validateUsername(formData.username)) {
        showToast('Nome de usuário inválido. Use apenas letras minúsculas, números, pontos e underscores (3-30 caracteres)', 'error')
        setIsSaving(false)
        return
      }
      
      if (formData.website && !validateUrl(formData.website)) {
        showToast('URL do website inválida', 'error')
        setIsSaving(false)
        return
      }
      
      if (formData.phone && !validatePhone(formData.phone)) {
        showToast('Telefone inválido. Use o formato (00) 00000-0000', 'error')
        setIsSaving(false)
        return
      }

      // Montar objeto de perfil (dados já sanitizados pelo handleChange, mas garantir antes de enviar)
      const profileData: Partial<PublicProfileType> = {
        displayName: sanitizeInput(formData.displayName),
        username: formData.username.toLowerCase().trim(),
        bio: sanitizeText(formData.bio, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';', '(', ')', '[', ']', '{', '}', '/', '\\', '@', '#', '$', '%', '*', '+', '=', '_', '|', '~', '`', '^', '´', '°', 'ª', 'º']),
        specialty: sanitizeInput(formData.specialty),
        experience: sanitizeText(formData.experience, ['+', ' ', 'a', 'n', 'o', 's', 'A', 'N', 'O', 'S']),
        cau: formData.cau ? formData.cau.replace(/^CAU\//i, '').replace(/\s+/g, ' ').trim() : undefined, // Remove "CAU/" e normaliza espaços, salva como "UF A00000-0"
        website: formData.website ? sanitizeUrl(formData.website) : undefined,
        email: sanitizeInput(formData.email.toLowerCase().trim()),
        phone: formData.phone ? unmask(formData.phone) : undefined,
        specialties: formData.specialties.map(s => sanitizeInput(s)),
        awards: sanitizeText(formData.awards, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';']),
        education: sanitizeText(formData.education, [' ', ',', '.', '-', '/']),
        customization,
        location: formData.location ? {
          address: {
            city: formData.location.split(',')[0]?.trim() || '',
            state: formData.location.split(',')[1]?.trim() || '',
            country: 'Brasil',
          },
        } : undefined,
        social: {
          instagram: formData.instagram ? {
            username: formData.instagram,
            url: formData.instagramUrl || `https://instagram.com/${formData.instagram.replace('@', '')}`,
          } : undefined,
          facebook: formData.facebook ? {
            username: formData.facebook,
            url: formData.facebookUrl || `https://facebook.com/${formData.facebook}`,
          } : undefined,
        },
      }

      let response
      if (profileExists) {
        response = await profileService.updateMyProfile(profileData)
      } else {
        response = await profileService.createMyProfile(profileData)
      }

      if (response.data) {
        setProfileExists(true)
        showToast('Perfil salvo com sucesso!', 'success')
      } else {
        showToast(response.error || 'Erro ao salvar perfil', 'error')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      showToast('Erro ao salvar perfil. Tente novamente.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Construir objeto de preview
  const previewProfile: Partial<PublicProfileType> = {
    displayName: formData.displayName,
    username: formData.username,
    bio: formData.bio,
    specialty: formData.specialty,
    avatar: formData.avatar,
    coverImage: formData.coverImage,
    email: formData.email,
    phone: formData.phone,
    projectsCount: 12,
    reviewsCount: 28,
    location: formData.location ? {
      address: {
        city: formData.location.split(',')[0]?.trim() || '',
        state: formData.location.split(',')[1]?.trim() || '',
        country: 'Brasil',
      },
    } : undefined,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => navigate('/nutritionist/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Perfil Público</h1>
            <p className="text-gray-600 mt-1 text-xs md:text-sm">Personalize como os clientes veem você</p>
          </div>
          {formData.username && (
            <a
              href={`/profile/${formData.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 md:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm font-medium"
            >
              <VisibilityIcon sx={{ fontSize: 18 }} />
              <span className="hidden md:inline">Visualizar Perfil</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Profile Images */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 p-4 md:p-6 pb-3 md:pb-4 border-b border-gray-100">
                Imagens do Perfil
              </h2>
              
              <div className="relative">
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                {/* Cover Image */}
                <div className="relative h-48 md:h-56 bg-gray-100">
                  {uploadingCover ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Enviando imagem...</p>
                      </div>
                    </div>
                  ) : formData.coverImage ? (
                    <img
                      src={formData.coverImage}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary-100 to-primary-200 flex items-center justify-center">
                      <p className="text-primary-400 text-sm">Adicione uma imagem de capa</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCoverClick}
                    disabled={uploadingCover}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 text-white">
                      <ApartmentIcon sx={{ fontSize: 20 }} />
                      <span className="font-medium text-sm">{formData.coverImage ? 'Alterar Capa' : 'Adicionar Capa'}</span>
                    </div>
                  </button>
                  <p className="absolute bottom-2 right-4 text-xs text-white/80 bg-black/30 px-2 py-1 rounded">
                    Recomendado: 1200x400px
                  </p>
                </div>

                {/* Avatar */}
                <div className="relative px-4 md:px-6 pb-4 md:pb-6">
                  <div className="relative -mt-12 md:-mt-16 inline-block">
                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                      {uploadingAvatar ? (
                        <div className="w-full h-full rounded-full border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                        </div>
                      ) : formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Foto de perfil"
                          className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                          {formData.displayName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ApartmentIcon sx={{ fontSize: 24, color: 'white' }} />
                      </button>
                    </div>
                    <p className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                      Recomendado: 400x400px
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Nome de Exibição *
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    required
                    maxLength={INPUT_LIMITS.NAME}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Seu nome profissional"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Nome de Usuário *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      maxLength={INPUT_LIMITS.USERNAME}
                      pattern="[a-z0-9._]{3,30}"
                      className="w-full pl-7 pr-3 md:pl-8 md:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="nomedeusuario"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Seu perfil será: arckdesign.com/profile/{formData.username || 'usuario'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <LocationOnIcon sx={{ fontSize: 16 }} />
                    Localização
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.LOCATION}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Cidade, Estado"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <WorkIcon sx={{ fontSize: 16 }} />
                    Especialidade Principal
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.SPECIALTY}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Nutrição Clínica, Esportiva"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Experiência
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.EXPERIENCE}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: 10+ anos"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    CAU (Registro Profissional)
                  </label>
                  <input
                    type="text"
                    name="cau"
                    value={formData.cau}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.CAU}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: CAU/SP A12345-6"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Biografia
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={INPUT_LIMITS.BIO}
                  className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Conte um pouco sobre você e seu trabalho..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/{INPUT_LIMITS.BIO} caracteres
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Áreas de Atuação
                </label>
                
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(specialty)}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                          aria-label={`Remover ${specialty}`}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value)
                      setNewSpecialty(limitLength(sanitized, INPUT_LIMITS.SPECIALTY))
                    }}
                    onKeyPress={handleSpecialtyKeyPress}
                    maxLength={INPUT_LIMITS.SPECIALTY}
                    className="flex-1 px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Digite uma área de atuação e pressione Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialty}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm flex items-center gap-1.5"
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Informações Profissionais</h2>
              
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <SchoolIcon sx={{ fontSize: 16 }} />
                    Formação Acadêmica
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.EDUCATION}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: FAU-USP, Pós-graduação em..."
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Prêmios e Reconhecimentos
                  </label>
                  <textarea
                    name="awards"
                    value={formData.awards}
                    onChange={handleChange}
                    rows={3}
                    maxLength={INPUT_LIMITS.AWARDS}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Liste seus prêmios e reconhecimentos..."
                  />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.awards.length}/{INPUT_LIMITS.AWARDS} caracteres
                </p>
                </div>
              </div>
            </div>

            {/* Contact and Social Media - Combined */}
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Contato e Redes Sociais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <EmailIcon sx={{ fontSize: 16 }} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="seu@email.com"
                    title="Email não pode ser alterado aqui (use Configurações)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado (gerenciado em Configurações)</p>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <PhoneIcon sx={{ fontSize: 16 }} />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.PHONE}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <LanguageIcon sx={{ fontSize: 16 }} />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    maxLength={INPUT_LIMITS.WEBSITE}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://www.seusite.com.br"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Redes Sociais</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <InstagramIcon sx={{ fontSize: 16 }} />
                      Instagram
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.INSTAGRAM}
                      className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="@seuusuario"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Link do Instagram
                    </label>
                    <input
                      type="url"
                      name="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.WEBSITE}
                      className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://instagram.com/seuusuario"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <FacebookIcon sx={{ fontSize: 16 }} />
                      Facebook
                    </label>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.FACEBOOK}
                      className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="seuusuario"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Link do Facebook
                    </label>
                    <input
                      type="url"
                      name="facebookUrl"
                      value={formData.facebookUrl}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.WEBSITE}
                      className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://facebook.com/seuusuario"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Layout Customization */}
            <LayoutCustomizer 
              customization={customization}
              onChange={setCustomization}
            />

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 md:gap-4 bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                Cancelar
              </button>
              <LoadingButton
                type="submit"
                loading={isSaving}
                variant="primary"
                size="lg"
                icon={<SaveIcon sx={{ fontSize: 18 }} />}
                className="px-4 md:px-6 py-2 md:py-3 font-semibold text-sm"
              >
                {profileExists ? 'Salvar Alterações' : 'Criar Perfil'}
              </LoadingButton>
            </div>
          </form>
        </div>

        {/* Right Column - Preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-20">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Preview em Tempo Real</h3>
              <p className="text-xs text-gray-500">Veja como seu perfil aparecerá para visitantes</p>
            </div>
            <LayoutPreview 
              profile={previewProfile}
              customization={customization}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProfile

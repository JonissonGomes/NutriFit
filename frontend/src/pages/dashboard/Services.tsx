import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, DollarSign, Clock, Building2, ArrowLeft, CheckCircle, X, Power, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { servicesService } from '../../services'
import type { Service, CreateServiceRequest, ServiceCategory, ServiceStats } from '../../services/services.service'
import { useToast } from '../../contexts/ToastContext'
import LoadingButton from '../../components/common/LoadingButton'
import ConfirmModal from '../../components/common/ConfirmModal'
import { sanitizeInput, sanitizeText, limitLength } from '../../utils/inputUtils'

const Services = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: '',
    description: '',
    price: 0,
    duration: '',
    category: 'residencial',
    features: [],
  })
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    const [servicesRes, statsRes] = await Promise.all([
      servicesService.list({ limit: 50 }),
      servicesService.getStats(),
    ])

    if (servicesRes.data) {
      setServices(servicesRes.data.data || [])
    } else if (servicesRes.error) {
      showToast(servicesRes.error, 'error')
    }

    if (statsRes.data) {
      setStats(statsRes.data)
    }

    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Nome é obrigatório', 'error')
      return
    }
    if (formData.price < 0) {
      showToast('Preço não pode ser negativo', 'error')
      return
    }
    if (!formData.duration.trim()) {
      showToast('Duração é obrigatória', 'error')
      return
    }

    setSaving(true)

    if (editingService) {
      // Atualizar serviço existente
      const response = await servicesService.update(editingService.id, formData)
      if (response.data) {
        showToast('Serviço atualizado com sucesso!', 'success')
        closeModal()
        loadData()
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } else {
      // Criar novo serviço
      const response = await servicesService.create(formData)
      if (response.data) {
        showToast('Serviço criado com sucesso!', 'success')
        closeModal()
        loadData()
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    }

    setSaving(false)
  }

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return

    setDeletingId(serviceToDelete)
    try {
      const response = await servicesService.delete(serviceToDelete)
      if (response.data) {
        showToast('Serviço excluído com sucesso!', 'success')
        loadData()
        setShowDeleteConfirm(false)
        setServiceToDelete(null)
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string) => {
    setTogglingId(id)
    try {
      const response = await servicesService.toggleActive(id)
      if (response.data) {
        showToast(response.data.message, 'success')
        loadData()
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } finally {
      setTogglingId(null)
    }
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      features: service.features || [],
    })
    setShowModal(true)
  }

  const openNewModal = () => {
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: '',
      category: 'residencial',
      features: [],
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: '',
      category: 'residencial',
      features: [],
    })
    setNewFeature('')
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }))
  }

  const categories: ServiceCategory[] = ['residencial', 'comercial', 'interiores', 'reforma', 'consultoria', 'paisagismo', 'outro']

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/nutritionist/dashboard')}
          className="p-2 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Meus Serviços</h1>
            <p className="text-gray-600 mt-1 text-xs md:text-sm">Gerencie seus pacotes e preços</p>
          </div>
          <button 
            onClick={openNewModal}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 w-fit"
          >
            <Plus className="h-5 w-5" />
            Novo Serviço
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stats?.total || services.length}</h3>
          <p className="text-sm text-gray-600">Total de Serviços</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {servicesService.formatPrice(stats?.averagePrice || 0)}
          </h3>
          <p className="text-sm text-gray-600">Ticket Médio</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {stats?.active || services.filter(s => s.active).length}
          </h3>
          <p className="text-sm text-gray-600">Serviços Ativos</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-accent-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-accent-600" />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {servicesService.formatPrice(stats?.totalValue || 0)}
          </h3>
          <p className="text-sm text-gray-600">Valor Total</p>
        </div>
      </div>

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl p-6 border border-gray-200 ${!service.active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {service.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <LoadingButton
                    onClick={() => handleToggleActive(service.id)}
                    loading={togglingId === service.id}
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-lg" 
                    title={service.active ? 'Desativar' : 'Ativar'}
                    icon={<Power className={`h-5 w-5 ${service.active ? 'text-green-600' : 'text-gray-400'}`} />}
                  >
                    <span className="sr-only">{service.active ? 'Desativar' : 'Ativar'}</span>
                  </LoadingButton>
                  <button 
                    onClick={() => openEditModal(service)}
                    disabled={deletingId === service.id || togglingId === service.id}
                    className="p-2 rounded-lg disabled:opacity-50" 
                    title="Editar"
                  >
                    <Edit className="h-5 w-5 text-gray-600" />
                  </button>
                  <LoadingButton
                    onClick={() => handleDeleteClick(service.id)}
                    loading={deletingId === service.id}
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-lg" 
                    title="Excluir"
                    icon={<Trash2 className="h-5 w-5 text-red-600" />}
                  >
                    <span className="sr-only">Excluir</span>
                  </LoadingButton>
                </div>
              </div>
              
              {/* Features List */}
              {service.features && service.features.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">O que está incluído:</h4>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price and Details */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                  <span className="text-xl md:text-2xl font-bold text-gray-900">
                    {servicesService.formatPrice(service.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <span className="text-sm">{service.duration}</span>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${servicesService.getCategoryColor(service.category)}`}>
                    {servicesService.getCategoryLabel(service.category)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Você ainda não tem serviços cadastrados</p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 text-primary-600 font-semibold"
          >
            <Plus className="h-5 w-5" />
            Criar primeiro serviço
          </button>
        </div>
      )}

      {/* Categorias */}
      {services.length > 0 && (
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Categorias de Serviços</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {categories.map((category) => (
              <div
                key={category}
                className="bg-white p-3 rounded-lg border border-gray-200 text-center cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-900">{servicesService.getCategoryLabel(category)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {services.filter(s => s.category === category).length} serviço(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Novo/Editar Serviço */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value)
                    setFormData(prev => ({ ...prev, name: limitLength(sanitized, 100) }))
                  }}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Projeto Arquitetônico Residencial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const sanitized = sanitizeText(e.target.value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';'])
                    setFormData(prev => ({ ...prev, description: limitLength(sanitized, 1000) }))
                  }}
                  maxLength={1000}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descreva o serviço..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.description || '').length}/1000 caracteres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={0}
                    step={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração *
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => {
                      const sanitized = sanitizeText(e.target.value, [' ', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'm', 'e', 's', 'a', 'o', 'd', 'i', 'a', 'h', 'r', 'M', 'E', 'S', 'A', 'O', 'D', 'I', 'A', 'H', 'R'])
                      setFormData(prev => ({ ...prev, duration: limitLength(sanitized, 50) }))
                    }}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: 2-3 meses"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ServiceCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {servicesService.getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  O que está incluído
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value)
                      setNewFeature(limitLength(sanitized, 100))
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    maxLength={100}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Projeto executivo"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {formData.features && formData.features.length > 0 && (
                  <ul className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-700">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>
              <LoadingButton
                onClick={handleSubmit}
                loading={saving}
                variant="primary"
                fullWidth
                className="flex-1"
              >
                {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setServiceToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deletingId !== null}
      />
    </div>
  )
}

export default Services

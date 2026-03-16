import React, { useState, useEffect, useRef } from 'react'
import { Palette, Download, Visibility, Delete, Inventory, Close } from '@mui/icons-material'
import { model3dService, MODEL_CATEGORIES } from '../../services'
import type { ModelFile, ModelStats } from '../../services/model3d.service'
import Model3DViewer from '../../components/viewer3d/Model3DViewer'
import { useToast } from '../../contexts/ToastContext'
import LoadingButton from '../../components/common/LoadingButton'
import ConfirmModal from '../../components/common/ConfirmModal'

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Models3D: React.FC = () => {
  const { showToast } = useToast()
  const [models, setModels] = useState<ModelFile[]>([])
  const [stats, setStats] = useState<ModelStats | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showViewerModal, setShowViewerModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    isPublic: false,
  })

  // Carregar modelos
  useEffect(() => {
    loadModels()
    loadStats()
  }, [filterStatus, filterCategory])

  const loadModels = async () => {
    setIsLoading(true)
    const response = await model3dService.list({
      status: filterStatus as any || undefined,
      category: filterCategory || undefined,
      limit: 50,
    })
    if (response.data) {
      // Mapear modelos garantindo que as URLs estejam corretas
      const mappedModels = (response.data.data || []).map((model: any) => ({
        ...model,
        // Garantir que originalUrl e webUrl estejam mapeados corretamente
        originalUrl: model.originalUrl || model.OriginalURL || '',
        webUrl: model.webUrl || model.WebURL || '',
        thumbnailUrl: model.thumbnailUrl || model.ThumbnailURL || '',
      }))
      setModels(mappedModels)
    }
    setIsLoading(false)
  }

  const loadStats = async () => {
    const response = await model3dService.getStats()
    if (response.data) {
      setStats(response.data)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm({ ...uploadForm, title: file.name.replace(/\.[^/.]+$/, '') })
      setShowUploadModal(true)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    const response = await model3dService.upload(
      file,
      {
        title: uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category,
        tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        isPublic: uploadForm.isPublic,
      },
      (progress) => setUploadProgress(progress)
    )

    setIsUploading(false)

    if (response.data) {
      setShowUploadModal(false)
      setUploadForm({ title: '', description: '', category: '', tags: '', isPublic: false })
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadModels()
      loadStats()
      showToast('Modelo 3D enviado com sucesso!', 'success')
    } else {
      showToast(response.error || 'Erro ao fazer upload', 'error')
    }
  }

  const handleDeleteClick = (modelId: string) => {
    setModelToDelete(modelId)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!modelToDelete) return

    setDeletingId(modelToDelete)
    try {
      const response = await model3dService.delete(modelToDelete)
      if (!response.error) {
        loadModels()
        loadStats()
        showToast('Modelo excluído com sucesso!', 'success')
        setShowDeleteConfirm(false)
        setModelToDelete(null)
      } else {
        showToast(response.error || 'Erro ao excluir modelo', 'error')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleRetryProcessing = async (modelId: string) => {
    setRetryingId(modelId)
    try {
      const response = await model3dService.retryProcessing(modelId)
      if (!response.error) {
        showToast('Reprocessamento iniciado', 'success')
        loadModels()
      } else {
        showToast(response.error || 'Erro ao reprocessar', 'error')
      }
    } finally {
      setRetryingId(null)
    }
  }

  const handleView = async (model: ModelFile) => {
    // Normalizar URLs (compatibilidade com backend que pode retornar maiúsculas)
    const webUrl = model.webUrl || (model as any).WebURL || ''
    const originalUrl = model.originalUrl || (model as any).OriginalURL || ''
    
    // Se o modelo não tiver URL, tentar recarregar os dados
    if (model.status === 'ready' && !webUrl && !originalUrl) {
      try {
        const response = await model3dService.getById(model.id)
        if (response.data) {
          const updatedModel = {
            ...response.data,
            originalUrl: response.data.originalUrl || (response.data as any).OriginalURL || '',
            webUrl: response.data.webUrl || (response.data as any).WebURL || '',
          }
          setSelectedModel(updatedModel)
        } else {
          setSelectedModel(model)
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do modelo:', error)
        setSelectedModel(model)
      }
    } else {
      // Garantir que o modelo tenha as URLs normalizadas
      setSelectedModel({
        ...model,
        originalUrl,
        webUrl,
      })
    }
    setShowViewerModal(true)
  }

  const handleDownload = async (model: ModelFile, format: 'original' | 'web' = 'web') => {
    try {
      const response = await model3dService.getDownloadInfo(model.id, format)
      if (response.data?.url) {
        // Abrir URL de download em nova aba
        window.open(response.data.url, '_blank')
        showToast('Download iniciado', 'success')
      } else {
        // Fallback: usar URL direta do modelo (compatibilidade com maiúsculas)
        const webUrl = model.webUrl || (model as any).WebURL || ''
        const originalUrl = model.originalUrl || (model as any).OriginalURL || ''
        const downloadUrl = format === 'web' && webUrl ? webUrl : originalUrl
        
        if (downloadUrl) {
          window.open(downloadUrl, '_blank')
          showToast('Download iniciado', 'success')
        } else {
          showToast('URL de download não disponível', 'error')
        }
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      // Fallback: usar URL direta do modelo (compatibilidade com maiúsculas)
      const webUrl = model.webUrl || (model as any).WebURL || ''
      const originalUrl = model.originalUrl || (model as any).OriginalURL || ''
      const downloadUrl = format === 'web' && webUrl ? webUrl : originalUrl
      
      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
        showToast('Download iniciado', 'success')
      } else {
        showToast('Erro ao fazer download', 'error')
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ready': return 'bg-green-500'
      case 'processing': return 'bg-yellow-500'
      case 'pending': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ready': return 'Pronto'
      case 'processing': return 'Processando'
      case 'pending': return 'Pendente'
      case 'failed': return 'Falhou'
      default: return status
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelos 3D</h1>
          <p className="text-gray-600">Gerencie seus arquivos 3D e visualize-os no navegador</p>
        </div>
        <label className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-xs md:text-sm font-medium whitespace-nowrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".obj,.fbx,.gltf,.glb,.3ds,.stl,.ply,.dae,.dwg,.dxf,.skp,.rvt,.ifc,.3dm"
            className="hidden"
            onChange={handleFileSelect}
          />
          + Adicionar modelo
        </label>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.totalFiles}</div>
            <div className="text-sm text-gray-500">Total de arquivos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
            <div className="text-sm text-gray-500">Prontos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.processing + stats.pending}</div>
            <div className="text-sm text-gray-500">Em processamento</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews || 0}</div>
            <div className="text-sm text-gray-500">Visualizações</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.totalDownloads || 0}</div>
            <div className="text-sm text-gray-500">Downloads</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="ready">Pronto</option>
          <option value="processing">Processando</option>
          <option value="pending">Pendente</option>
          <option value="failed">Falhou</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {MODEL_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Inventory className="text-6xl mb-4 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum modelo 3D</h3>
          <p className="text-gray-500">Faça upload do seu primeiro modelo 3D</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {models.map((model) => (
            <div key={model.id} className="bg-white rounded-lg shadow overflow-hidden group">
              {/* Preview */}
              <div 
                className="h-40 bg-gray-800 flex items-center justify-center cursor-pointer relative"
                onClick={() => model.status === 'ready' && handleView(model)}
              >
                {model.thumbnailUrl ? (
                  <img src={model.thumbnailUrl} alt={model.title} className="w-full h-full object-cover" />
                ) : (
                  <Palette className="text-4xl text-gray-400" />
                )}
                
                {/* Status badge */}
                <span className={`absolute top-2 right-2 px-2 py-1 text-xs text-white rounded ${getStatusColor(model.status)}`}>
                  {getStatusLabel(model.status)}
                </span>

                {/* Overlay on hover */}
                {model.status === 'ready' && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-sm">Visualizar em 3D</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate" title={model.title}>
                  {model.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {model.originalFormat.toUpperCase()} • {formatFileSize(model.originalSize)}
                </p>
                {model.category && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {MODEL_CATEGORIES.find(c => c.value === model.category)?.label || model.category}
                  </span>
                )}

                {/* Stats */}
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Visibility className="text-base" />
                    {model.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="text-base" />
                    {model.downloads}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {model.status === 'ready' && (
                    <button
                      onClick={() => handleView(model)}
                      className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition"
                    >
                      Visualizar
                    </button>
                  )}
                  {model.status === 'failed' && (
                    <LoadingButton
                      onClick={() => handleRetryProcessing(model.id)}
                      loading={retryingId === model.id}
                      variant="outline"
                      size="sm"
                      className="flex-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    >
                      Reprocessar
                    </LoadingButton>
                  )}
                  <LoadingButton
                    onClick={() => handleDeleteClick(model.id)}
                    loading={deletingId === model.id}
                    variant="ghost"
                    size="sm"
                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200"
                    icon={<Delete className="text-base" />}
                  >
                    Excluir
                  </LoadingButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload de Modelo 3D</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {MODEL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="mobilia, moderno, sala"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm({ ...uploadForm, isPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">Tornar público</label>
              </div>

              {isUploading && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Enviando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                disabled={isUploading}
              >
                Cancelar
              </button>
              <LoadingButton
                onClick={handleUpload}
                loading={isUploading}
                variant="primary"
                fullWidth
                className="flex-1"
                disabled={!uploadForm.title}
              >
                Enviar
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {showViewerModal && selectedModel && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 text-white bg-black/50">
              <div>
                <h2 className="text-xl font-bold">{selectedModel.title}</h2>
                <p className="text-sm text-gray-400">
                  {selectedModel.originalFormat.toUpperCase()} • {formatFileSize(selectedModel.originalSize)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Button */}
                {selectedModel.status === 'ready' && (
                  <div className="flex gap-2">
                    {(selectedModel.webUrl || (selectedModel as any).WebURL) && (
                      <button
                        onClick={() => handleDownload(selectedModel, 'web')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                        title="Download formato web (GLB/GLTF)"
                      >
                        <Download className="text-base" />
                        <span className="text-sm">Download Web</span>
                      </button>
                    )}
                    {(selectedModel.originalUrl || (selectedModel as any).OriginalURL) && (
                      <button
                        onClick={() => handleDownload(selectedModel, 'original')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
                        title="Download formato original"
                      >
                        <Download className="text-base" />
                        <span className="text-sm">Download Original</span>
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setShowViewerModal(false)}
                  className="p-2 hover:bg-white/10 rounded transition"
                >
                  <Close />
                </button>
              </div>
            </div>

            {/* Viewer */}
            <div className="flex-1">
              {selectedModel.status === 'ready' ? (
                (() => {
                  // Tentar obter URL de diferentes formas (compatibilidade com backend)
                  const webUrl = selectedModel.webUrl || (selectedModel as any).WebURL || ''
                  const originalUrl = selectedModel.originalUrl || (selectedModel as any).OriginalURL || ''
                  const modelUrl = webUrl || originalUrl
                  
                  if (modelUrl) {
                    return (
                      <Model3DViewer
                        modelUrl={modelUrl}
                        backgroundColor={selectedModel.backgroundColor || '#1a1a2e'}
                        lighting={selectedModel.defaultLighting as any || 'studio'}
                        autoRotate
                        showControls
                      />
                    )
                  }
                  
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-white">
                      <Palette className="text-6xl mb-4 text-gray-400" />
                      <p className="text-lg mb-2">URL do modelo não disponível</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Status: {getStatusLabel(selectedModel.status)}
                      </p>
                      {/* Sempre mostrar botões de download se houver URLs disponíveis */}
                      <div className="flex gap-2">
                        {webUrl && (
                          <button
                            onClick={() => handleDownload(selectedModel, 'web')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                          >
                            <Download className="text-base" />
                            <span>Download Web</span>
                          </button>
                        )}
                        {originalUrl && (
                          <button
                            onClick={() => handleDownload(selectedModel, 'original')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
                          >
                            <Download className="text-base" />
                            <span>Download Original</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Palette className="text-6xl mb-4 text-gray-400" />
                  <p className="text-lg mb-2">Modelo ainda não está pronto para visualização</p>
                  <p className="text-sm text-gray-400">
                    Status: {getStatusLabel(selectedModel.status)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setModelToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Excluir Arquivo"
        message="Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deletingId !== null}
      />
    </div>
  )
}

export default Models3D


import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Eye } from 'lucide-react'
import { model3dService } from '../services'
import { useToast } from '../contexts/ToastContext'
import Model3DViewer from '../components/viewer3d/Model3DViewer'
import type { ModelFile } from '../services/model3d.service'

const Model3DView = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()

  const [model, setModel] = useState<ModelFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      if (!id) {
        setError('ID do modelo não fornecido')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Usar endpoint público que não requer autenticação
        const response = await model3dService.getPublicById(id)
        
        if (response.data) {
          // Normalizar URLs (compatibilidade com maiúsculas do backend)
          const normalizedModel = {
            ...response.data,
            originalUrl: response.data.originalUrl || (response.data as any).OriginalURL || '',
            webUrl: response.data.webUrl || (response.data as any).WebURL || '',
            thumbnailUrl: response.data.thumbnailUrl || (response.data as any).ThumbnailURL || '',
          }

          // O backend já verifica se o modelo é público, mas verificamos novamente por segurança
          // Verificar se o modelo está pronto
          if (normalizedModel.status !== 'ready') {
            setError(`Modelo ainda não está pronto. Status: ${normalizedModel.status}`)
            setLoading(false)
            return
          }

          setModel(normalizedModel)
        } else if (response.error) {
          setError(response.error)
        } else {
          setError('Modelo não encontrado')
        }
      } catch (err) {
        console.error('Erro ao carregar modelo:', err)
        setError('Erro ao carregar modelo')
      } finally {
        setLoading(false)
      }
    }

    loadModel()
  }, [id])

  const handleDownload = async (format: 'original' | 'web' = 'web') => {
    if (!model) return

    try {
      const response = await model3dService.getDownloadInfo(model.id, format)
      if (response.data?.url) {
        window.open(response.data.url, '_blank')
        showToast('Download iniciado', 'success')
      } else {
        // Fallback: usar URL direta
        const downloadUrl = format === 'web' && model.webUrl ? model.webUrl : model.originalUrl
        if (downloadUrl) {
          window.open(downloadUrl, '_blank')
          showToast('Download iniciado', 'success')
        } else {
          showToast('URL de download não disponível', 'error')
        }
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      // Fallback: usar URL direta
      const downloadUrl = format === 'web' && model.webUrl ? model.webUrl : model.originalUrl
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando modelo...</p>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Modelo não encontrado</h2>
          <p className="text-gray-600 mb-4">{error || 'O modelo que você procura não existe ou não está disponível.'}</p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para explorar
          </Link>
        </div>
      </div>
    )
  }

  // Determinar URL do modelo para visualização
  const modelUrl = model.webUrl || model.originalUrl || ''
  const modelFormat = model.webFormat || model.originalFormat

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/explore"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{model.title}</h1>
                {model.description && (
                  <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {model.webUrl && (
                <button
                  onClick={() => handleDownload('web')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  title="Download formato web (GLB)"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download GLB</span>
                </button>
              )}
              {model.originalUrl && (
                <button
                  onClick={() => handleDownload('original')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  title={`Download formato original (${model.originalFormat?.toUpperCase()})`}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Original</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {modelUrl ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="aspect-video bg-gray-900">
              <Model3DViewer
                modelUrl={modelUrl}
                format={modelFormat === 'glb' || modelFormat === 'gltf' ? modelFormat : 'glb'}
                backgroundColor="#1a1a2e"
                autoRotate={false}
                showControls={true}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">URL do modelo não disponível</p>
            <p className="text-sm text-gray-500">Status: {model.status}</p>
          </div>
        )}

        {/* Model Info */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informações do Modelo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Formato Original</p>
              <p className="font-semibold text-gray-900">{model.originalFormat?.toUpperCase() || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tamanho Original</p>
              <p className="font-semibold text-gray-900">{formatFileSize(model.originalSize || 0)}</p>
            </div>
            {model.webFormat && (
              <div>
                <p className="text-sm text-gray-500">Formato Web</p>
                <p className="font-semibold text-gray-900">{model.webFormat.toUpperCase()}</p>
              </div>
            )}
            {model.webSize && (
              <div>
                <p className="text-sm text-gray-500">Tamanho Web</p>
                <p className="font-semibold text-gray-900">{formatFileSize(model.webSize)}</p>
              </div>
            )}
            {model.vertexCount && (
              <div>
                <p className="text-sm text-gray-500">Vértices</p>
                <p className="font-semibold text-gray-900">{model.vertexCount.toLocaleString('pt-BR')}</p>
              </div>
            )}
            {model.faceCount && (
              <div>
                <p className="text-sm text-gray-500">Faces</p>
                <p className="font-semibold text-gray-900">{model.faceCount.toLocaleString('pt-BR')}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Visualizações</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {model.views || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Downloads</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Download className="h-4 w-4" />
                {model.downloads || 0}
              </p>
            </div>
          </div>
          {model.tags && model.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {model.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Model3DView


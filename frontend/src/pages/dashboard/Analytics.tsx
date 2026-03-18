import React, { useState, useEffect } from 'react'
import { BarChart, Lightbulb, Check } from '@mui/icons-material'
import { useToast } from '../../contexts/ToastContext'
import { analyticsService } from '../../services'

interface OverviewData {
  totalViews: number
  totalProfileViews: number
  totalProjectViews: number
  totalContacts: number
  totalMessages: number
  conversionRate: number
  viewsTrend: { date: string; value: number }[]
  topProjects: { id: string; title: string; views: number }[]
  topSources: { source: string; count: number }[]
}

const Analytics: React.FC = () => {
  const { showToast } = useToast()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await analyticsService.getOverview(period)
      if (response.data) {
        setOverview(response.data as unknown as OverviewData)
      }
    } catch {
      showToast('Erro ao carregar estatísticas', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estatísticas</h1>
          <p className="text-gray-600">Acompanhe o desempenho do seu perfil e conteúdos</p>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { key: '7d', label: '7 dias' },
            { key: '30d', label: '30 dias' },
            { key: '90d', label: '90 dias' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as typeof period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === p.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!overview ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <BarChart className="text-6xl mb-4 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum dado disponível
          </h3>
          <p className="text-gray-500">
            Os dados estatísticos aparecerão aqui conforme seu perfil receber visualizações.
          </p>
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-gray-900">{overview.totalViews || 0}</div>
              <div className="text-gray-500">Visualizações totais</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-blue-600">{overview.totalProfileViews || 0}</div>
              <div className="text-gray-500">Visitas ao perfil</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-green-600">{overview.totalContacts || 0}</div>
              <div className="text-gray-500">Contatos recebidos</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-purple-600">
                {overview.conversionRate?.toFixed(1) || 0}%
              </div>
              <div className="text-gray-500">Taxa de conversão</div>
            </div>
          </div>

          {/* Charts & Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Views Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de visualizações</h3>
              {overview.viewsTrend?.length ? (
                <div className="h-48 flex items-end justify-between gap-1">
                  {overview.viewsTrend.map((item, idx) => {
                    const maxValue = Math.max(...overview.viewsTrend.map(v => v.value)) || 1
                    const height = (item.value / maxValue) * 100
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 transition"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${item.date}: ${item.value} views`}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  Dados insuficientes
                </div>
              )}
            </div>

            {/* Top Projects */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conteúdos mais vistos</h3>
              {overview.topProjects?.length ? (
                <div className="space-y-3">
                  {overview.topProjects.slice(0, 5).map((project, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm text-gray-600">
                          {idx + 1}
                        </span>
                        <span className="text-gray-900 truncate max-w-[200px]">{project.title}</span>
                      </div>
                      <span className="text-gray-500 text-sm">{project.views} views</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  Nenhum projeto visualizado ainda
                </div>
              )}
            </div>

            {/* Traffic Sources */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Origem do tráfego</h3>
              {overview.topSources?.length ? (
                <div className="space-y-3">
                  {overview.topSources.map((source, idx) => {
                    const total = overview.topSources.reduce((sum, s) => sum + s.count, 0)
                    const percentage = (source.count / total) * 100
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{source.source}</span>
                          <span className="text-gray-500">{source.count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  Nenhuma fonte de tráfego identificada
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-xl text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="text-xl" />
                Dicas para melhorar
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="text-sm mt-0.5" />
                  <span>Adicione mais conteúdos ao seu perfil para atrair mais visitantes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-sm mt-0.5" />
                  <span>Complete seu perfil com todas as informações para gerar mais confiança</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-sm mt-0.5" />
                  <span>Responda rapidamente às mensagens para aumentar sua taxa de conversão</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-sm mt-0.5" />
                  <span>Adicione conteúdos (materiais e artigos) para se destacar</span>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics


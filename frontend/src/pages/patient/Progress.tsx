import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { api } from '../../services'
import EmptyState from '../../components/common/EmptyState'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

interface AnthropometricRecord {
  id: string
  date: string
  weight: number
  height: number
  bodyFat?: number
  muscleMass?: number
  bmi?: number
}

const Progress = () => {
  const [items, setItems] = useState<AnthropometricRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await api.get<{ data: AnthropometricRecord[] }>(`/anthropometric/me?limit=50`)
    if (res.error) {
      setError(getFriendlyErrorMessage(res.error, 'Não foi possível carregar sua evolução.'))
      setItems([])
    } else {
      setItems(res.data?.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return <LoadingState message="Carregando evolução…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Evolução</h1>
        <p className="text-gray-600 mt-1">Histórico de peso e indicadores cadastrados.</p>
      </div>

      {error ? (
        <InlineAlert variant="error">
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="block mt-2 text-sm font-semibold underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </InlineAlert>
      ) : null}

      {items.length === 0 && !error ? (
        <EmptyState
          icon={<TrendingUp className="h-10 w-10" />}
          title="Nenhum registro de evolução ainda"
          description="Quando seu nutricionista registrar medidas, elas aparecerão aqui."
        />
      ) : items.length > 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-primary-100 font-semibold text-gray-900">
            Registros recentes
          </div>
          <div className="divide-y divide-primary-100">
            {items.map((r) => (
              <div key={r.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-gray-600">
                  {new Date(r.date).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="font-semibold text-gray-900">Peso: {r.weight} kg</span>
                  <span className="text-gray-700">IMC: {r.bmi?.toFixed(1) ?? '-'}</span>
                  <span className="text-gray-700">%G: {r.bodyFat ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Progress

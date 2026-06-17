import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import { api } from '../../services'
import EmptyState from '../../components/common/EmptyState'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

interface Goal {
  id: string
  type: string
  description: string
  targetValue?: number
  currentValue?: number
  deadline?: string
  status: string
  checkIns?: { points?: number }[]
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Em andamento',
  completed: 'Concluída',
  paused: 'Pausada',
  cancelled: 'Cancelada',
}

const Goals = () => {
  const [items, setItems] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const res = await api.get<{ data: Goal[] }>(`/goals/me`)
      if (res.error) {
        setError(getFriendlyErrorMessage(res.error, 'Não foi possível carregar suas metas.'))
        setItems([])
      } else {
        setItems(res.data?.data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <LoadingState message="Carregando metas…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Metas</h1>
        <p className="text-gray-600 mt-1">Acompanhe as metas definidas com seu nutricionista.</p>
      </div>

      {error ? (
        <InlineAlert variant="error" onDismiss={() => setError('')}>
          {error}
        </InlineAlert>
      ) : null}

      {items.length === 0 && !error ? (
        <EmptyState
          icon={<Target className="h-10 w-10" />}
          title="Nenhuma meta cadastrada"
          description="Quando seu nutricionista definir metas, elas aparecerão aqui."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((g) => {
            const points = (g.checkIns || []).reduce((sum, c) => sum + (c.points || 0), 0)
            return (
            <div key={g.id} className="bg-white border border-primary-100 rounded-xl p-5">
              <div className="text-xs text-gray-500 uppercase">{g.type}</div>
              <div className="font-bold text-gray-900 mt-1">{g.description}</div>
              <div className="text-sm text-emerald-700 mt-1 font-semibold">{points} pontos</div>
              <div className="text-sm text-gray-600 mt-2">
                Progresso: {g.currentValue ?? 0} / {g.targetValue ?? 0}
              </div>
              {g.deadline && (
                <div className="text-sm text-gray-600 mt-1">
                  Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
                </div>
              )}
              <div className="text-sm font-semibold text-primary-700 mt-3">
                {STATUS_LABEL[g.status] ?? g.status}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}

export default Goals

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../services'

interface Goal {
  id: string
  type: string
  description: string
  targetValue?: number
  currentValue?: number
  deadline?: string
  status: string
}

const Goals = () => {
  const [items, setItems] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await api.get<{ data: Goal[] }>(`/goals/me`)
      setItems(res.data?.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Metas</h1>
        <p className="text-gray-600 mt-1">Acompanhe as metas definidas com seu nutricionista.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-8 text-center">
          <p className="text-gray-700 font-semibold">Nenhuma meta cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((g) => (
            <div key={g.id} className="bg-white border border-primary-100 rounded-xl p-5">
              <div className="text-xs text-gray-500 uppercase">{g.type}</div>
              <div className="font-bold text-gray-900 mt-1">{g.description}</div>
              <div className="text-sm text-gray-600 mt-2">
                Progresso: {g.currentValue ?? 0} / {g.targetValue ?? 0}
              </div>
              {g.deadline && (
                <div className="text-sm text-gray-600 mt-1">
                  Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
                </div>
              )}
              <div className="text-sm font-semibold text-primary-700 mt-3 capitalize">
                {g.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Goals


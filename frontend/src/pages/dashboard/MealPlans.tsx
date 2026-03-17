import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Plus, Search } from 'lucide-react'
import { mealPlanService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import { sanitizeInput, limitLength } from '../../utils/inputUtils'
import type { MealPlan } from '../../types/api'

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
}

const statusClass: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-primary-100 text-primary-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-accent-100 text-accent-900',
}

const MealPlans = () => {
  const { showToast } = useToast()
  const [items, setItems] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter((mp) => (mp.title || '').toLowerCase().includes(s))
  }, [items, search])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await mealPlanService.list({ page: 1, limit: 50 })
      const payload = (res.data as any)?.data ?? (res.data as any)
      const arr = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setItems(arr)
      if (res.error) showToast(res.error, 'error')
      setLoading(false)
    }
    load()
  }, [showToast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Planos alimentares</h1>
          <p className="text-gray-600 mt-1">Gerencie e publique planos para seus pacientes.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(limitLength(sanitizeInput(e.target.value), 80))}
              placeholder="Buscar por título"
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Link
            to="/nutritionist/meal-plans/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-900 font-semibold">Nenhum plano encontrado.</p>
          <p className="text-gray-600 mt-2">Crie seu primeiro plano alimentar para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mp) => (
            <Link
              key={mp.id}
              to={`/nutritionist/meal-plans/${mp.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{mp.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">{mp.description || 'Plano alimentar'}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusClass[mp.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {statusLabel[mp.status] || mp.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span className="capitalize">{mp.category}</span>
                <span className="text-primary-700 font-semibold">Abrir</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MealPlans


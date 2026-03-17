import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowRight } from 'lucide-react'
import { mealPlanService } from '../../services'
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
  const [items, setItems] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await mealPlanService.list({ page: 1, limit: 20 })
      // backend pode retornar {data:[], total...} ou {data:{data:[],...}}
      const data = (res.data as any)?.data ?? (res.data as any)
      setItems(Array.isArray(data) ? data : [])
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meu plano alimentar</h1>
        <p className="text-gray-600 mt-1">Acesse refeições, macros e orientações do seu nutricionista.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-8 text-center">
          <p className="text-gray-700 font-semibold">Nenhum plano disponível ainda.</p>
          <p className="text-gray-600 mt-2">Quando seu nutricionista publicar um plano, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((mp) => (
            <Link
              key={mp.id}
              to={`/patient/meal-plans/${mp.id}`}
              className="bg-white border border-primary-100 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{mp.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">{mp.description || 'Plano alimentar'}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass[mp.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabel[mp.status] || mp.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span className="capitalize">{mp.category}</span>
                <span className="inline-flex items-center gap-1 text-primary-700 font-semibold">
                  Ver detalhes <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MealPlans


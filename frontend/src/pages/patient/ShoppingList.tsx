import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../services'

interface ShoppingListItem {
  id: string
  name: string
  quantity?: string
  checked: boolean
}

interface ShoppingListResponse {
  id: string
  mealPlanId: string
  items: ShoppingListItem[]
}

const ShoppingList = () => {
  const [data, setData] = useState<ShoppingListResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // MVP: requer que o paciente tenha um mealPlanId; por enquanto usa query param ?mealPlanId=
  useEffect(() => {
    const url = new URL(window.location.href)
    const mealPlanId = url.searchParams.get('mealPlanId')
    const load = async () => {
      setLoading(true)
      if (!mealPlanId) {
        setData(null)
        setLoading(false)
        return
      }
      const res = await api.get<{ data: ShoppingListResponse }>(`/shopping-list/${encodeURIComponent(mealPlanId)}`)
      setData(res.data?.data || null)
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

  if (!data) {
    return (
      <div className="bg-white border border-primary-100 rounded-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900">Lista de compras</h1>
        <p className="text-gray-600 mt-2">Selecione um plano alimentar para gerar a lista.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lista de compras</h1>
        <p className="text-gray-600 mt-1">Itens sugeridos a partir do plano alimentar.</p>
      </div>

      <div className="bg-white border border-primary-100 rounded-xl divide-y divide-primary-100">
        {data.items?.map((it) => (
          <div key={it.id} className="px-5 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className={`font-semibold ${it.checked ? 'text-gray-400 line-through' : 'text-gray-900'} truncate`}>
                {it.name}
              </div>
              {it.quantity && <div className="text-sm text-gray-600">{it.quantity}</div>}
            </div>
            <div className="text-xs text-gray-500">Em breve: marcar como comprado</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShoppingList


import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { api } from '../../services'
import EmptyState from '../../components/common/EmptyState'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

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
  const [error, setError] = useState('')
  const [noPlan, setNoPlan] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const mealPlanId = url.searchParams.get('mealPlanId')
    const load = async () => {
      setLoading(true)
      setError('')
      setNoPlan(false)
      if (!mealPlanId) {
        setData(null)
        setNoPlan(true)
        setLoading(false)
        return
      }
      const res = await api.get<{ data: ShoppingListResponse }>(`/shopping-list/${encodeURIComponent(mealPlanId)}`)
      if (res.error) {
        setError(getFriendlyErrorMessage(res.error, 'Não foi possível carregar a lista de compras.'))
        setData(null)
      } else {
        setData(res.data?.data || null)
      }
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) {
    return <LoadingState message="Carregando lista de compras…" />
  }

  if (noPlan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="app-page-title">Lista de compras</h1>
          <p className="text-gray-600 mt-1">Itens sugeridos a partir do plano alimentar.</p>
        </div>
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title="Nenhum plano selecionado"
          description="Abra um plano alimentar e gere a lista de compras a partir dele."
          action={
            <Link
              to="/patient/meal-plans"
              className="inline-flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800"
            >
              Ver meus planos
            </Link>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="app-page-title">Lista de compras</h1>
        </div>
        <InlineAlert variant="error">{error}</InlineAlert>
      </div>
    )
  }

  if (!data || !data.items?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="app-page-title">Lista de compras</h1>
          <p className="text-gray-600 mt-1">Itens sugeridos a partir do plano alimentar.</p>
        </div>
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title="Lista vazia"
          description="Este plano ainda não possui itens na lista de compras."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Lista de compras</h1>
        <p className="text-gray-600 mt-1">Itens sugeridos a partir do plano alimentar.</p>
      </div>

      <div className="bg-white border border-primary-100 rounded-xl divide-y divide-primary-100">
        {data.items.map((it) => (
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

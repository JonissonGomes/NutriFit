import { useEffect, useState } from 'react'
import { ChefHat } from 'lucide-react'
import { recipeService } from '../../services'
import type { Recipe } from '../../services/recipe.service'
import EmptyState from '../../components/common/EmptyState'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

const Recipes = () => {
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await recipeService.listMine()
    if (res.error) {
      setError(getFriendlyErrorMessage(res.error, 'Não foi possível carregar as receitas.'))
      setItems([])
    } else {
      setItems((res.data as any)?.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return <LoadingState message="Carregando receitas…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Receitas</h1>
        <p className="text-gray-600 mt-1">Receitas públicas e receitas liberadas para você.</p>
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
          icon={<ChefHat className="h-10 w-10" />}
          title="Nenhuma receita disponível"
          description="Receitas liberadas pelo seu nutricionista aparecerão aqui."
        />
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-gray-900">{r.title}</div>
              {r.description ? <div className="text-sm text-gray-600 mt-1">{r.description}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default Recipes

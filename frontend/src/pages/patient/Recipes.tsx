import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { recipeService } from '../../services'
import type { Recipe } from '../../services/recipe.service'

const Recipes = () => {
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await recipeService.listMine()
      setItems((res.data as any)?.data || [])
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[280px]"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Receitas</h1>
        <p className="text-gray-600 mt-1">Receitas públicas e receitas liberadas para você.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-600">
          Nenhuma receita disponível no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-gray-900">{r.title}</div>
              {r.description ? <div className="text-sm text-gray-600 mt-1">{r.description}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Recipes


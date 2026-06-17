import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { mealPlanService } from '../../services'
import type { MealPlan } from '../../types/api'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

const MealPlanPage = () => {
  const { id } = useParams()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    const res = await mealPlanService.get(id)
    const data = (res.data as any)?.data ?? res.data
    if (!data) {
      setError(getFriendlyErrorMessage(res.error, 'Plano não encontrado.'))
      setMealPlan(null)
    } else {
      setMealPlan(data as MealPlan)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  if (loading) {
    return <LoadingState message="Carregando plano alimentar…" />
  }

  if (error) {
    return (
      <div className="space-y-4">
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
      </div>
    )
  }

  if (!mealPlan) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">{mealPlan.title}</h1>
        {mealPlan.description && <p className="text-gray-600 mt-1">{mealPlan.description}</p>}
      </div>

      {mealPlan.totalMacros && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-primary-100 rounded-xl p-4">
            <div className="text-xs text-gray-600">Calorias</div>
            <div className="text-lg font-bold text-gray-900">{Math.round(mealPlan.totalMacros.calories)} kcal</div>
          </div>
          <div className="bg-white border border-primary-100 rounded-xl p-4">
            <div className="text-xs text-gray-600">Proteínas</div>
            <div className="text-lg font-bold text-gray-900">{Math.round(mealPlan.totalMacros.proteins)} g</div>
          </div>
          <div className="bg-white border border-primary-100 rounded-xl p-4">
            <div className="text-xs text-gray-600">Carboidratos</div>
            <div className="text-lg font-bold text-gray-900">{Math.round(mealPlan.totalMacros.carbohydrates)} g</div>
          </div>
          <div className="bg-white border border-primary-100 rounded-xl p-4">
            <div className="text-xs text-gray-600">Gorduras</div>
            <div className="text-lg font-bold text-gray-900">{Math.round(mealPlan.totalMacros.fats)} g</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {mealPlan.meals?.map((meal) => (
          <div key={`${meal.type}-${meal.time}`} className="bg-white border border-primary-100 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 capitalize">{meal.type.replace('-', ' ')}</h3>
              <span className="text-sm text-gray-600">{meal.time}</span>
            </div>

            <div className="mt-4 space-y-2">
              {meal.foods?.map((f) => (
                <div key={`${f.foodId}-${f.name}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-800">{f.name}</span>
                  <span className="text-gray-600 whitespace-nowrap">
                    {f.quantity} {f.unit}
                  </span>
                </div>
              ))}
            </div>

            {meal.notes && <p className="text-sm text-gray-600 mt-3">{meal.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MealPlanPage

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { mealPlanService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import type { MealPlan, MealPlanStatus } from '../../types/api'

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
}

const MealPlanDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const res = await mealPlanService.get(id)
    const data = (res.data as any)?.data ?? res.data
    if (!data) {
      showToast(res.error || 'Plano não encontrado', 'error')
      navigate(-1)
      return
    }
    setMealPlan(data as MealPlan)
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onAnalyze = async () => {
    if (!mealPlan?.id) return
    setAnalyzing(true)
    try {
      const res = await mealPlanService.analyzeWithAI(mealPlan.id)
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      setAiResult((res.data as any)?.data || res.data)
      showToast('Análise gerada com sucesso.', 'success')
    } finally {
      setAnalyzing(false)
    }
  }

  const onChangeStatus = async (nextStatus: MealPlanStatus) => {
    if (!mealPlan?.id) return
    setUpdatingStatus(true)
    try {
      const res = await mealPlanService.updateStatus(mealPlan.id, nextStatus)
      const updated = (res.data as any)?.data ?? res.data
      if (!updated) {
        showToast(res.error || 'Falha ao atualizar status', 'error')
        return
      }
      setMealPlan(updated as MealPlan)
      showToast('Status atualizado.', 'success')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!mealPlan) return null

  return (
    <div className="space-y-6">
      <div>
        <Link to={location.pathname.startsWith('/medico') ? '/medico/meal-plans' : '/nutritionist/meal-plans'} className="inline-flex items-center gap-2 text-primary-700 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Voltar para planos
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3">{mealPlan.title}</h1>
        {mealPlan.description ? <p className="text-gray-600 mt-1">{mealPlan.description}</p> : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-700">
          Status atual: <b>{statusLabel[mealPlan.status] || mealPlan.status}</b>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={mealPlan.status}
            onChange={(e) => void onChangeStatus(e.target.value as MealPlanStatus)}
            disabled={updatingStatus}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
          >
            <option value="draft">Rascunho</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
          </select>
          <button
            type="button"
            onClick={() => void onAnalyze()}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 disabled:opacity-60"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? 'Gerando...' : 'Analisar com Gemini'}
          </button>
        </div>
      </div>

      {mealPlan.totalMacros ? (
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
      ) : null}

      {mealPlan.clinicalSnapshot ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900">Snapshot clínico</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div><b>Paciente:</b> {mealPlan.clinicalSnapshot.patient?.name || '-'}</div>
            <div><b>Objetivo:</b> {mealPlan.clinicalSnapshot.energy?.objective || '-'}</div>
            <div><b>Idade:</b> {mealPlan.clinicalSnapshot.patient?.age ?? '-'}</div>
            <div><b>Sexo:</b> {mealPlan.clinicalSnapshot.patient?.sex || '-'}</div>
            <div><b>Altura:</b> {mealPlan.clinicalSnapshot.patient?.height ?? '-'} cm</div>
            <div><b>Peso:</b> {mealPlan.clinicalSnapshot.patient?.weight ?? '-'} kg</div>
            <div><b>TMB:</b> {mealPlan.clinicalSnapshot.energy?.tmb ?? '-'}</div>
            <div><b>GET:</b> {mealPlan.clinicalSnapshot.energy?.get ?? '-'}</div>
            <div><b>Restrições:</b> {mealPlan.clinicalSnapshot.restrictions?.join(', ') || '-'}</div>
            <div><b>Preferências:</b> {mealPlan.clinicalSnapshot.preferences?.join(', ') || '-'}</div>
          </div>
          {mealPlan.clinicalSnapshot.anamnesisSummary ? (
            <div className="mt-3 text-sm text-gray-700">
              <b>Resumo da anamnese:</b> {mealPlan.clinicalSnapshot.anamnesisSummary}
            </div>
          ) : null}
          {mealPlan.clinicalSnapshot.labExamSummary ? (
            <div className="mt-2 text-sm text-gray-700">
              <b>Resumo de exames:</b> {mealPlan.clinicalSnapshot.labExamSummary}
            </div>
          ) : null}
        </div>
      ) : null}

      {Array.isArray(mealPlan.meals) && mealPlan.meals.length > 0 ? (
        <div className="space-y-4">
          {mealPlan.meals.map((meal) => (
            <div key={`${meal.type}-${meal.time}`} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 capitalize">{meal.type.replace('-', ' ')}</h3>
                <span className="text-sm text-gray-600">{meal.time}</span>
              </div>
              <div className="mt-4 space-y-2">
                {meal.foods?.map((f) => (
                  <div key={`${f.foodId}-${f.name}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-800">{f.name}</span>
                    <span className="text-gray-600 whitespace-nowrap">{f.quantity} {f.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          Este plano ainda não possui refeições. Gere um rascunho com Gemini ou edite posteriormente.
        </div>
      )}

      {aiResult ? (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <div className="text-sm font-semibold text-primary-900">Análise Gemini</div>
          <pre className="mt-2 text-xs text-gray-800 whitespace-pre-wrap">{JSON.stringify(aiResult, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  )
}

export default MealPlanDetail


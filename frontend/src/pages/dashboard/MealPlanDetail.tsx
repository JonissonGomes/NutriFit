import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Info, Loader2, Sparkles } from 'lucide-react'
import { mealPlanService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import type { ClinicalSnapshot, MealPlan, MealPlanStatus } from '../../types/api'

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
  const { user } = useAuth()

  const canEditSnapshot = user?.role === 'nutricionista' || user?.role === 'medico'

  const activityFactorByLevel: Record<string, number> = {
    Sedentário: 1.2,
    'Levemente ativo': 1.375,
    'Moderadamente ativo': 1.55,
    'Muito ativo': 1.725,
    'Extremamente ativo': 1.9,
  }

  const objectiveOptions: Record<string, string> = {
    emagrecimento: 'Emagrecimento',
    'ganho-massa': 'Ganho de massa',
    manutencao: 'Manutenção',
  }

  const sexOptions = ['Feminino', 'Masculino', 'Prefiriu não declarar'] as const

  const [loading, setLoading] = useState(true)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const [editingSnapshot, setEditingSnapshot] = useState(false)
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  const [editAge, setEditAge] = useState('')
  const [editSex, setEditSex] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editWeight, setEditWeight] = useState('')
  const [editObjective, setEditObjective] = useState('emagrecimento')
  const [editActivityLevel, setEditActivityLevel] = useState('Moderadamente ativo')
  const [editTmb, setEditTmb] = useState('')
  const [editGet, setEditGet] = useState('')
  const [editRestrictions, setEditRestrictions] = useState('')
  const [editPreferences, setEditPreferences] = useState('')
  const [editAnamnesisSummary, setEditAnamnesisSummary] = useState('')
  const [editLabExamSummary, setEditLabExamSummary] = useState('')

  const activityFactor = useMemo(() => activityFactorByLevel[editActivityLevel] ?? 1.55, [editActivityLevel])

  const parseList = (value: string) =>
    value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

  const toNumber = (value: string): number | undefined => {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }

  const toInt = (value: string): number | undefined => {
    const n = Number(value)
    return Number.isFinite(n) ? Math.trunc(n) : undefined
  }

  const toFormattedGet = (val: number): string => {
    const rounded = Math.round(val)
    return Math.abs(val - rounded) < 0.0001 ? String(rounded) : String(Math.round(val * 10) / 10)
  }

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

  useEffect(() => {
    if (!editingSnapshot) return
    const tmbNum = toNumber(editTmb)
    if (tmbNum === undefined) {
      setEditGet('')
      return
    }
    setEditGet(toFormattedGet(tmbNum * activityFactor))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTmb, activityFactor, editingSnapshot])

  const openEditSnapshot = () => {
    if (!mealPlan?.clinicalSnapshot) return
    const cs = mealPlan.clinicalSnapshot
    setEditAge(cs.patient?.age !== undefined && cs.patient?.age !== null ? String(cs.patient.age) : '')
    setEditSex(cs.patient?.sex || '')
    setEditHeight(cs.patient?.height !== undefined && cs.patient?.height !== null ? String(cs.patient.height) : '')
    setEditWeight(cs.patient?.weight !== undefined && cs.patient?.weight !== null ? String(cs.patient.weight) : '')
    setEditObjective(cs.energy?.objective || 'emagrecimento')
    setEditActivityLevel(cs.energy?.activityLevel || 'Moderadamente ativo')
    setEditTmb(cs.energy?.tmb !== undefined && cs.energy?.tmb !== null ? String(cs.energy.tmb) : '')
    setEditGet(cs.energy?.get !== undefined && cs.energy?.get !== null ? String(cs.energy.get) : '')
    setEditRestrictions(Array.isArray(cs.restrictions) ? cs.restrictions.join(', ') : '')
    setEditPreferences(Array.isArray(cs.preferences) ? cs.preferences.join(', ') : '')
    setEditAnamnesisSummary(cs.anamnesisSummary || '')
    setEditLabExamSummary(cs.labExamSummary || '')
    setEditingSnapshot(true)
  }

  const onSaveSnapshot = async () => {
    if (!mealPlan?.id) return
    setSavingSnapshot(true)
    try {
      const prev = mealPlan.clinicalSnapshot
      const snapshot: ClinicalSnapshot = {
        patient: {
          name: prev?.patient?.name,
          email: prev?.patient?.email,
          phone: prev?.patient?.phone,
          age: toInt(editAge),
          sex: editSex || undefined,
          height: toNumber(editHeight),
          weight: toNumber(editWeight),
        },
        energy: {
          objective: editObjective || undefined,
          activityLevel: editActivityLevel || undefined,
          activityFactor,
          tmb: toNumber(editTmb),
          get: toNumber(editGet),
        },
        restrictions: parseList(editRestrictions),
        preferences: parseList(editPreferences),
        anamnesisSummary: editAnamnesisSummary || undefined,
        labExamSummary: editLabExamSummary || undefined,
        bmi: mealPlan.clinicalSnapshot?.bmi,
      }

      const res = await mealPlanService.update(mealPlan.id, { clinicalSnapshot: snapshot })
      const updated = (res.data as any)?.data ?? res.data
      if (!updated) {
        showToast(res.error || 'Falha ao salvar snapshot', 'error')
        return
      }
      setMealPlan(updated as MealPlan)
      setEditingSnapshot(false)
      showToast('Snapshot atualizado.', 'success')
    } finally {
      setSavingSnapshot(false)
    }
  }

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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Snapshot clínico</h2>
            {canEditSnapshot && !editingSnapshot ? (
              <button
                type="button"
                onClick={openEditSnapshot}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
              >
                Editar snapshot
              </button>
            ) : null}
            {canEditSnapshot && editingSnapshot ? (
              <button
                type="button"
                onClick={() => setEditingSnapshot(false)}
                disabled={savingSnapshot}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          {!editingSnapshot ? (
            <>
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
            </>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Idade</label>
                  <input value={editAge} onChange={(e) => setEditAge(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Sexo</label>
                  <select value={editSex} onChange={(e) => setEditSex(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                    <option value="">Selecione</option>
                    {sexOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Objetivo</label>
                  <select value={editObjective} onChange={(e) => setEditObjective(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                    {Object.entries(objectiveOptions).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Altura (cm)</label>
                  <input value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Peso (kg)</label>
                  <input value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Nível de atividade</label>
                  <select value={editActivityLevel} onChange={(e) => setEditActivityLevel(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                    {Object.keys(activityFactorByLevel).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">Fator de Atividade</label>
                    <span title="Multiplicador aplicado sobre a TMB para estimar o gasto energético diário.">
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  </div>
                  <input value={String(activityFactor)} disabled className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700" />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">TMB</label>
                    <span title="Taxa metabólica basal: gasto energético em repouso (kcal).">
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input value={editTmb} onChange={(e) => setEditTmb(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 pr-10" inputMode="decimal" placeholder="Ex.: 1500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">kcal</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">GET</label>
                    <span title="GET = TMB × Fator de Atividade (kcal/dia). Campo calculado.">
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input value={editGet} disabled className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 pr-14" placeholder="—" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">kcal/dia</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Restrições (separadas por vírgula)</label>
                <input value={editRestrictions} onChange={(e) => setEditRestrictions(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="lactose, glúten..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Preferências (separadas por vírgula)</label>
                <input value={editPreferences} onChange={(e) => setEditPreferences(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="vegano, vegetariano..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Resumo da anamnese</label>
                <textarea value={editAnamnesisSummary} onChange={(e) => setEditAnamnesisSummary(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="Resumo..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Resumo de exames</label>
                <textarea value={editLabExamSummary} onChange={(e) => setEditLabExamSummary(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="Resumo..." />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void onSaveSnapshot()}
                  disabled={savingSnapshot}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
                >
                  {savingSnapshot ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar snapshot'}
                </button>
              </div>
            </div>
          )}
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


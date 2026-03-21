import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Upload } from 'lucide-react'
import { foodDiaryService, mealPlanService, predefinedMealService } from '../../services'
import type { FoodDiaryEntry, Meal, MealPlan, MealType } from '../../types/api'
import type { PredefinedMeal } from '../../services/predefinedMeal.service'

const mealTypeLabel: Record<MealType, string> = {
  'cafe-manha': 'Café da manhã',
  'lanche-manha': 'Lanche da manhã',
  almoco: 'Almoço',
  'lanche-tarde': 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

const FoodDiary = () => {
  const [items, setItems] = useState<FoodDiaryEntry[]>([])
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [planMeals, setPlanMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newMealType, setNewMealType] = useState<MealType>('almoco')
  const [newTime, setNewTime] = useState<string>(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [newDescription, setNewDescription] = useState('')
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [selectedFoods, setSelectedFoods] = useState<string[]>([])
  const [customFoods, setCustomFoods] = useState('')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogItems, setCatalogItems] = useState<PredefinedMeal[]>([])
  const [selectedCatalogMeals, setSelectedCatalogMeals] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    const [resDiary, resPlans, resCatalog] = await Promise.all([
      foodDiaryService.listByPatient('me', { limit: 50 }),
      mealPlanService.list({ status: 'active', page: 1, limit: 20 }),
      predefinedMealService.list(),
    ])

    setItems(resDiary.data?.data || [])
    const plansPayload = (resPlans.data as any)?.data ?? (resPlans.data as any)
    const plans = Array.isArray(plansPayload) ? plansPayload : Array.isArray(plansPayload?.data) ? plansPayload.data : []
    const active = (plans as MealPlan[])[0] || null
    setActivePlan(active)
    setPlanMeals(Array.isArray(active?.meals) ? active.meals : [])
    setCatalogItems((resCatalog.data as any)?.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, FoodDiaryEntry[]>()
    for (const e of items) {
      const d = new Date(e.date)
      const key = d.toLocaleDateString('pt-BR')
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }))
  }, [items])

  const onCreate = async () => {
    setCreating(true)
    try {
      const now = new Date()
      const [hh, mm] = newTime.split(':').map((x) => parseInt(x, 10))
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0, 0)

      const planFoodsText = selectedFoods.length > 0 ? `Alimentos do plano: ${selectedFoods.join(', ')}` : ''
      const customFoodsText = customFoods.trim() ? `Alimentos adicionais: ${customFoods.trim()}` : ''
      const catalogFoodsText = selectedCatalogMeals.length > 0 ? `Refeições pré-cadastradas: ${selectedCatalogMeals.join(', ')}` : ''
      const notesText = newDescription.trim()
      const composedDescription = [planFoodsText, catalogFoodsText, customFoodsText, notesText].filter(Boolean).join('\n')

      const res = await foodDiaryService.create({
        date: dt.toISOString(),
        mealType: newMealType,
        description: composedDescription || undefined,
      } as any)

      const created = (res.data as any)?.data as FoodDiaryEntry | undefined
      if (created && newPhoto) {
        await foodDiaryService.uploadPhoto(created.id, newPhoto)
      }

      setNewDescription('')
      setNewPhoto(null)
      setSelectedFoods([])
      setCustomFoods('')
      setSelectedCatalogMeals([])
      await load()
    } finally {
      setCreating(false)
    }
  }

  const onUpload = async (entryId: string, file: File) => {
    setUploadingId(entryId)
    await foodDiaryService.uploadPhoto(entryId, file)
    setUploadingId(null)
    await load()
  }

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Diário alimentar</h1>
        <p className="text-gray-600 mt-1">Registre refeições (com horário e foto) e acompanhe feedback do seu nutricionista.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="font-semibold text-gray-900">Novo registro</div>
        {activePlan ? (
          <div className="mt-2 text-sm text-gray-700">
            Plano ativo: <b>{activePlan.title}</b>
          </div>
        ) : (
          <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Nenhum plano ativo encontrado. Você ainda pode registrar o diário manualmente.
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Refeição</label>
            <select
              value={newMealType}
              onChange={(e) => setNewMealType(e.target.value as MealType)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
            >
              {Object.entries(mealTypeLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Horário</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </div>
        </div>

        {planMeals.length > 0 ? (
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-700">Alimentos consumidos (do plano desta refeição)</label>
            <div className="mt-2 border border-gray-200 rounded-xl p-3">
              {(() => {
                const mealRef = planMeals.find((m) => m.type === newMealType)
                const options = mealRef?.foods || []
                if (options.length === 0) {
                  return <div className="text-sm text-gray-500">Não há alimentos definidos para esta refeição no plano.</div>
                }
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {options.map((f, idx) => {
                      const label = `${f.name} (${f.quantity} ${f.unit})`
                      const checked = selectedFoods.includes(label)
                      return (
                        <label key={`${f.foodId}-${idx}`} className="inline-flex items-center gap-2 text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFoods((prev) => [...prev, label])
                              } else {
                                setSelectedFoods((prev) => prev.filter((x) => x !== label))
                              }
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        ) : null}

        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700">Alimentos adicionais (opcional)</label>
          <input
            value={customFoods}
            onChange={(e) => setCustomFoods(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
            placeholder="Ex.: 1 banana, 2 torradas"
          />
        </div>

        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700">Selecionar refeição pré-cadastrada (opcional)</label>
          <input
            value={catalogQuery}
            onChange={async (e) => {
              const q = e.target.value
              setCatalogQuery(q)
              const res = await predefinedMealService.list(q)
              setCatalogItems((res.data as any)?.data || [])
            }}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
            placeholder="Buscar no catálogo (ex.: abacate, açaí...)"
          />
          {catalogItems.length > 0 ? (
            <div className="mt-2 max-h-40 overflow-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {catalogItems.slice(0, 20).map((m) => {
                const label = `${m.name}${m.calories ? ` (${Math.round(m.calories)} kcal)` : ''}`
                const checked = selectedCatalogMeals.includes(label)
                return (
                  <label key={m.id} className="inline-flex items-center gap-2 text-sm text-gray-800 w-full">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(ev) => {
                        if (ev.target.checked) setSelectedCatalogMeals((prev) => [...prev, label])
                        else setSelectedCatalogMeals((prev) => prev.filter((x) => x !== label))
                      }}
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700">Descrição (opcional)</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white min-h-[90px]"
            placeholder="Ex.: arroz, feijão, frango, salada..."
          />
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={() => void onCreate()}
          className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Registrar (check-in)
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-8 text-center">
          <p className="text-gray-700 font-semibold">Nenhum registro ainda.</p>
          <p className="text-gray-600 mt-2">Quando você criar registros, eles aparecem aqui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.date} className="space-y-3">
              <div className="text-sm font-bold text-gray-900">{g.date}</div>
              <div className="space-y-4">
                {g.entries.map((e) => {
                  const timeStr = new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={e.id} className="bg-white border border-primary-100 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-gray-900">
                            {mealTypeLabel[e.mealType]} <span className="text-gray-500 font-semibold">· {timeStr}</span>
                          </div>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 cursor-pointer">
                          <Upload className="h-4 w-4" />
                          {uploadingId === e.id ? 'Enviando...' : 'Enviar foto'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingId === e.id}
                            onChange={(ev) => {
                              const f = ev.target.files?.[0]
                              if (f) void onUpload(e.id, f)
                            }}
                          />
                        </label>
                      </div>

                      {e.photoUrl && (
                        <div className="mt-4">
                          <img src={e.photoUrl} alt="Foto da refeição" className="w-full max-w-md rounded-lg border border-gray-200" />
                        </div>
                      )}

                      {e.description && <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{e.description}</p>}

                      {e.nutritionistComment && (
                        <div className="mt-4 bg-primary-50 border border-primary-100 rounded-lg p-3">
                          <div className="text-xs font-semibold text-primary-800">Comentário do nutricionista</div>
                          <div className="text-sm text-primary-900 mt-1 whitespace-pre-wrap">{e.nutritionistComment}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FoodDiary


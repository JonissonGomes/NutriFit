import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import ConfirmModal from '../../components/common/ConfirmModal'
import { mealPlanService, patientService, recipeService } from '../../services'
import type { Recipe } from '../../services/recipe.service'
import type { Patient } from '../../services/patient.service'
import { useConfirmDelete } from '../../hooks'

type MealPlanOption = { id: string; title: string }

const Recipes = () => {
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [newRecipeImages, setNewRecipeImages] = useState<File[]>([])
  const [patientIds, setPatientIds] = useState<string[]>([])
  const [mealPlanIds, setMealPlanIds] = useState<string[]>([])
  const [enablePatientAccess, setEnablePatientAccess] = useState(false)
  const [enableMealPlanAccess, setEnableMealPlanAccess] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [mealPlanQuery, setMealPlanQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([])
  const deleteFlow = useConfirmDelete<Recipe>()

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => (p.name || '').toLowerCase().includes(q))
  }, [patients, patientQuery])

  const filteredMealPlans = useMemo(() => {
    const q = mealPlanQuery.trim().toLowerCase()
    if (!q) return mealPlans
    return mealPlans.filter((m) => (m.title || '').toLowerCase().includes(q))
  }, [mealPlans, mealPlanQuery])

  const load = async () => {
    setLoading(true)
    const res = await recipeService.listMine()
    setItems((res.data as any)?.data || [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    void (async () => {
      const [pRes, mRes] = await Promise.all([patientService.list(), mealPlanService.list({ page: 1, limit: 200 })])
      setPatients((pRes.data as any)?.data || [])
      const rawMealPlans = ((mRes.data as any)?.data || []) as any[]
      setMealPlans(rawMealPlans.map((m) => ({ id: m.id, title: m.title })))
    })()
  }, [])

  const onCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    const created = await recipeService.create({
      title: title.trim(),
      description: description.trim() || undefined,
      isPublic,
      patientIds: enablePatientAccess ? patientIds : [],
      mealPlanIds: enableMealPlanAccess ? mealPlanIds : [],
    })
    const createdRecipe = (created.data as any)?.data
    if (createdRecipe?.id && newRecipeImages.length > 0) {
      for (const file of newRecipeImages.slice(0, 3)) {
        await recipeService.uploadImage(createdRecipe.id, file)
      }
    }
    setSaving(false)
    setTitle('')
    setDescription('')
    setIsPublic(false)
    setNewRecipeImages([])
    setPatientIds([])
    setMealPlanIds([])
    setEnablePatientAccess(false)
    setEnableMealPlanAccess(false)
    setPatientQuery('')
    setMealPlanQuery('')
    await load()
  }

  const onTogglePublic = async (r: Recipe) => {
    await recipeService.update(r.id, { isPublic: !r.isPublic })
    await load()
  }

  const onDelete = async (r: Recipe) => {
    await recipeService.remove(r.id)
    setItems((prev) => prev.filter((x) => x.id !== r.id))
  }

  const onUploadImage = async (recipeId: string, file: File) => {
    await recipeService.uploadImage(recipeId, file)
    await load()
  }


  if (loading) {
    return <div className="flex items-center justify-center min-h-[280px]"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Receitas</h1>
        <p className="text-gray-600 mt-1">Gerencie receitas e controle visibilidade (pública/privada).</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-gray-900">Nova receita</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="Título da receita" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 min-h-[90px]" placeholder="Descrição (opcional)" />
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Compartilhar publicamente
        </label>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Imagens da receita (até 3)</div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(0, 3)
              setNewRecipeImages(files)
            }}
            className="w-full text-sm"
          />
          {newRecipeImages.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {newRecipeImages.length} imagem(ns) selecionada(s).
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={enablePatientAccess}
              onChange={(e) => {
                const enabled = e.target.checked
                setEnablePatientAccess(enabled)
                if (!enabled) setPatientIds([])
              }}
            />
            Permitir visualização para pacientes específicos
          </label>
          {enablePatientAccess && (
            <>
              <input
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="Buscar paciente por nome..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
              <div className="max-h-32 overflow-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {filteredPatients.map((p) => (
                  <label key={p.id} className="inline-flex items-center gap-2 text-sm text-gray-800 w-full">
                    <input
                      type="checkbox"
                      checked={patientIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setPatientIds((prev) => [...prev, p.id])
                        else setPatientIds((prev) => prev.filter((id) => id !== p.id))
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={enableMealPlanAccess}
              onChange={(e) => {
                const enabled = e.target.checked
                setEnableMealPlanAccess(enabled)
                if (!enabled) setMealPlanIds([])
              }}
            />
            Permitir visualização para planos alimentares específicos
          </label>
          {enableMealPlanAccess && (
            <>
              <input
                value={mealPlanQuery}
                onChange={(e) => setMealPlanQuery(e.target.value)}
                placeholder="Buscar plano alimentar por nome..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
              <div className="max-h-32 overflow-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {filteredMealPlans.map((m) => (
                  <label key={m.id} className="inline-flex items-center gap-2 text-sm text-gray-800 w-full">
                    <input
                      type="checkbox"
                      checked={mealPlanIds.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) setMealPlanIds((prev) => [...prev, m.id])
                        else setMealPlanIds((prev) => prev.filter((id) => id !== m.id))
                      }}
                    />
                    <span>{m.title}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-500">
            Dica: se a receita estiver pública, qualquer usuário pode visualizar.
          </div>
        </div>
        <button type="button" onClick={() => void onCreate()} disabled={saving || !title.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Criar receita'}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-gray-900">{r.title}</div>
              {r.description ? <div className="text-sm text-gray-600 mt-1">{r.description}</div> : null}
              <div className="mt-2">
                <button type="button" onClick={() => void onTogglePublic(r)} className={`text-xs font-semibold px-2 py-1 rounded ${r.isPublic ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                  {r.isPublic ? 'Pública' : 'Privada'}
                </button>
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-700">Imagens ({(r.imageUrls || []).length}/3)</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(r.imageUrls || []).map((url) => (
                    <img key={url} src={url} alt="Receita" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={(r.imageUrls || []).length >= 3}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    void onUploadImage(r.id, file)
                    e.currentTarget.value = ''
                  }}
                  className="mt-2 text-xs"
                />
              </div>
            </div>
            <button type="button" onClick={() => deleteFlow.open(r)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteFlow.isOpen}
        onClose={deleteFlow.close}
        onConfirm={() => void deleteFlow.confirm(onDelete)}
        title="Excluir receita"
        message={`Tem certeza que deseja excluir "${deleteFlow.target?.title || 'receita'}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteFlow.loading}
      />
    </div>
  )
}

export default Recipes


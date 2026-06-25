import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react'
import ConfirmModal from '../../components/common/ConfirmModal'
import FormModal from '../../components/common/FormModal'
import FileDropzone from '../../components/common/FileDropzone'
import SwitchField from '../../components/common/SwitchField'
import { mealPlanService, patientService, recipeService } from '../../services'
import type { Recipe } from '../../services/recipe.service'
import type { Patient } from '../../services/patient.service'
import { useConfirmDelete } from '../../hooks'
import { useToast } from '../../contexts/ToastContext'
import { resolveMediaUrl } from '../../utils/mediaUrl'

type MealPlanOption = { id: string; title: string }

const Recipes = () => {
  const { showToast } = useToast()
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [editImages, setEditImages] = useState<File[]>([])
  const [editPatientIds, setEditPatientIds] = useState<string[]>([])
  const [editMealPlanIds, setEditMealPlanIds] = useState<string[]>([])
  const [editEnablePatientAccess, setEditEnablePatientAccess] = useState(false)
  const [editEnableMealPlanAccess, setEditEnableMealPlanAccess] = useState(false)
  const [editPatientQuery, setEditPatientQuery] = useState('')
  const [editMealPlanQuery, setEditMealPlanQuery] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  const filteredEditPatients = useMemo(() => {
    const q = editPatientQuery.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => (p.name || '').toLowerCase().includes(q))
  }, [patients, editPatientQuery])

  const filteredEditMealPlans = useMemo(() => {
    const q = editMealPlanQuery.trim().toLowerCase()
    if (!q) return mealPlans
    return mealPlans.filter((m) => (m.title || '').toLowerCase().includes(q))
  }, [mealPlans, editMealPlanQuery])

  const resetCreateForm = () => {
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
  }

  const openEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setEditTitle(recipe.title || '')
    setEditDescription(recipe.description || '')
    setEditIsPublic(Boolean(recipe.isPublic))
    setEditImages([])
    const pIds = recipe.patientIds || []
    const mIds = recipe.mealPlanIds || []
    setEditPatientIds(pIds)
    setEditMealPlanIds(mIds)
    setEditEnablePatientAccess(pIds.length > 0)
    setEditEnableMealPlanAccess(mIds.length > 0)
    setEditPatientQuery('')
    setEditMealPlanQuery('')
  }

  const closeEdit = () => {
    setEditingRecipe(null)
    setEditImages([])
  }

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
    if (created.error) {
      showToast(created.error, 'error')
      setSaving(false)
      return
    }
    const createdRecipe = (created.data as any)?.data || (created.data as any)
    if (createdRecipe?.id && newRecipeImages.length > 0) {
      for (const file of newRecipeImages.slice(0, 3)) {
        const up = await recipeService.uploadImage(createdRecipe.id, file)
        if (up.error) {
          showToast(up.error, 'error')
          break
        }
      }
    }
    setSaving(false)
    resetCreateForm()
    setShowCreateModal(false)
    await load()
    showToast('Receita criada com sucesso.', 'success')
  }

  const onSaveEdit = async () => {
    if (!editingRecipe || !editTitle.trim()) return
    setSavingEdit(true)
    try {
      const updated = await recipeService.update(editingRecipe.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        isPublic: editIsPublic,
        patientIds: editEnablePatientAccess ? editPatientIds : [],
        mealPlanIds: editEnableMealPlanAccess ? editMealPlanIds : [],
      })
      if (updated.error) {
        showToast(updated.error, 'error')
        return
      }

      const existingCount = (editingRecipe.imageUrls || []).length
      const slots = Math.max(0, 3 - existingCount)
      for (const file of editImages.slice(0, slots)) {
        const up = await recipeService.uploadImage(editingRecipe.id, file)
        if (up.error) {
          showToast(up.error, 'error')
          break
        }
      }

      showToast('Receita atualizada com sucesso.', 'success')
      closeEdit()
      await load()
    } finally {
      setSavingEdit(false)
    }
  }

  const onTogglePublic = async (r: Recipe) => {
    await recipeService.update(r.id, { isPublic: !r.isPublic })
    await load()
    showToast(r.isPublic ? 'Receita agora é privada.' : 'Receita publicada.', 'success')
  }

  const onDelete = async (r: Recipe) => {
    await recipeService.remove(r.id)
    setItems((prev) => prev.filter((x) => x.id !== r.id))
    showToast('Receita excluída.', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="app-page app-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="app-title">Receitas</h1>
          <p className="app-subtitle mt-1">Crie, organize e controle quem pode ver cada receita.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Criar nova receita
        </button>
      </div>

      {items.length === 0 ? (
        <div className="app-card text-center py-12">
          <p className="text-gray-600">Nenhuma receita cadastrada ainda.</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800"
          >
            <Plus className="h-4 w-4" />
            Criar primeira receita
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((r) => {
            const thumb = resolveMediaUrl(r.imageUrls?.[0])
            const imageCount = (r.imageUrls || []).length

            return (
              <div key={r.id} className="app-card flex flex-col overflow-hidden p-0">
                <div className="relative h-40 bg-gray-100">
                  {thumb ? (
                    <img src={thumb} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Sem imagem
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      r.isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-900/70 text-white'
                    }`}
                  >
                    {r.isPublic ? 'Pública' : 'Privada'}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{r.title}</h3>
                    {r.description ? (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{r.description}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      <ImagePlus className="h-3.5 w-3.5" />
                      {imageCount}/3 fotos
                    </span>
                    {(r.patientIds?.length || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                        <Users className="h-3.5 w-3.5" />
                        {r.patientIds?.length} paciente(s)
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => void onTogglePublic(r)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {r.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {r.isPublic ? 'Tornar privada' : 'Tornar pública'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteFlow.open(r)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetCreateForm()
        }}
        title="Nova receita"
        description="Cadastre uma receita e defina quem pode visualizá-la."
        size="lg"
      >
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300"
            placeholder="Título da receita *"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 min-h-[90px]"
            placeholder="Descrição (opcional)"
          />
          <SwitchField label="Compartilhar publicamente" checked={isPublic} onChange={setIsPublic} />

          <FileDropzone
            files={newRecipeImages}
            onChange={(files) => setNewRecipeImages(files.slice(0, 3))}
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            maxFiles={3}
            maxSizeMB={10}
            icon="image"
            acceptedFormatsLabel="JPG, PNG, GIF, WebP"
            hint="Fotos ajudam o paciente a visualizar o prato"
          />

          <div className="rounded-lg border border-gray-200 p-3 space-y-2">
            <SwitchField
              label="Permitir visualização para pacientes específicos"
              checked={enablePatientAccess}
              onChange={(enabled) => {
                setEnablePatientAccess(enabled)
                if (!enabled) setPatientIds([])
              }}
            />
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
            <SwitchField
              label="Vincular a planos alimentares específicos"
              checked={enableMealPlanAccess}
              onChange={(enabled) => {
                setEnableMealPlanAccess(enabled)
                if (!enabled) setMealPlanIds([])
              }}
            />
            {enableMealPlanAccess && (
              <>
                <input
                  value={mealPlanQuery}
                  onChange={(e) => setMealPlanQuery(e.target.value)}
                  placeholder="Buscar plano alimentar..."
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

          <button
            type="button"
            onClick={() => void onCreate()}
            disabled={saving || !title.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Criar receita'}
          </button>
        </div>
      </FormModal>

      <FormModal
        isOpen={Boolean(editingRecipe)}
        onClose={closeEdit}
        title="Editar receita"
        description="Atualize os dados, permissões e fotos da receita."
        size="lg"
      >
        {editingRecipe ? (
          <div className="space-y-4">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
              placeholder="Título da receita *"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 min-h-[90px]"
              placeholder="Descrição (opcional)"
            />
            <SwitchField label="Compartilhar publicamente" checked={editIsPublic} onChange={setEditIsPublic} />

            {(editingRecipe.imageUrls || []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Fotos atuais</p>
                <div className="grid grid-cols-3 gap-2">
                  {(editingRecipe.imageUrls || []).map((url, idx) => {
                    const resolved = resolveMediaUrl(url)
                    return resolved ? (
                      <img
                        key={`${url}-${idx}`}
                        src={resolved}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                    ) : null
                  })}
                </div>
              </div>
            )}

            {(editingRecipe.imageUrls || []).length < 3 && (
              <FileDropzone
                files={editImages}
                onChange={(files) => {
                  const slots = 3 - (editingRecipe.imageUrls || []).length
                  setEditImages(files.slice(0, slots))
                }}
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                maxFiles={3 - (editingRecipe.imageUrls || []).length}
                maxSizeMB={10}
                icon="image"
                acceptedFormatsLabel="JPG, PNG, GIF, WebP"
                hint={`Você pode adicionar mais ${3 - (editingRecipe.imageUrls || []).length} foto(s)`}
              />
            )}

            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <SwitchField
                label="Permitir visualização para pacientes específicos"
                checked={editEnablePatientAccess}
                onChange={(enabled) => {
                  setEditEnablePatientAccess(enabled)
                  if (!enabled) setEditPatientIds([])
                }}
              />
              {editEnablePatientAccess && (
                <>
                  <input
                    value={editPatientQuery}
                    onChange={(e) => setEditPatientQuery(e.target.value)}
                    placeholder="Buscar paciente por nome..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                  <div className="max-h-32 overflow-auto border border-gray-200 rounded-lg p-2 space-y-1">
                    {filteredEditPatients.map((p) => (
                      <label key={p.id} className="inline-flex items-center gap-2 text-sm text-gray-800 w-full">
                        <input
                          type="checkbox"
                          checked={editPatientIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setEditPatientIds((prev) => [...prev, p.id])
                            else setEditPatientIds((prev) => prev.filter((id) => id !== p.id))
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
              <SwitchField
                label="Vincular a planos alimentares específicos"
                checked={editEnableMealPlanAccess}
                onChange={(enabled) => {
                  setEditEnableMealPlanAccess(enabled)
                  if (!enabled) setEditMealPlanIds([])
                }}
              />
              {editEnableMealPlanAccess && (
                <>
                  <input
                    value={editMealPlanQuery}
                    onChange={(e) => setEditMealPlanQuery(e.target.value)}
                    placeholder="Buscar plano alimentar..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                  <div className="max-h-32 overflow-auto border border-gray-200 rounded-lg p-2 space-y-1">
                    {filteredEditMealPlans.map((m) => (
                      <label key={m.id} className="inline-flex items-center gap-2 text-sm text-gray-800 w-full">
                        <input
                          type="checkbox"
                          checked={editMealPlanIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) setEditMealPlanIds((prev) => [...prev, m.id])
                            else setEditMealPlanIds((prev) => prev.filter((id) => id !== m.id))
                          }}
                        />
                        <span>{m.title}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => void onSaveEdit()}
              disabled={savingEdit || !editTitle.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60"
            >
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {savingEdit ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        ) : null}
      </FormModal>

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

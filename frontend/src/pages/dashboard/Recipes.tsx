import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import ConfirmModal from '../../components/common/ConfirmModal'
import { recipeService } from '../../services'
import type { Recipe } from '../../services/recipe.service'
import { useConfirmDelete } from '../../hooks'

const Recipes = () => {
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const deleteFlow = useConfirmDelete<Recipe>()

  const load = async () => {
    setLoading(true)
    const res = await recipeService.listMine()
    setItems((res.data as any)?.data || [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const onCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    await recipeService.create({ title: title.trim(), description: description.trim() || undefined, isPublic })
    setSaving(false)
    setTitle('')
    setDescription('')
    setIsPublic(false)
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


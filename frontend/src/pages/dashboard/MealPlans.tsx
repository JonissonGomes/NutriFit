import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { mealPlanService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { sanitizeInput, limitLength } from '../../utils/inputUtils'
import ConfirmModal from '../../components/common/ConfirmModal'
import type { MealPlan } from '../../types/api'

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
}

const statusClass: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-primary-100 text-primary-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-accent-100 text-accent-900',
}

const MealPlans = () => {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [items, setItems] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MealPlan | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isDoctor = user?.role === 'medico'
  const basePath = isDoctor ? '/medico' : '/nutritionist'

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter((mp) => (mp.title || '').toLowerCase().includes(s))
  }, [items, search])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await mealPlanService.list({ page: 1, limit: 50 })
      const payload = (res.data as any)?.data ?? (res.data as any)
      const arr = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setItems(arr)
      if (res.error) showToast(res.error, 'error')
      setLoading(false)
    }
    load()
  }, [showToast])

  const onDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      const res = await mealPlanService.remove(deleteTarget.id)
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      setItems((prev) => prev.filter((mp) => mp.id !== deleteTarget.id))
      showToast('Plano removido com sucesso.', 'success')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Planos alimentares</h1>
          <p className="text-gray-600 mt-1">Gerencie e publique planos para seus pacientes.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(limitLength(sanitizeInput(e.target.value), 80))}
              placeholder="Buscar por título"
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Link
            to={`${basePath}/meal-plans/new`}
            aria-disabled={isDoctor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            onClick={(e) => {
              if (!isDoctor) return
              e.preventDefault()
              showToast('Médicos não podem criar prescrição alimentar estruturada no sistema.', 'warning')
            }}
          >
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-900 font-semibold">Nenhum plano encontrado.</p>
          <p className="text-gray-600 mt-2">Crie seu primeiro plano alimentar para começar.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="col-span-4">Título</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Atualizado</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {filtered.map((mp) => {
            const updatedAt = mp.updatedAt ? new Date(mp.updatedAt).toLocaleDateString('pt-BR') : '-'
            return (
              <div
                key={mp.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60"
              >
                <div className="md:col-span-4 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{mp.title}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{mp.description || 'Plano alimentar'}</div>
                </div>

                <div className="md:col-span-2 text-sm text-gray-700 capitalize flex items-center">{mp.category}</div>

                <div className="md:col-span-2 flex items-center">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      statusClass[mp.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusLabel[mp.status] || mp.status}
                  </span>
                </div>

                <div className="md:col-span-2 text-sm text-gray-600 flex items-center">{updatedAt}</div>

                <div className="md:col-span-2 flex items-center md:justify-end gap-2">
                  <Link
                    to={`${basePath}/meal-plans/${mp.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(mp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Deletar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (deleting) return
          setDeleteTarget(null)
        }}
        onConfirm={() => void onDelete()}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja deletar o plano "${deleteTarget?.title || ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, deletar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default MealPlans


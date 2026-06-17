import { useEffect, useState } from 'react'
import { Search, Stethoscope, MoreVertical, Trash2 } from 'lucide-react'
import { adminService } from '../../services'
import type { AdminNutritionistRow } from '../../services/admin.service'
import EmptyState from '../../components/common/EmptyState'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

const NutritionistsAdmin = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<AdminNutritionistRow[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminNutritionistRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await adminService.listNutritionists({ page: 1, limit: 50, search: search.trim() || undefined })
    if (res.error) {
      setError(getFriendlyErrorMessage(res.error, 'Não foi possível carregar nutricionistas.'))
      setItems([])
      setTotal(0)
    } else {
      setItems(res.data?.data || [])
      setTotal(res.data?.total || 0)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    const res = await adminService.deleteUser(confirmDelete.id)
    setDeletingId(null)
    setConfirmDelete(null)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }
    showToast(res.data?.message ?? 'Nutricionista excluído', 'success')
    void load()
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="app-page-title">Nutricionistas</h1>
          <p className="text-gray-600 mt-1">Controle dos nutricionistas cadastrados (super_admin).</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
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

      {loading ? (
        <LoadingState message="Carregando nutricionistas…" />
      ) : items.length === 0 && !error ? (
        <EmptyState
          icon={<Stethoscope className="h-10 w-10" />}
          title="Nenhum nutricionista encontrado"
          description={search.trim() ? 'Tente outro termo de busca.' : 'Ainda não há nutricionistas cadastrados.'}
        />
      ) : items.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">
            {total} nutricionista(s)
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
            {items.map((u) => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">{u.name}</div>
                  <div className="text-sm text-gray-600 truncate">{u.email}</div>
                </div>
                <div className="text-sm font-semibold text-primary-700 shrink-0">{u.plan}</div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    aria-label="Ações"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {menuOpenId === u.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDelete(u)
                            setMenuOpenId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir permanentemente
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir nutricionista permanentemente?"
        message={
          confirmDelete
            ? `Esta ação não pode ser desfeita. "${confirmDelete.name}" e todos os vínculos (pacientes, planos, perfil público, etc.) serão removidos.`
            : ''
        }
        confirmText="Excluir permanentemente"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        loading={deletingId === confirmDelete?.id}
        variant="danger"
      />
    </div>
  )
}

export default NutritionistsAdmin

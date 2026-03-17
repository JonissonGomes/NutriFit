import { useEffect, useState } from 'react'
import { Loader2, Search, MoreVertical, UserCheck, UserX } from 'lucide-react'
import { adminService } from '../../services'
import type { AdminUserRow, AdminUsersParams } from '../../services/admin.service'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'

const PLANS = ['free', 'starter', 'professional', 'business'] as const
const ROLES = ['nutricionista', 'paciente', 'super_admin', 'admin'] as const
const STATUSES = ['active', 'suspended'] as const

const UsersAdmin = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('')
  const [plan, setPlan] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<{ userId: string; status: 'active' | 'suspended' } | null>(null)
  const [confirmPlan, setConfirmPlan] = useState<{ userId: string; plan: string } | null>(null)

  const load = async () => {
    setLoading(true)
    const params: AdminUsersParams = { page, limit }
    if (search.trim()) params.search = search.trim()
    if (role) params.role = role
    if (plan) params.plan = plan
    if (status) params.status = status
    const res = await adminService.listUsers(params)
    const data = res.data as { data?: AdminUserRow[]; total?: number }
    setUsers(data?.data ?? [])
    setTotal(data?.total ?? 0)
    if (res.error) showToast(res.error, 'error')
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [page, limit, role, plan, status])

  useEffect(() => {
    const t = setTimeout(() => {
      if (page === 1) void load()
      else setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleUpdateStatus = async () => {
    if (!confirmStatus) return
    setUpdatingId(confirmStatus.userId)
    const res = await adminService.updateUserStatus(confirmStatus.userId, confirmStatus.status)
    setUpdatingId(null)
    setConfirmStatus(null)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }
    showToast(res.data?.message ?? 'Status atualizado', 'success')
    void load()
  }

  const handleUpdatePlan = async () => {
    if (!confirmPlan) return
    setUpdatingId(confirmPlan.userId)
    const res = await adminService.updateUserPlan(confirmPlan.userId, confirmPlan.plan)
    setUpdatingId(null)
    setConfirmPlan(null)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }
    showToast(res.data?.message ?? 'Plano atualizado', 'success')
    void load()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-600">Liste, filtre e gerencie usuários da plataforma.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4 flex-wrap">
        <div className="relative flex-1 min-w-0 md:max-w-sm">
          <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Todos os perfis</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1) }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Todos os planos</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'active' ? 'Ativo' : 'Suspenso'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900 flex items-center justify-between">
              <span>{total} usuário(s)</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded border border-gray-200 disabled:opacity-50 text-sm"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2 py-1 rounded border border-gray-200 disabled:opacity-50 text-sm"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-sm text-gray-600">
                    <th className="px-5 py-3 font-semibold">Nome</th>
                    <th className="px-5 py-3 font-semibold">E-mail</th>
                    <th className="px-5 py-3 font-semibold">Perfil</th>
                    <th className="px-5 py-3 font-semibold">Plano</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold w-12" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-[180px]">{u.name}</td>
                      <td className="px-5 py-3 text-gray-700 truncate max-w-[200px]">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{u.plan}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            u.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-primary-100 text-primary-800'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 relative">
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
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
                            <div className="absolute right-2 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmPlan({ userId: u.id, plan: u.plan })
                                  setMenuOpenId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Alterar plano
                              </button>
                              {u.status === 'suspended' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmStatus({ userId: u.id, status: 'active' })
                                    setMenuOpenId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                  Ativar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmStatus({ userId: u.id, status: 'suspended' })
                                    setMenuOpenId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <UserX className="h-4 w-4" />
                                  Suspender
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="px-5 py-12 text-center text-gray-500">
                Nenhum usuário encontrado com os filtros informados.
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!confirmStatus}
        title={confirmStatus?.status === 'suspended' ? 'Suspender usuário?' : 'Ativar usuário?'}
        message={
          confirmStatus?.status === 'suspended'
            ? 'O usuário não poderá fazer login até ser reativado.'
            : 'O usuário voltará a ter acesso à plataforma.'
        }
        confirmText={confirmStatus?.status === 'suspended' ? 'Suspender' : 'Ativar'}
        cancelText="Cancelar"
        onConfirm={handleUpdateStatus}
        onClose={() => setConfirmStatus(null)}
        loading={updatingId === confirmStatus?.userId}
        variant={confirmStatus?.status === 'suspended' ? 'danger' : 'info'}
      />

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-3">Alterar plano</h3>
            <select
              value={confirmPlan.plan}
              onChange={(e) => setConfirmPlan((p) => p ? { ...p, plan: e.target.value } : null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmPlan(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                disabled={!!updatingId}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold disabled:opacity-50"
              >
                {updatingId ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersAdmin

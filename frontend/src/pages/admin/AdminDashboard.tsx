import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Stethoscope, User, ArrowRight } from 'lucide-react'
import { adminService } from '../../services'
import InlineAlert from '../../components/common/InlineAlert'
import LoadingState from '../../components/common/LoadingState'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ totalUsers: number; totalNutritionists: number; totalPatients: number } | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await adminService.overview()
    if (res.error) {
      setError(getFriendlyErrorMessage(res.error, 'Não foi possível carregar a visão geral.'))
      setData(null)
    } else {
      setData(res.data?.data || null)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return <LoadingState message="Carregando painel admin…" />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="app-page-title">Admin</h1>
        <p className="app-page-subtitle mt-1">Visão geral da plataforma.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <Users className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Usuários</div>
                <div className="text-xl font-bold text-gray-900">{data?.totalUsers ?? 0}</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-50">
              <Stethoscope className="h-5 w-5 text-accent-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Nutricionistas</div>
              <div className="text-xl font-bold text-gray-900">{data?.totalNutritionists ?? 0}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <User className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Pacientes</div>
              <div className="text-xl font-bold text-gray-900">{data?.totalPatients ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

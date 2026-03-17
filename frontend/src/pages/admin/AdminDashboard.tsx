import { useEffect, useState } from 'react'
import { Loader2, Users, Stethoscope, User } from 'lucide-react'
import { adminService } from '../../services'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ totalUsers: number; totalNutritionists: number; totalPatients: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await adminService.overview()
      setData(res.data?.data || null)
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-600 mt-1">Visão geral da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <Users className="h-5 w-5 text-primary-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Usuários</div>
              <div className="text-xl font-bold text-gray-900">{data?.totalUsers ?? 0}</div>
            </div>
          </div>
        </div>
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
            <div className="p-2 rounded-lg bg-gray-100">
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


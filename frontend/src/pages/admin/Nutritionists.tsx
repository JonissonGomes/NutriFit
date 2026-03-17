import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { adminService } from '../../services'

const NutritionistsAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  const load = async () => {
    setLoading(true)
    const res = await adminService.listNutritionists({ page: 1, limit: 50, search: search.trim() || undefined })
    setItems(res.data?.data || [])
    setTotal(res.data?.total || 0)
    setLoading(false)
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Nutricionistas</h1>
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

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">
            {total} nutricionista(s)
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((u) => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{u.name}</div>
                  <div className="text-sm text-gray-600 truncate">{u.email}</div>
                </div>
                <div className="text-sm font-semibold text-primary-700">{u.plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NutritionistsAdmin


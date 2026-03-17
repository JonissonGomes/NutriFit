import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../services'

interface AnthropometricRecord {
  id: string
  date: string
  weight: number
  height: number
  bodyFat?: number
  muscleMass?: number
  bmi?: number
}

const Progress = () => {
  const [items, setItems] = useState<AnthropometricRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await api.get<{ data: AnthropometricRecord[] }>(`/anthropometric/me?limit=50`)
      setItems(res.data?.data || [])
      setLoading(false)
    }
    load()
  }, [])

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Evolução</h1>
        <p className="text-gray-600 mt-1">Histórico de peso e indicadores cadastrados.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-8 text-center">
          <p className="text-gray-700 font-semibold">Nenhum registro de evolução ainda.</p>
        </div>
      ) : (
        <div className="bg-white border border-primary-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-primary-100 font-semibold text-gray-900">
            Registros recentes
          </div>
          <div className="divide-y divide-primary-100">
            {items.map((r) => (
              <div key={r.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-gray-600">
                  {new Date(r.date).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="font-semibold text-gray-900">Peso: {r.weight} kg</span>
                  <span className="text-gray-700">IMC: {r.bmi?.toFixed(1) ?? '-'}</span>
                  <span className="text-gray-700">%G: {r.bodyFat ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress


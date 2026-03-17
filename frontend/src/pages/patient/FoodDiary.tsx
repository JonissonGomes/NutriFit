import { useEffect, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { foodDiaryService } from '../../services'
import type { FoodDiaryEntry, MealType } from '../../types/api'

const mealTypeLabel: Record<MealType, string> = {
  'cafe-manha': 'Café da manhã',
  'lanche-manha': 'Lanche da manhã',
  almoco: 'Almoço',
  'lanche-tarde': 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

const FoodDiary = () => {
  const [items, setItems] = useState<FoodDiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await foodDiaryService.listByPatient('me', { limit: 50 })
    setItems(res.data?.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const onUpload = async (entryId: string, file: File) => {
    setUploadingId(entryId)
    await foodDiaryService.uploadPhoto(entryId, file)
    setUploadingId(null)
    await load()
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Diário alimentar</h1>
        <p className="text-gray-600 mt-1">Registre refeições e acompanhe feedback do seu nutricionista.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-8 text-center">
          <p className="text-gray-700 font-semibold">Nenhum registro ainda.</p>
          <p className="text-gray-600 mt-2">Quando você criar registros, eles aparecem aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((e) => (
            <div key={e.id} className="bg-white border border-primary-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-gray-900">{mealTypeLabel[e.mealType]}</div>
                  <div className="text-sm text-gray-600">{new Date(e.date).toLocaleDateString('pt-BR')}</div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploadingId === e.id ? 'Enviando...' : 'Enviar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingId === e.id}
                    onChange={(ev) => {
                      const f = ev.target.files?.[0]
                      if (f) void onUpload(e.id, f)
                    }}
                  />
                </label>
              </div>

              {e.photoUrl && (
                <div className="mt-4">
                  <img src={e.photoUrl} alt="Foto da refeição" className="w-full max-w-md rounded-lg border border-gray-200" />
                </div>
              )}

              {e.description && <p className="text-sm text-gray-700 mt-3">{e.description}</p>}

              {e.nutritionistComment && (
                <div className="mt-4 bg-primary-50 border border-primary-100 rounded-lg p-3">
                  <div className="text-xs font-semibold text-primary-800">Comentário do nutricionista</div>
                  <div className="text-sm text-primary-900 mt-1">{e.nutritionistComment}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FoodDiary


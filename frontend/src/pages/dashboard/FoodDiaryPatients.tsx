import { useEffect, useMemo, useState } from 'react'
import { Calendar, Loader2, Sparkles, Send } from 'lucide-react'
import { foodDiaryService, patientService } from '../../services'
import type { FoodDiaryEntry } from '../../types/api'

const mealTypeLabel: Record<string, string> = {
  'cafe-manha': 'Café da manhã',
  'lanche-manha': 'Lanche da manhã',
  almoco: 'Almoço',
  'lanche-tarde': 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

const FoodDiaryPatients = () => {
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<any[]>([])
  const [patientId, setPatientId] = useState<string>('')
  const [items, setItems] = useState<FoodDiaryEntry[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [comment, setComment] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId])

  const loadPatients = async () => {
    const res = await patientService.list()
    const list = (res.data as any)?.data || []
    setPatients(list)
    if (!patientId && list.length > 0) setPatientId(list[0].id)
  }

  const loadEntries = async (pid: string) => {
    const res = await foodDiaryService.listByPatient(pid, { limit: 100, startDate: startDate || undefined, endDate: endDate || undefined })
    setItems(res.data?.data || [])
  }

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      await loadPatients()
      setLoading(false)
    }
    void boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!patientId) return
    void loadEntries(patientId)
  }, [patientId, startDate, endDate])

  const grouped = useMemo(() => {
    const map = new Map<string, FoodDiaryEntry[]>()
    for (const e of items) {
      const d = new Date(e.date)
      const key = d.toLocaleDateString('pt-BR')
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }))
  }, [items])

  const saveComment = async (entryId: string) => {
    setSavingId(entryId)
    await foodDiaryService.addNutritionistComment(entryId, comment[entryId] || '')
    setSavingId(null)
    if (patientId) await loadEntries(patientId)
  }

  const analyze = async (entryId: string) => {
    setAnalyzingId(entryId)
    await foodDiaryService.analyzePhoto(entryId)
    setAnalyzingId(null)
    if (patientId) await loadEntries(patientId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Diário alimentar</h1>
          <p className="text-gray-600 mt-1">Acompanhe registros, comente e rode análise por IA da foto.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm outline-none"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {selectedPatient && (
        <div className="text-sm text-gray-600">
          Paciente selecionado: <b className="text-gray-900">{selectedPatient.name}</b>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-10 text-center">
          <p className="text-gray-700 font-semibold">Nenhum registro no diário.</p>
          <p className="text-gray-600 mt-2">Quando o paciente registrar refeições, aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.date} className="space-y-3">
              <div className="text-sm font-bold text-gray-900">{g.date}</div>
              <div className="space-y-4">
                {g.entries.map((e) => {
                  const timeStr = new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={e.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500">
                            {mealTypeLabel[e.mealType] || e.mealType} · {timeStr}
                          </div>
                          {e.description && <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{e.description}</div>}
                        </div>

                        <button
                          onClick={() => void analyze(e.id)}
                          disabled={analyzingId === e.id || !e.photoUrl}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-60 text-sm font-semibold"
                          title={!e.photoUrl ? 'Envie uma foto para analisar' : undefined}
                        >
                          <Sparkles className="h-4 w-4" />
                          {analyzingId === e.id ? 'Analisando...' : 'Analisar IA'}
                        </button>
                      </div>

                      {e.photoUrl && (
                        <div className="mt-4">
                          <img src={e.photoUrl} alt="Foto" className="w-full max-w-md rounded-lg border border-gray-200" />
                        </div>
                      )}

                      {e.aiAnalysis?.notes && (
                        <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-4">
                          <div className="text-xs font-semibold text-primary-800">Análise (IA)</div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap mt-2">{e.aiAnalysis.notes}</div>
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-800">Comentário do nutricionista</div>
                        <div className="flex gap-2 mt-2">
                          <input
                            value={comment[e.id] ?? e.nutritionistComment ?? ''}
                            onChange={(ev) => setComment((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                            placeholder="Escreva um feedback..."
                          />
                          <button
                            onClick={() => void saveComment(e.id)}
                            disabled={savingId === e.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 text-sm font-semibold"
                          >
                            <Send className="h-4 w-4" />
                            {savingId === e.id ? 'Salvando...' : 'Enviar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FoodDiaryPatients


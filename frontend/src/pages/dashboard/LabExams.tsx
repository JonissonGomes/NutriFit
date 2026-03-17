import { useEffect, useMemo, useState } from 'react'
import { Loader2, Upload, Sparkles, Trash2, Plus } from 'lucide-react'
import { labExamService, patientService } from '../../services'
import type { LabExam, LabExamType } from '../../services/labExam.service'

const typeLabel: Record<LabExamType, string> = {
  blood: 'Sangue',
  urine: 'Urina',
  stool: 'Fezes',
  hormonal: 'Hormonal',
  vitamin: 'Vitaminas',
  other: 'Outro',
}

const LabExams = () => {
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<any[]>([])
  const [patientId, setPatientId] = useState<string>('')
  const [items, setItems] = useState<LabExam[]>([])
  const [creating, setCreating] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId])

  const loadPatients = async () => {
    const res = await patientService.list()
    const list = (res.data as any)?.data || []
    setPatients(list)
    if (!patientId && list.length > 0) setPatientId(list[0].id)
  }

  const loadExams = async (pid: string) => {
    const res = await labExamService.listByPatient(pid, 50)
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
    void loadExams(patientId)
  }, [patientId])

  const createExam = async () => {
    if (!patientId) return
    setCreating(true)
    const today = new Date().toISOString().slice(0, 10)
    const res = await labExamService.create({
      patientId,
      date: today,
      type: 'blood',
      notes: '',
      rawText: '',
    })
    if (res.data?.data) {
      await loadExams(patientId)
    }
    setCreating(false)
  }

  const upload = async (id: string, file: File) => {
    setUploadingId(id)
    await labExamService.uploadFile(id, file)
    setUploadingId(null)
    if (patientId) await loadExams(patientId)
  }

  const analyze = async (id: string) => {
    setAnalyzingId(id)
    await labExamService.analyzeWithAI(id)
    setAnalyzingId(null)
    if (patientId) await loadExams(patientId)
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    await labExamService.remove(id)
    setDeletingId(null)
    if (patientId) await loadExams(patientId)
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Exames laboratoriais</h1>
          <p className="text-gray-600 mt-1">Upload do exame + análise por IA (quando houver `rawText`).</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
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

          <button
            onClick={() => void createExam()}
            disabled={!patientId || creating}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Criando...' : 'Novo exame'}
          </button>
        </div>
      </div>

      {selectedPatient && (
        <div className="text-sm text-gray-600">
          Paciente selecionado: <b className="text-gray-900">{selectedPatient.name}</b>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-10 text-center">
          <p className="text-gray-700 font-semibold">Nenhum exame cadastrado.</p>
          <p className="text-gray-600 mt-2">Crie um exame e faça o upload do arquivo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((ex) => (
            <div key={ex.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-primary-50 text-primary-800">
                      {typeLabel[ex.type]}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(ex.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="font-bold text-gray-900 mt-2">Exame #{ex.id.slice(0, 8)}</div>
                  {ex.notes && <div className="text-sm text-gray-600 mt-1">{ex.notes}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm font-semibold text-gray-800">
                    <Upload className="h-4 w-4" />
                    {uploadingId === ex.id ? 'Enviando...' : 'Upload'}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingId === ex.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void upload(ex.id, f)
                      }}
                    />
                  </label>

                  <button
                    onClick={() => void analyze(ex.id)}
                    disabled={analyzingId === ex.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-60 text-sm font-semibold"
                  >
                    <Sparkles className="h-4 w-4" />
                    {analyzingId === ex.id ? 'Analisando...' : 'Analisar IA'}
                  </button>

                  <button
                    onClick={() => void remove(ex.id)}
                    disabled={deletingId === ex.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 text-sm font-semibold"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === ex.id ? 'Removendo...' : 'Excluir'}
                  </button>
                </div>
              </div>

              {ex.fileUrl && (
                <div className="mt-4 text-sm">
                  <a className="text-primary-700 font-semibold hover:underline" href={ex.fileUrl} target="_blank" rel="noreferrer">
                    Abrir arquivo do exame
                  </a>
                </div>
              )}

              {ex.aiAnalysis?.summary && (
                <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-primary-800">Resumo (IA)</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap mt-2">{ex.aiAnalysis.summary}</div>
                </div>
              )}

              {!ex.rawText && (
                <div className="mt-4 text-xs text-gray-500">
                  Observação: a análise por IA usa `rawText`. Você pode preencher via edição (PUT) ou implementar extração OCR/PDF depois.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LabExams


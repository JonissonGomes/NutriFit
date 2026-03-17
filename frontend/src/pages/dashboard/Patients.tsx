import { useEffect, useMemo, useState } from 'react'
import { Loader2, Upload, Users } from 'lucide-react'
import { patientService } from '../../services'

const Patients = () => {
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await patientService.list()
    setPatients((res.data as any)?.data || [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const hasErrors = useMemo(() => (importResult?.errors?.length || 0) > 0, [importResult])

  const onImport = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    const res = await patientService.importCSV(file)
    if (res.data) {
      setImportResult({
        created: (res.data as any).created ?? 0,
        skipped: (res.data as any).skipped ?? 0,
        errors: (res.data as any).errors ?? [],
      })
      await load()
    } else {
      setImportResult({ created: 0, skipped: 0, errors: [res.error || 'Falha ao importar'] })
    }
    setImporting(false)
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 mt-1">Liste, organize e importe pacientes via CSV.</p>
        </div>

        <label className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 cursor-pointer disabled:opacity-60">
          <Upload className="h-4 w-4" />
          {importing ? 'Importando...' : 'Importar CSV'}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onImport(f)
            }}
          />
        </label>
      </div>

      {importResult && (
        <div className={`border rounded-xl p-4 ${hasErrors ? 'border-yellow-200 bg-yellow-50' : 'border-primary-100 bg-primary-50'}`}>
          <div className="font-semibold text-gray-900">Resultado da importação</div>
          <div className="text-sm text-gray-700 mt-1">
            Criados: <b>{importResult.created}</b> · Ignorados: <b>{importResult.skipped}</b> · Erros: <b>{importResult.errors.length}</b>
          </div>
          {hasErrors && (
            <ul className="mt-3 text-sm text-gray-800 list-disc pl-5 space-y-1">
              {importResult.errors.slice(0, 10).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {patients.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-10 text-center">
          <Users className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">Nenhum paciente ainda.</p>
          <p className="text-gray-600 mt-2">Você pode cadastrar manualmente ou importar via CSV.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">
            {patients.length} paciente(s)
          </div>
          <div className="divide-y divide-gray-100">
            {patients.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-sm text-gray-600 truncate">
                    {p.email || 'Sem email'} · {p.phone || 'Sem telefone'}
                  </div>
                </div>
                <div className="text-xs text-gray-500">ID: {p.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients


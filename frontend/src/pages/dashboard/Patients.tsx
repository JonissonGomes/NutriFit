import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageCircle, Search, Upload, UserPlus, Users } from 'lucide-react'
import { messageService, patientService } from '../../services'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useConfirmDelete } from '../../hooks'

const Patients = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)

  const [creating, setCreating] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const deleteFlow = useConfirmDelete<{ id: string; name: string }>()

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchError, setSearchError] = useState('')
  const searchTimeoutRef = useRef<number | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await patientService.list()
    setPatients((res.data as any)?.data || [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const q = searchQuery.trim()
    setSearchError('')
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    if (q.length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    searchTimeoutRef.current = window.setTimeout(async () => {
      const res = await patientService.searchPlatform(q, 10)
      if (res.error) {
        setSearchError(res.error)
        setSearchResults([])
      } else {
        setSearchResults((res.data as any)?.data || [])
      }
      setSearching(false)
    }, 350)
  }, [searchQuery])

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

  const onCreateManual = async () => {
    const name = createName.trim()
    const email = createEmail.trim()
    const phone = createPhone.trim()
    if (!name) return
    setCreating(true)
    try {
      const res = await patientService.create({ name, email: email || undefined, phone: phone || undefined })
      if (res.error) return
      setCreateName('')
      setCreateEmail('')
      setCreatePhone('')
      await load()
    } finally {
      setCreating(false)
    }
  }

  const onAddFromPlatform = async (p: any) => {
    const name = String(p?.name || '').trim()
    const email = String(p?.email || '').trim()
    const phone = String(p?.phone || '').trim()
    if (!name) return
    setCreating(true)
    try {
      const res = await patientService.create({
        userId: String(p?.id || '').trim() || undefined,
        name,
        email: email || undefined,
        phone: phone || undefined,
      })
      if (res.error) return
      await load()
    } finally {
      setCreating(false)
    }
  }

  const onToggleFollowUp = async (patientId: string, nextActive: boolean) => {
    setActionError('')
    setUpdatingId(patientId)
    try {
      const res = await patientService.update(patientId, { isActive: nextActive })
      if (res.error) {
        setActionError(res.error || 'Falha ao atualizar acompanhamento')
        return
      }
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const onRemovePatient = async (patientId: string) => {
    setActionError('')
    setUpdatingId(patientId)
    try {
      const res = await patientService.remove(patientId)
      if (res.error) {
        setActionError(res.error || 'Falha ao remover paciente')
        return
      }
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const onStartConversation = async (platformUserId: string) => {
    setActionError('')
    const res = await messageService.startConversation(platformUserId)
    if (res.error) {
      setActionError(res.error || 'Falha ao iniciar conversa')
      return
    }
    // Redireciona para a página de conversas; a lista já deve carregar a conversa criada.
    navigate('/messages')
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
          <p className="text-gray-600 mt-1">Crie manualmente, busque por pacientes cadastrados ou importe via CSV.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary-700" />
            Criar paciente manualmente
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Nome</label>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome do paciente"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Email (opcional)</label>
              <input
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Telefone (opcional)</label>
              <input
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="(00) 00000-0000"
              />
            </div>
            <button
              type="button"
              disabled={creating || !createName.trim()}
              onClick={() => void onCreateManual()}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Adicionar paciente
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary-700" />
            Buscar paciente cadastrado na plataforma
          </div>
          <p className="text-sm text-gray-600 mt-1">Pesquise por nome ou email e adicione à sua lista.</p>

          <div className="mt-4 relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex.: maria, joao@email.com"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {searchError ? (
            <div className="mt-3 text-sm text-red-700">{searchError}</div>
          ) : searching ? (
            <div className="mt-3 text-sm text-gray-600 inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : searchResults.length === 0 && searchQuery.trim().length >= 2 ? (
            <div className="mt-3 text-sm text-gray-600">Nenhum paciente encontrado.</div>
          ) : null}

          {searchResults.length > 0 ? (
            <div className="mt-4 divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {searchResults.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                    <div className="text-sm text-gray-600 truncate">{p.email || 'Sem email'} · {p.phone || 'Sem telefone'}</div>
                  </div>
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => void onAddFromPlatform(p)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-900 disabled:opacity-60"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
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
          {actionError ? <div className="px-5 py-3 text-sm text-red-700 border-b border-gray-100">{actionError}</div> : null}
          <div className="divide-y divide-gray-100">
            {patients.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-sm text-gray-600 truncate">
                    {p.email || 'Sem email'} · {p.phone || 'Sem telefone'}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {p.isActive ? 'Acompanhamento ativo' : 'Acompanhamento suspenso'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.userId ? (
                    <button
                      type="button"
                      onClick={() => void onStartConversation(String(p.userId))}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-900"
                      title="Iniciar conversa"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Conversar
                    </button>
                  ) : null}

                  {p.isActive ? (
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => void onToggleFollowUp(p.id, false)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-900 disabled:opacity-60"
                    >
                      {updatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Suspender
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => void onToggleFollowUp(p.id, true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-semibold disabled:opacity-60"
                    >
                      {updatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Iniciar acompanhamento
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={updatingId === p.id}
                    onClick={() => deleteFlow.open({ id: p.id, name: p.name || 'paciente' })}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-60"
                    title="Remove o paciente da sua lista"
                  >
                    Encerrar/remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteFlow.isOpen}
        onClose={deleteFlow.close}
        onConfirm={() =>
          void deleteFlow.confirm(async (target) => {
            await onRemovePatient(target.id)
          })
        }
        title="Confirmar remoção"
        message={`Deseja encerrar/remover "${deleteFlow.target?.name || 'paciente'}" da sua lista?`}
        confirmText="Sim, remover"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteFlow.loading || Boolean(updatingId)}
      />
    </div>
  )
}

export default Patients


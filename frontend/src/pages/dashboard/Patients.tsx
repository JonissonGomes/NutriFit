import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageCircle, Search, Upload, UserPlus, Users } from 'lucide-react'
import { messageService, patientService } from '../../services'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import InlineAlert from '../../components/common/InlineAlert'
import EmptyState from '../../components/common/EmptyState'
import LoadingState from '../../components/common/LoadingState'
import { useConfirmDelete } from '../../hooks'
import { useToast } from '../../contexts/ToastContext'
import { FEEDBACK, getFriendlyErrorMessage } from '../../utils/feedbackMessages'
import {
  INPUT_LIMITS,
  limitLength,
  maskPhone,
  sanitizeInput,
  sanitizeName,
  validateEmail,
  validatePhone,
} from '../../utils/inputUtils'

const Patients = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
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
  const [recordPatientId, setRecordPatientId] = useState<string | null>(null)
  const [record, setRecord] = useState<any>(null)
  const [recordLoading, setRecordLoading] = useState(false)

  const loadRecord = async (patientId: string) => {
    setRecordPatientId(patientId)
    setRecordLoading(true)
    const res = await api.get(`/medical-records/${encodeURIComponent(patientId)}`)
    setRecord((res.data as any)?.data || null)
    setRecordLoading(false)
  }

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
        const msg = getFriendlyErrorMessage(res.error)
        setSearchError(msg)
        showToast(msg, 'error')
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
      const result = {
        created: (res.data as any).created ?? 0,
        skipped: (res.data as any).skipped ?? 0,
        errors: (res.data as any).errors ?? [],
      }
      setImportResult(result)
      if (result.errors.length > 0) {
        showToast(
          `Importação parcial: ${result.created} criado(s), ${result.errors.length} erro(s).`,
          'warning'
        )
      } else {
        showToast(
          result.created > 0
            ? `${result.created} paciente(s) importado(s) com sucesso.`
            : FEEDBACK.IMPORT_DONE,
          'success'
        )
      }
      await load()
    } else {
      const msg = getFriendlyErrorMessage(res.error, 'Falha ao importar o arquivo CSV.')
      setImportResult({ created: 0, skipped: 0, errors: [msg] })
      showToast(msg, 'error')
    }
    setImporting(false)
  }

  const onCreateManual = async () => {
    if (creating) return
    const name = sanitizeName(createName).trim()
    const email = sanitizeInput(createEmail.toLowerCase().trim())
    const phone = createPhone.trim()
    if (!name || name.length < 2) {
      setActionError('Nome deve ter pelo menos 2 caracteres')
      return
    }
    if (email && !validateEmail(email)) {
      setActionError('E-mail inválido')
      return
    }
    if (phone && !validatePhone(phone)) {
      setActionError('Telefone inválido')
      return
    }
    setActionError('')
    setCreating(true)
    try {
      const res = await patientService.create({ name, email: email || undefined, phone: phone || undefined })
      if (res.error) {
        const msg = getFriendlyErrorMessage(res.error, 'Não foi possível adicionar o paciente.')
        setActionError(msg)
        showToast(msg, 'error')
        return
      }
      setCreateName('')
      setCreateEmail('')
      setCreatePhone('')
      showToast(FEEDBACK.PATIENT_CREATED, 'success')
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
      if (res.error) {
        const msg = getFriendlyErrorMessage(res.error, 'Não foi possível adicionar o paciente.')
        setActionError(msg)
        showToast(msg, 'error')
        return
      }
      showToast(FEEDBACK.PATIENT_CREATED, 'success')
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
        const msg = getFriendlyErrorMessage(res.error, 'Falha ao atualizar acompanhamento.')
        setActionError(msg)
        showToast(msg, 'error')
        return
      }
      showToast(
        nextActive ? 'Acompanhamento reativado.' : 'Acompanhamento suspenso.',
        'success'
      )
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
        const msg = getFriendlyErrorMessage(res.error, 'Falha ao remover paciente.')
        setActionError(msg)
        showToast(msg, 'error')
        return
      }
      showToast(FEEDBACK.PATIENT_REMOVED, 'success')
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const onStartConversation = async (platformUserId: string) => {
    setActionError('')
    const res = await messageService.startConversation(platformUserId)
    if (res.error) {
      const msg = getFriendlyErrorMessage(res.error, 'Falha ao iniciar conversa.')
      setActionError(msg)
      showToast(msg, 'error')
      return
    }
    showToast(FEEDBACK.CONVERSATION_STARTED, 'success')
    // Redireciona para a página de conversas; a lista já deve carregar a conversa criada.
    navigate('/messages')
  }

  if (loading) {
    return <LoadingState message="Carregando pacientes…" />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="app-page-header">
        <div className="app-page-header__content">
          <h1 className="app-page-title">Pacientes</h1>
          <p className="app-page-subtitle mt-1">Crie manualmente, busque por pacientes cadastrados ou importe via CSV.</p>
        </div>

        <label className="app-btn bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 cursor-pointer disabled:opacity-60 w-full md:w-auto">
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
                onChange={(e) => setCreateName(limitLength(sanitizeName(e.target.value), INPUT_LIMITS.NAME))}
                maxLength={INPUT_LIMITS.NAME}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome do paciente"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Email (opcional)</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(limitLength(sanitizeInput(e.target.value.toLowerCase()), INPUT_LIMITS.EMAIL))}
                maxLength={INPUT_LIMITS.EMAIL}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Telefone (opcional)</label>
              <input
                type="tel"
                inputMode="tel"
                value={createPhone}
                onChange={(e) => setCreatePhone(limitLength(maskPhone(e.target.value), INPUT_LIMITS.PHONE))}
                maxLength={INPUT_LIMITS.PHONE}
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
              onChange={(e) => setSearchQuery(limitLength(sanitizeInput(e.target.value), INPUT_LIMITS.SEARCH_QUERY))}
              maxLength={INPUT_LIMITS.SEARCH_QUERY}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex.: maria, joao@email.com"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {searchError ? (
            <InlineAlert variant="error" className="mt-3" onDismiss={() => setSearchError('')}>
              {searchError}
            </InlineAlert>
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
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Nenhum paciente ainda"
          description="Cadastre manualmente, busque na plataforma ou importe via CSV."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">
            {patients.length} paciente(s)
          </div>
          {actionError ? (
            <div className="px-5 py-3 border-b border-gray-100">
              <InlineAlert variant="error" onDismiss={() => setActionError('')}>
                {actionError}
              </InlineAlert>
            </div>
          ) : null}
          <div className="divide-y divide-gray-100">
            {patients.map((p) => (
              <div key={p.id} className="px-4 sm:px-5 py-4 app-list-row">
                <div className="app-list-row__content">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                      <div className="text-sm text-gray-600 truncate">
                        {p.email || 'Sem email'} · {p.phone || 'Sem telefone'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex w-fit shrink-0 whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {p.isActive ? 'Acompanhamento ativo' : 'Acompanhamento suspenso'}
                    </span>
                  </div>
                </div>
                <div className="app-actions md:justify-end">
                  <button
                    type="button"
                    onClick={() => void loadRecord(p.id)}
                    className="app-btn px-3 py-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    Prontuário
                  </button>
                  {p.userId ? (
                    <button
                      type="button"
                      onClick={() => void onStartConversation(String(p.userId))}
                      className="app-btn px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900"
                      title="Iniciar conversa"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      Conversar
                    </button>
                  ) : null}

                  {p.isActive ? (
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => void onToggleFollowUp(p.id, false)}
                      className="app-btn px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900 disabled:opacity-60"
                    >
                      {updatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
                      Suspender
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => void onToggleFollowUp(p.id, true)}
                      className="app-btn px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                      {updatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
                      Iniciar acompanhamento
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={updatingId === p.id}
                    onClick={() => deleteFlow.open({ id: p.id, name: p.name || 'paciente' })}
                    className="app-btn px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 disabled:opacity-60"
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

      {recordPatientId ? (
        <div className="app-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="app-title">Prontuário unificado</h2>
            <button type="button" className="text-sm text-gray-600" onClick={() => { setRecordPatientId(null); setRecord(null) }}>Fechar</button>
          </div>
          {recordLoading ? (
            <div className="text-sm text-gray-600">Carregando prontuário...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="font-semibold text-gray-900">Anamnese</div>
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">{record?.anamnesis ? JSON.stringify(record.anamnesis, null, 2) : 'Sem registro'}</pre>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="font-semibold text-gray-900">Antropometria ({record?.anthropometric?.length || 0})</div>
                <div className="mt-2 text-xs text-gray-600">Últimos registros agregados do paciente.</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="font-semibold text-gray-900">Exames ({record?.labExams?.length || 0})</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="font-semibold text-gray-900">Questionários ({record?.questionnaires?.length || 0})</div>
              </div>
            </div>
          )}
        </div>
      ) : null}

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


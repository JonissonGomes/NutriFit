import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Save, Sparkles } from 'lucide-react'
import { anamnesisService, anthropometricService, labExamService, mealPlanService, patientService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import { sanitizeInput, limitLength } from '../../utils/inputUtils'
import type { ClinicalSnapshot, MealPlanCategory, MealPlanStatus } from '../../types/api'

const categoryLabel: Record<MealPlanCategory, string> = {
  emagrecimento: 'Emagrecimento',
  'ganho-massa': 'Ganho de massa',
  performance: 'Performance',
  saude: 'Saúde',
  gestante: 'Gestante',
  infantil: 'Infantil',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  intolerancias: 'Intolerâncias',
}

const MealPlanCreate = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [patientId, setPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MealPlanCategory>('saude')
  const [status, setStatus] = useState<MealPlanStatus>('draft')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [objective, setObjective] = useState('emagrecimento')
  const [activityLevel, setActivityLevel] = useState('moderado')
  const [activityFactor, setActivityFactor] = useState('1.55')
  const [tmb, setTmb] = useState('')
  const [getValue, setGetValue] = useState('')
  const [restrictionsText, setRestrictionsText] = useState('')
  const [preferencesText, setPreferencesText] = useState('')
  const [calories, setCalories] = useState('')
  const [proteins, setProteins] = useState('')
  const [carbohydrates, setCarbohydrates] = useState('')
  const [fats, setFats] = useState('')
  const [mealsPerDay, setMealsPerDay] = useState('5')
  const [aiGenerating, setAIGenerating] = useState(false)
  const [aiDraft, setAIDraft] = useState<any>(null)
  const [anamnesisSummary, setAnamnesisSummary] = useState('')
  const [latestAnthro, setLatestAnthro] = useState<any>(null)
  const [latestExamSummary, setLatestExamSummary] = useState('')

  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId])
  const canSave = useMemo(() => title.trim().length >= 3 && patientId.trim().length > 0, [title, patientId])

  useEffect(() => {
    const loadPatients = async () => {
      const res = await patientService.list()
      const list = (res.data as any)?.data || []
      setPatients(list)
      if (list.length > 0) setPatientId(String(list[0].id))
    }
    void loadPatients()
  }, [])

  useEffect(() => {
    if (!patientId) return
    const loadContext = async () => {
      setLoadingContext(true)
      const [anamnesisRes, anthroRes, labsRes] = await Promise.all([
        anamnesisService.getByPatient(patientId),
        anthropometricService.listByPatient(patientId, 10),
        labExamService.listByPatient(patientId, 10),
      ])

      const anam = (anamnesisRes.data as any)?.data
      setAnamnesisSummary(String(anam?.aiSummary || '').trim())

      const anthroItems = ((anthroRes.data as any)?.data || []) as any[]
      const sortedAnthro = [...anthroItems].sort((a, b) => {
        const ad = new Date(a?.date || a?.createdAt || 0).getTime()
        const bd = new Date(b?.date || b?.createdAt || 0).getTime()
        return bd - ad
      })
      const latest = sortedAnthro[0]
      setLatestAnthro(latest || null)
      if (latest) {
        if (!height && latest.height) setHeight(String(latest.height))
        if (!weight && latest.weight) setWeight(String(latest.weight))
      }

      const exams = (((labsRes.data as any)?.data || []) as any[]).sort((a, b) => {
        const ad = new Date(a?.date || a?.createdAt || 0).getTime()
        const bd = new Date(b?.date || b?.createdAt || 0).getTime()
        return bd - ad
      })
      setLatestExamSummary(String(exams[0]?.aiAnalysis?.summary || exams[0]?.notes || '').trim())
      setLoadingContext(false)
    }
    void loadContext()
  }, [patientId, height, weight])

  const parseList = (value: string) =>
    value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

  const toNumber = (value: string): number | undefined => {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }

  const toInt = (value: string): number | undefined => {
    const n = Number(value)
    return Number.isFinite(n) ? Math.trunc(n) : undefined
  }

  const generateAIDraft = async () => {
    const cal = Number(calories)
    const p = Number(proteins)
    const c = Number(carbohydrates)
    const f = Number(fats)
    const mpd = Number(mealsPerDay)
    if (!(cal > 0 && p > 0 && c > 0 && f > 0 && mpd >= 3)) {
      showToast('Preencha calorias/macros e refeições por dia para gerar rascunho com IA.', 'warning')
      return
    }
    setAIGenerating(true)
    try {
      const res = await mealPlanService.generateWithAI({
        calories: cal,
        proteins: p,
        carbohydrates: c,
        fats: f,
        mealsPerDay: mpd,
        restrictions: parseList(restrictionsText),
        preferences: parseList(preferencesText),
      })
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      setAIDraft((res.data as any)?.data || res.data)
      showToast('Rascunho IA gerado. Revise antes de salvar.', 'success')
    } finally {
      setAIGenerating(false)
    }
  }

  const buildClinicalNotes = () => {
    return [
      '=== BASELINE DO PACIENTE ===',
      `Paciente: ${selectedPatient?.name || ''}`,
      `Email: ${selectedPatient?.email || 'não informado'}`,
      `Telefone: ${selectedPatient?.phone || 'não informado'}`,
      `Idade: ${age || 'não informado'}`,
      `Sexo: ${sex || 'não informado'}`,
      `Altura (cm): ${height || 'não informado'}`,
      `Peso (kg): ${weight || 'não informado'}`,
      `Objetivo: ${objective}`,
      `Nível atividade: ${activityLevel}`,
      `Fator atividade: ${activityFactor}`,
      `TMB: ${tmb || 'não informado'}`,
      `GET: ${getValue || 'não informado'}`,
      '',
      '=== ESTRATÉGIA NUTRICIONAL ===',
      `Calorias alvo: ${calories || 'não informado'}`,
      `Proteínas: ${proteins || 'não informado'}`,
      `Carboidratos: ${carbohydrates || 'não informado'}`,
      `Gorduras: ${fats || 'não informado'}`,
      `Refeições/dia: ${mealsPerDay || 'não informado'}`,
      '',
      '=== CONTEXTO CLÍNICO E ANAMNESE ===',
      `Restrições: ${parseList(restrictionsText).join(', ') || 'nenhuma informada'}`,
      `Preferências: ${parseList(preferencesText).join(', ') || 'nenhuma informada'}`,
      anamnesisSummary ? `Resumo anamnese: ${anamnesisSummary}` : 'Resumo anamnese: não disponível',
      latestExamSummary ? `Resumo último exame: ${latestExamSummary}` : 'Resumo último exame: não disponível',
      latestAnthro?.bmi ? `IMC mais recente: ${latestAnthro.bmi}` : 'IMC mais recente: não disponível',
    ].join('\n')
  }

  const buildClinicalSnapshot = (): ClinicalSnapshot => {
    return {
      patient: {
        name: selectedPatient?.name || undefined,
        email: selectedPatient?.email || undefined,
        phone: selectedPatient?.phone || undefined,
        age: toInt(age),
        sex: sex.trim() || undefined,
        height: toNumber(height),
        weight: toNumber(weight),
      },
      energy: {
        objective: objective.trim() || undefined,
        activityLevel: activityLevel.trim() || undefined,
        activityFactor: toNumber(activityFactor),
        tmb: toNumber(tmb),
        get: toNumber(getValue),
      },
      strategy: {
        calories: toNumber(calories),
        proteins: toNumber(proteins),
        carbohydrates: toNumber(carbohydrates),
        fats: toNumber(fats),
        mealsPerDay: toInt(mealsPerDay),
      },
      restrictions: parseList(restrictionsText),
      preferences: parseList(preferencesText),
      anamnesisSummary: anamnesisSummary || undefined,
      labExamSummary: latestExamSummary || undefined,
      bmi: latestAnthro?.bmi ?? undefined,
    }
  }

  const onSave = async () => {
    if (!canSave) {
      showToast('Selecione paciente e informe um título (mínimo 3 caracteres).', 'warning')
      return
    }

    setSaving(true)
    try {
      const res = await mealPlanService.create({
        patientId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        meals: aiDraft?.meals || [],
        restrictions: parseList(restrictionsText),
        clinicalSnapshot: buildClinicalSnapshot(),
        notes: buildClinicalNotes(),
        isTemplate: false,
      })

      const created = (res.data as any)?.data ?? res.data
      if (!created?.id) {
        showToast(res.error || 'Não foi possível criar o plano.', 'error')
        return
      }

      showToast('Plano criado com sucesso!', 'success')
      const basePath = location.pathname.startsWith('/medico') ? '/medico' : '/nutritionist'
      navigate(`${basePath}/meal-plans`)
    } finally {
      setSaving(false)
    }
  }

  const goNext = () => setStep((s) => Math.min(4, s + 1))
  const goBack = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Novo plano alimentar</h1>
          <p className="text-gray-600 mt-1">Wizard: paciente, baseline, estratégia e revisão final.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700">
        Etapa {step}/4
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        {step === 1 ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Paciente *</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.email ? `(${p.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>Email: {selectedPatient?.email || 'não informado'}</div>
              <div>Telefone: {selectedPatient?.phone || 'não informado'}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Título *</label>
              <input value={title} onChange={(e) => setTitle(limitLength(sanitizeInput(e.target.value), 80))} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="Ex.: Plano de emagrecimento - 8 semanas" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as MealPlanCategory)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                  {(Object.keys(categoryLabel) as MealPlanCategory[]).map((c) => (
                    <option key={c} value={c}>{categoryLabel[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as MealPlanStatus)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="text-sm text-gray-600">{loadingContext ? 'Carregando contexto clínico...' : 'Contexto clínico carregado do paciente selecionado.'}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-sm font-semibold">Idade</label><input value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Sexo</label><input value={sex} onChange={(e) => setSex(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Objetivo</label><input value={objective} onChange={(e) => setObjective(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Altura (cm)</label><input value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Peso (kg)</label><input value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Nível atividade</label><input value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Fator atividade</label><input value={activityFactor} onChange={(e) => setActivityFactor(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">TMB</label><input value={tmb} onChange={(e) => setTmb(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">GET</label><input value={getValue} onChange={(e) => setGetValue(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Restrições (separadas por vírgula)</label>
              <input value={restrictionsText} onChange={(e) => setRestrictionsText(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="lactose, glúten, alergia a castanhas" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Preferências (separadas por vírgula)</label>
              <input value={preferencesText} onChange={(e) => setPreferencesText(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="vegetariano, refeição rápida" />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-sm font-semibold">Calorias alvo</label><input value={calories} onChange={(e) => setCalories(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Proteínas (g)</label><input value={proteins} onChange={(e) => setProteins(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Carboidratos (g)</label><input value={carbohydrates} onChange={(e) => setCarbohydrates(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Gorduras (g)</label><input value={fats} onChange={(e) => setFats(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Refeições por dia</label><input value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void generateAIDraft()} disabled={aiGenerating} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-white font-semibold hover:bg-accent-700 disabled:opacity-60">
                {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Gerar rascunho IA
              </button>
              {aiDraft ? <span className="text-sm text-gray-700">Rascunho gerado com {Array.isArray(aiDraft.meals) ? aiDraft.meals.length : 0} refeição(ões).</span> : null}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Descrição (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(limitLength(e.target.value, 500))} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white min-h-[120px]" placeholder="Observações gerais para este plano..." />
              <div className="text-xs text-gray-500 mt-1">{description.length}/500</div>
            </div>
            <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
              <div><b>Paciente:</b> {selectedPatient?.name || '-'}</div>
              <div><b>Objetivo:</b> {objective || '-'}</div>
              <div><b>Restrições:</b> {parseList(restrictionsText).join(', ') || '-'}</div>
              <div><b>IA:</b> {aiDraft ? 'rascunho gerado' : 'não gerado (plano inicia sem refeições)'}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={goBack} disabled={step === 1} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        {step < 4 ? (
          <button type="button" onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700">
            Próxima
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={() => void onSave()} disabled={saving || !canSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Criar plano
          </button>
        )}
      </div>
    </div>
  )
}

export default MealPlanCreate


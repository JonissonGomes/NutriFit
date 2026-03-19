import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Info, Loader2, Plus, Save, Sparkles } from 'lucide-react'
import { anamnesisService, anthropometricService, labExamService, mealPlanService, patientService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import { sanitizeInput, limitLength } from '../../utils/inputUtils'
import type { ClinicalSnapshot, MealPlanCategory, MealPlanStatus, MealType } from '../../types/api'

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

  const activityFactorByLevel: Record<string, number> = {
    Sedentário: 1.2,
    'Levemente ativo': 1.375,
    'Moderadamente ativo': 1.55,
    'Muito ativo': 1.725,
    'Extremamente ativo': 1.9,
  }

  const objectiveOptions: Record<string, string> = {
    emagrecimento: 'Emagrecimento',
    'ganho-massa': 'Ganho de massa',
    manutencao: 'Manutenção',
  }

  const sexOptions = ['Feminino', 'Masculino', 'Prefiriu não declarar'] as const

  const mealTypeLabel: Record<MealType, string> = {
    'cafe-manha': 'Café da manhã',
    'lanche-manha': 'Lanche (manhã)',
    almoco: 'Almoço',
    'lanche-tarde': 'Lanche (tarde)',
    jantar: 'Jantar',
    ceia: 'Ceia',
  }

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
  const [objective, setObjective] = useState<string>('emagrecimento')
  const [activityLevel, setActivityLevel] = useState<string>('Moderadamente ativo')
  const [activityFactor, setActivityFactor] = useState<number>(1.55)
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
  const [mealsDraft, setMealsDraft] = useState<any[]>([])
  const [anamnesisSummary, setAnamnesisSummary] = useState('')
  const [latestAnthro, setLatestAnthro] = useState<any>(null)
  const [latestExamSummary, setLatestExamSummary] = useState('')

  const [manualMealType, setManualMealType] = useState<MealType>('cafe-manha')
  const [manualMealTime, setManualMealTime] = useState('07:00')
  const [manualMealNotes, setManualMealNotes] = useState('')

  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId])
  const selectedPlatformPatientId = useMemo(() => String(selectedPatient?.userId || '').trim(), [selectedPatient])
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
      const nextMeals = (res.data as any)?.data?.meals || (res.data as any)?.meals || []
      setMealsDraft(Array.isArray(nextMeals) ? nextMeals : [])
      showToast('Rascunho IA gerado. Revise antes de salvar.', 'success')
    } finally {
      setAIGenerating(false)
    }
  }

  const toFormattedGet = (value: number): string => {
    // Mostra sem casas se for inteiro; caso contrário 1 casa.
    const rounded = Math.round(value)
    return Math.abs(value - rounded) < 0.0001 ? String(rounded) : String(Math.round(value * 10) / 10)
  }

  useEffect(() => {
    const nextFactor = activityFactorByLevel[activityLevel] ?? 1.55
    setActivityFactor(nextFactor)
  }, [activityLevel])

  useEffect(() => {
    const tmbNum = toNumber(tmb)
    if (tmbNum === undefined) {
      setGetValue('')
      return
    }
    setGetValue(toFormattedGet(tmbNum * activityFactor))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmb, activityFactor])

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
        activityFactor: activityFactor,
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
      if (!selectedPlatformPatientId) {
        showToast(
          'Este paciente não está vinculado a uma conta da plataforma. O plano não aparecerá no módulo do paciente até vincular um usuário.',
          'warning'
        )
      }

      const res = await mealPlanService.create({
        patientId: selectedPlatformPatientId || undefined,
        title: sanitizeInput(title).trim(),
        description: description.trim() || undefined,
        category,
        status,
        meals: mealsDraft,
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

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    n <= step ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {n}
                </div>
                {n !== 4 ? (
                  <div className={`flex-1 h-[2px] mx-2 ${n < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                ) : null}
              </div>
              <div className={`mt-2 text-xs font-semibold ${n <= step ? 'text-primary-700' : 'text-gray-400'}`}>
                {n === 1 ? 'Paciente' : n === 2 ? 'Baseline' : n === 3 ? 'Estratégia' : 'Revisão'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        {step === 1 ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Paciente *</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.email ? `(${p.email})` : ''} {!p.userId ? '• sem conta' : ''}
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
              <input
                value={title}
                onChange={(e) => setTitle(limitLength(e.target.value, 80))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder="Ex.: Plano de emagrecimento - 8 semanas"
              />
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
              <div>
                <label className="text-sm font-semibold">Sexo</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                  <option value="">Selecione</option>
                  {sexOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Objetivo</label>
                <select value={objective} onChange={(e) => setObjective(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                  {Object.entries(objectiveOptions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div><label className="text-sm font-semibold">Altura (cm)</label><input value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div><label className="text-sm font-semibold">Peso (kg)</label><input value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></div>
              <div>
                <label className="text-sm font-semibold">Nível de atividade</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                >
                  {Object.keys(activityFactorByLevel).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold">Fator de Atividade</label>
                  <span title="Multiplicador aplicado sobre a TMB para estimar o gasto energético diário.">
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </div>
                <input value={String(activityFactor)} disabled className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700" />
                <div className="text-xs text-gray-500 mt-1">Multiplicador</div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold">TMB</label>
                  <span title="Taxa metabólica basal: gasto energético em repouso (kcal). Base para calcular o GET.">
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    value={tmb}
                    onChange={(e) => setTmb(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 pr-10"
                    inputMode="decimal"
                    placeholder="Ex.: 1500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">kcal</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold">GET</label>
                  <span title="GET = TMB × Fator de Atividade (kcal/dia). Campo calculado.">
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    value={getValue}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 pr-14"
                    placeholder="—"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">kcal/dia</span>
                </div>
              </div>
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
              {mealsDraft.length > 0 ? <span className="text-sm text-gray-700">Refeições no plano: {mealsDraft.length}</span> : null}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Adicionar refeição manualmente</div>
                  <div className="text-xs text-gray-600 mt-1">Para iniciar, você pode salvar uma refeição com apenas tipo, horário e observações (sem alimentos).</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Tipo</label>
                  <select value={manualMealType} onChange={(e) => setManualMealType(e.target.value as MealType)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white">
                    {(Object.keys(mealTypeLabel) as MealType[]).map((t) => (
                      <option key={t} value={t}>
                        {mealTypeLabel[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Horário</label>
                  <input value={manualMealTime} onChange={(e) => setManualMealTime(e.target.value)} type="time" className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Observações (opcional)</label>
                  <input value={manualMealNotes} onChange={(e) => setManualMealNotes(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white" placeholder="Ex.: sem lactose" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMealsDraft((prev) => [
                      ...prev,
                      {
                        type: manualMealType,
                        time: manualMealTime,
                        foods: [],
                        notes: manualMealNotes.trim() || '',
                      },
                    ])
                    setManualMealNotes('')
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar refeição
                </button>
              </div>

              {mealsDraft.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {mealsDraft.map((m, idx) => (
                    <div key={`${m.type}-${m.time}-${idx}`} className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{mealTypeLabel[m.type as MealType] || m.type}</div>
                        <div className="text-xs text-gray-600">Horário: {m.time}</div>
                        {m.notes ? <div className="text-xs text-gray-500 truncate mt-1">{m.notes}</div> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMealsDraft((prev) => prev.filter((_, i) => i !== idx))}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
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


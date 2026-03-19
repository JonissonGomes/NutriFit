import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { mealPlanService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import { sanitizeInput, limitLength } from '../../utils/inputUtils'
import type { MealPlanCategory, MealPlanStatus } from '../../types/api'

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
  const { showToast } = useToast()

  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MealPlanCategory>('saude')
  const [status, setStatus] = useState<MealPlanStatus>('draft')

  const canSave = useMemo(() => title.trim().length >= 3, [title])

  const onSave = async () => {
    if (!canSave) {
      showToast('Informe um título (mínimo 3 caracteres).', 'warning')
      return
    }

    setSaving(true)
    try {
      const res = await mealPlanService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        meals: [],
        isTemplate: false,
      })

      const created = (res.data as any)?.data ?? res.data
      if (!created?.id) {
        showToast(res.error || 'Não foi possível criar o plano.', 'error')
        return
      }

      showToast('Plano criado com sucesso!', 'success')
      navigate(`/nutritionist/meal-plans`)
    } finally {
      setSaving(false)
    }
  }

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
          <p className="text-gray-600 mt-1">Crie um rascunho e depois vincule o paciente e monte as refeições.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Título *</label>
          <input
            value={title}
            onChange={(e) => setTitle(limitLength(sanitizeInput(e.target.value), 80))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex.: Plano de emagrecimento - 8 semanas"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MealPlanCategory)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
          >
            {(Object.keys(categoryLabel) as MealPlanCategory[]).map((c) => (
              <option key={c} value={c}>
                {categoryLabel[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MealPlanStatus)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
          >
            <option value="draft">Rascunho</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(limitLength(e.target.value, 500))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white min-h-[120px] outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Observações iniciais, objetivo e estratégia..."
          />
          <div className="text-xs text-gray-500 mt-1">{description.length}/500</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || !canSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Criar plano
        </button>
      </div>
    </div>
  )
}

export default MealPlanCreate


import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { limitLength, sanitizeText } from '../../utils/inputUtils'
import { MAX_CAREER_ENTRIES } from '../../utils/profileCareer'

export type CareerFieldConfig = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  maxLength: number
  required?: boolean
  halfWidth?: boolean
}

type CareerEntryListProps<T extends { id: string }> = {
  title: string
  description?: string
  entries: T[]
  fields: CareerFieldConfig[]
  emptyLabel: string
  addLabel: string
  onChange: (entries: T[]) => void
  createEntry: () => T
}

function CareerEntryList<T extends { id: string }>({
  title,
  description,
  entries,
  fields,
  emptyLabel,
  addLabel,
  onChange,
  createEntry,
}: CareerEntryListProps<T>) {
  const updateEntry = (id: string, key: string, value: string) => {
    onChange(
      entries.map((entry) =>
        entry.id === id ? { ...entry, [key]: value } : entry
      )
    )
  }

  const removeEntry = (id: string) => {
    onChange(entries.filter((entry) => entry.id !== id))
  }

  const addEntry = () => {
    if (entries.length >= MAX_CAREER_ENTRIES) return
    onChange([...entries, createEntry()])
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? <p className="text-xs text-gray-500 mt-0.5">{description}</p> : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 italic mb-3">{emptyLabel}</p>
      ) : (
        <div className="space-y-3 mb-3">
          {entries.map((entry, index) => (
            <div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 md:p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {title} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50"
                  aria-label="Remover item"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map((field) => {
                  const value = String((entry as Record<string, unknown>)[field.key] ?? '')
                  const inputClass =
                    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white'
                  const fieldSpan = field.multiline || !field.halfWidth ? 'md:col-span-2' : ''

                  return (
                    <div key={field.key} className={fieldSpan}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required ? ' *' : ''}
                      </label>
                      {field.multiline ? (
                        <textarea
                          value={value}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              field.key,
                              sanitizeText(limitLength(e.target.value, field.maxLength), ['\n', ' ', '.', ',', '!', '?', '-', ':', ';', '(', ')', '/'])
                            )
                          }
                          rows={3}
                          maxLength={field.maxLength}
                          className={inputClass}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              field.key,
                              sanitizeText(limitLength(e.target.value, field.maxLength), field.key.includes('Year') || field.key === 'year' ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] : [' ', '.', ',', '-', '/', '(', ')', '&', '+'])
                            )
                          }
                          maxLength={field.maxLength}
                          className={inputClass}
                          placeholder={field.placeholder}
                          inputMode={field.key.includes('Year') || field.key === 'year' ? 'numeric' : 'text'}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addEntry}
        disabled={entries.length >= MAX_CAREER_ENTRIES}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AddIcon sx={{ fontSize: 18 }} />
        {addLabel}
      </button>
      {entries.length >= MAX_CAREER_ENTRIES ? (
        <p className="text-xs text-gray-500 mt-1">Limite de {MAX_CAREER_ENTRIES} itens atingido.</p>
      ) : null}
    </div>
  )
}

export const WORK_EXPERIENCE_FIELDS: CareerFieldConfig[] = [
  { key: 'title', label: 'Cargo ou função', placeholder: 'Ex: Nutricionista clínica', maxLength: 120, required: true, halfWidth: true },
  { key: 'organization', label: 'Local / empresa', placeholder: 'Ex: Clínica Vida Saudável', maxLength: 120, halfWidth: true },
  { key: 'startYear', label: 'Início', placeholder: 'Ex: 2018', maxLength: 4, halfWidth: true },
  { key: 'endYear', label: 'Término', placeholder: 'Vazio = Atual', maxLength: 4, halfWidth: true },
  { key: 'description', label: 'Descrição', placeholder: 'Atividades, resultados e destaques...', maxLength: 500, multiline: true },
]

export const EDUCATION_FIELDS: CareerFieldConfig[] = [
  { key: 'degree', label: 'Curso / titulação', placeholder: 'Ex: Graduação em Nutrição', maxLength: 120, required: true, halfWidth: true },
  { key: 'institution', label: 'Instituição', placeholder: 'Ex: USP', maxLength: 120, halfWidth: true },
  { key: 'startYear', label: 'Início', placeholder: 'Ex: 2014', maxLength: 4, halfWidth: true },
  { key: 'endYear', label: 'Conclusão', placeholder: 'Ex: 2018', maxLength: 4, halfWidth: true },
  { key: 'description', label: 'Detalhes', placeholder: 'Ênfases, TCC, honrarias...', maxLength: 500, multiline: true },
]

export const RECOGNITION_FIELDS: CareerFieldConfig[] = [
  { key: 'title', label: 'Prêmio ou reconhecimento', placeholder: 'Ex: Certificação em Nutrição Esportiva', maxLength: 120, required: true, halfWidth: true },
  { key: 'issuer', label: 'Concedido por', placeholder: 'Ex: ABENUTRI', maxLength: 120, halfWidth: true },
  { key: 'year', label: 'Ano', placeholder: 'Ex: 2022', maxLength: 4, halfWidth: true },
  { key: 'description', label: 'Detalhes', placeholder: 'Contexto ou relevância...', maxLength: 500, multiline: true },
]

export default CareerEntryList

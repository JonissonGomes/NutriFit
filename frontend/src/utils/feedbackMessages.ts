/** Mensagens de sucesso padronizadas (pt-BR). */
export const FEEDBACK = {
  PATIENT_CREATED: 'Paciente adicionado com sucesso.',
  PATIENT_REMOVED: 'Paciente removido da sua lista.',
  PATIENT_UPDATED: 'Acompanhamento atualizado.',
  IMPORT_DONE: 'Importação concluída.',
  CONVERSATION_STARTED: 'Conversa iniciada. Redirecionando…',
  DIARY_ENTRY_CREATED: 'Refeição registrada no diário.',
  PHOTO_UPLOADED: 'Foto enviada com sucesso.',
  EXAM_CREATED: 'Exame cadastrado.',
  EXAM_REMOVED: 'Exame removido.',
  EXAM_ANALYZED: 'Análise por IA concluída.',
  EXAM_SAVED: 'Texto do exame salvo.',
  GENERIC_SAVED: 'Alterações salvas.',
  COMMENT_SAVED: 'Comentário enviado ao paciente.',
  DIARY_ANALYZED: 'Análise da foto concluída.',
} as const

const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/invalid credentials/i, 'E-mail ou senha incorretos.'],
  [/unauthorized|401/i, 'Sessão expirada. Faça login novamente.'],
  [/forbidden|403/i, 'Você não tem permissão para esta ação.'],
  [/not found|404/i, 'Registro não encontrado.'],
  [/conflict|already exists|duplicate/i, 'Este registro já existe.'],
  [/network|failed to fetch|fetch failed/i, 'Sem conexão com o servidor. Verifique sua internet.'],
  [/timeout|abort/i, 'A operação demorou demais. Tente novamente.'],
  [/too many requests|429/i, 'Muitas tentativas. Aguarde um momento e tente de novo.'],
  [/internal server|500/i, 'Erro no servidor. Tente novamente em instantes.'],
  [/bad request|400/i, 'Dados inválidos. Revise os campos e tente novamente.'],
  [/validation|invalid/i, 'Alguns campos estão incorretos. Revise e tente novamente.'],
]

const DEFAULT_ERROR = 'Ocorreu um erro. Tente novamente.'

/** Converte mensagens técnicas da API em texto amigável em português. */
export function getFriendlyErrorMessage(
  error?: string | null,
  fallback: string = DEFAULT_ERROR
): string {
  if (!error?.trim()) return fallback

  const trimmed = error.trim()
  for (const [pattern, message] of ERROR_PATTERNS) {
    if (pattern.test(trimmed)) return message
  }

  return trimmed
}

export const TOAST_TITLES = {
  success: 'Tudo certo',
  error: 'Algo deu errado',
  warning: 'Atenção',
  info: 'Informação',
} as const

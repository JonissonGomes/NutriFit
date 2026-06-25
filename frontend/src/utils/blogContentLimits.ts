/** Limites para conteúdos curtos (~1–2 min de leitura a 200 palavras/min). */
export const BLOG_CONTENT_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 80,
  EXCERPT_MIN: 20,
  EXCERPT_MAX: 320,
  CONTENT_MIN: 80,
  CONTENT_MAX: 2000,
  WORDS_PER_MINUTE: 200,
  MAX_READING_MINUTES: 2,
} as const

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Estima tempo de leitura do título + resumo + conteúdo. */
export function estimateReadingMinutes(title: string, excerpt: string, content: string): number {
  const words = countWords([title, excerpt, content].filter((p) => p.trim()).join(' '))
  if (words === 0) return 0
  const minutes = Math.ceil(words / BLOG_CONTENT_LIMITS.WORDS_PER_MINUTE)
  return Math.min(BLOG_CONTENT_LIMITS.MAX_READING_MINUTES, Math.max(1, minutes))
}

export function formatReadingTimeLabel(title: string, excerpt: string, content: string): string {
  const minutes = estimateReadingMinutes(title, excerpt, content)
  if (minutes === 0) return 'Tempo de leitura: —'
  if (minutes === 1) return 'Tempo de leitura estimado: ~1 min'
  return 'Tempo de leitura estimado: ~2 min'
}

export function isBlogDraftValid(title: string, excerpt: string, content: string): boolean {
  const t = title.trim()
  const e = excerpt.trim()
  const c = content.trim()
  return (
    t.length >= BLOG_CONTENT_LIMITS.TITLE_MIN &&
    t.length <= BLOG_CONTENT_LIMITS.TITLE_MAX &&
    e.length >= BLOG_CONTENT_LIMITS.EXCERPT_MIN &&
    e.length <= BLOG_CONTENT_LIMITS.EXCERPT_MAX &&
    c.length >= BLOG_CONTENT_LIMITS.CONTENT_MIN &&
    c.length <= BLOG_CONTENT_LIMITS.CONTENT_MAX
  )
}

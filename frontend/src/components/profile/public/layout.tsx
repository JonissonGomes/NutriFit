import type { ReactNode } from 'react'

type ProfileSectionShellProps = {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  /** Sem padding interno — útil quando o filho já controla o espaçamento */
  bare?: boolean
}

/** Card de seção padronizado para o perfil público */
export function ProfileSectionShell({
  title,
  subtitle,
  children,
  className = '',
  bare = false,
}: ProfileSectionShellProps) {
  return (
    <section
      className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${bare ? '' : 'p-5 md:p-6'} ${className}`}
    >
      {(title || subtitle) && (
        <header className={bare ? 'px-5 md:px-6 pt-5 md:pt-6 mb-4' : 'mb-4 md:mb-5'}>
          {title ? <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2> : null}
          {subtitle ? <p className="text-sm text-gray-600 mt-1">{subtitle}</p> : null}
        </header>
      )}
      {children}
    </section>
  )
}

/** Duas colunas em telas largas — conteúdos + receitas, avaliações + contato */
export function ProfileSplitGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start ${className}`}>
      {children}
    </div>
  )
}

/** Faixa de seção full-width (landing / editorial) */
export function ProfilePageBand({
  children,
  tone = 'white',
  className = '',
}: {
  children: ReactNode
  tone?: 'white' | 'muted'
  className?: string
}) {
  const bg = tone === 'muted' ? 'bg-gray-50' : 'bg-white'
  return (
    <section className={`${bg} py-10 md:py-12 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

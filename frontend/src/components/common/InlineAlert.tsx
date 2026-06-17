import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

type InlineAlertVariant = 'success' | 'error' | 'warning' | 'info'

interface InlineAlertProps {
  variant?: InlineAlertVariant
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

const STYLES: Record<InlineAlertVariant, { wrap: string; icon: string; Icon: typeof Info }> = {
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    wrap: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-600',
    Icon: XCircle,
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    Icon: AlertCircle,
  },
  info: {
    wrap: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-600',
    Icon: Info,
  },
}

const InlineAlert = ({ variant = 'info', children, onDismiss, className = '' }: InlineAlertProps) => {
  const style = STYLES[variant]
  const Icon = style.Icon

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${style.wrap} ${className}`}
    >
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.icon}`} aria-hidden />
      <div className="flex-1 min-w-0">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 rounded p-0.5 hover:opacity-70 ${style.icon}`}
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

export default InlineAlert

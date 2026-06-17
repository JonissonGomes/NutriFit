import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  className?: string
}

const LoadingState = ({ message = 'Carregando…', className = '' }: LoadingStateProps) => (
  <div
    className={`flex flex-col items-center justify-center min-h-[280px] gap-3 text-gray-600 ${className}`}
    role="status"
    aria-live="polite"
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
    <p className="text-sm">{message}</p>
  </div>
)

export default LoadingState

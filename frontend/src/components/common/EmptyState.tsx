import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => (
  <div
    className={`bg-white border border-primary-100 rounded-xl p-8 sm:p-10 text-center ${className}`}
  >
    <div className="flex justify-center mb-3 text-primary-600">
      {icon ?? <Inbox className="h-10 w-10" aria-hidden />}
    </div>
    <p className="text-gray-800 font-semibold">{title}</p>
    {description ? <p className="text-gray-600 mt-2 text-sm">{description}</p> : null}
    {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
  </div>
)

export default EmptyState

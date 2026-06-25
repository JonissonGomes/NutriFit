import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type FormModalSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClass: Record<FormModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: FormModalSize
}

const FormModal = ({ isOpen, onClose, title, description, children, size = 'lg' }: FormModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClass[size]} max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-gray-200 dark:border-stone-700 flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-stone-700 px-6 py-4">
          <div className="min-w-0">
            <h2 id="form-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default FormModal

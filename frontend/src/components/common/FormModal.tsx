import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import ModalPortal from './ModalPortal'

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
  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="Fechar modal"
          onClick={onClose}
        />
        <div
          className={`relative w-full ${sizeClass[size]} max-h-[92dvh] sm:max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-gray-200 dark:border-stone-700 flex flex-col`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-modal-title"
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-stone-700 px-4 sm:px-6 py-4 shrink-0">
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
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors shrink-0"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">{children}</div>
        </div>
      </div>
    </ModalPortal>
  )
}

export default FormModal

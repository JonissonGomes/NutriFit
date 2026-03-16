import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import LoadingButton from './LoadingButton'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  loading = false,
}) => {
  if (!isOpen) return null

  const handleConfirm = async () => {
    await onConfirm()
  }

  const variantStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'danger',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'danger',
    },
    info: {
      icon: 'text-blue-600',
      button: 'primary',
    },
  }

  const style = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`mb-4 p-3 rounded-full ${
            variant === 'danger' 
              ? 'bg-red-100 dark:bg-red-900/20' 
              : variant === 'warning' 
              ? 'bg-yellow-100 dark:bg-yellow-900/20' 
              : 'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            <AlertTriangle className={`h-8 w-8 ${style.icon}`} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-stone-400">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-stone-600 text-gray-700 dark:text-stone-300 rounded-lg disabled:opacity-50 font-medium"
          >
            {cancelText}
          </button>
          <LoadingButton
            onClick={handleConfirm}
            loading={loading}
            variant={style.button as 'primary' | 'danger'}
            className="flex-1"
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


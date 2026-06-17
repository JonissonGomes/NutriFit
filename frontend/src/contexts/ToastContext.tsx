import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
  toasts: Toast[]
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const defaultDuration = (type: Toast['type']) => {
  if (type === 'error') return 6000
  if (type === 'warning') return 5000
  return 4000
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const resolvedDuration = duration ?? defaultDuration(type)
    const newToast: Toast = { id, message, type, duration: resolvedDuration }

    setToasts((prev) => [...prev, newToast])

    if (resolvedDuration > 0) {
      window.setTimeout(() => {
        removeToast(id)
      }, resolvedDuration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

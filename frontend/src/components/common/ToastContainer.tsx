import { useToast } from '../../contexts/ToastContext'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import CloseIcon from '@mui/icons-material/Close'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 20 }} />
      case 'error':
        return <ErrorIcon sx={{ fontSize: 20 }} />
      case 'warning':
        return <WarningIcon sx={{ fontSize: 20 }} />
      default:
        return <InfoIcon sx={{ fontSize: 20 }} />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
        }
    }
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md w-full sm:w-auto">
      {toasts.map((toast) => {
        const colors = getColors(toast.type)
        return (
          <div
            key={toast.id}
            className={`${colors.bg} ${colors.border} border-2 rounded-lg shadow-lg p-3 md:p-4 flex items-start gap-3 animate-slide-in-right`}
          >
            <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${colors.text} text-sm font-medium`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${colors.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer


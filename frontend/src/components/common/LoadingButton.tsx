import React from 'react'
import { CircularProgress } from '@mui/material'

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white focus:ring-gray-500',
    danger: 'bg-red-600 text-white focus:ring-red-500',
    outline: 'border-2 border-primary-600 text-primary-600 focus:ring-primary-500',
    ghost: 'text-gray-700 focus:ring-gray-500',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm md:text-base',
    lg: 'px-6 py-3 text-base md:text-lg',
  }
  
  const spinnerSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <CircularProgress 
            size={spinnerSize[size]} 
            thickness={4}
            sx={{ color: variant === 'outline' || variant === 'ghost' ? 'inherit' : 'white' }}
          />
          <span className="opacity-75 hidden sm:inline">Processando...</span>
          <span className="opacity-75 sm:hidden">...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}

export default LoadingButton


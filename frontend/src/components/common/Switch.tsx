import React from 'react'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
  'aria-label'?: string
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  className = '',
  'aria-label': ariaLabel,
}) => (
  <label
    className={`relative inline-flex shrink-0 items-center ${
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
    } ${className}`}
  >
    <input
      type="checkbox"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div
      className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"
      aria-hidden
    />
  </label>
)

export default Switch

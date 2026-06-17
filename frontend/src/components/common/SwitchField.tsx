import React from 'react'
import Switch from './Switch'

export interface SwitchFieldProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  bordered?: boolean
}

const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
  bordered = false,
}) => (
  <div
    className={`flex items-center justify-between gap-4 ${
      bordered ? 'py-3 border-b border-gray-200 dark:border-gray-700' : ''
    } ${className}`}
  >
    <div className="min-w-0">
      <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
      {description ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
      ) : null}
    </div>
    <Switch checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
  </div>
)

export default SwitchField

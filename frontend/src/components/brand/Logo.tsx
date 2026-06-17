import nufitLogo from '../../assets/Nufit-logo.png'

const sizeClasses = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-14',
} as const

export type LogoSize = keyof typeof sizeClasses

interface LogoProps {
  className?: string
  imageClassName?: string
  showText?: boolean
  textClassName?: string
  size?: LogoSize
}

export function Logo({
  className = '',
  imageClassName = '',
  showText = true,
  textClassName = 'text-xl font-bold text-primary-600',
  size = 'md',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 whitespace-nowrap shrink-0 ${className}`}>
      <img
        src={nufitLogo}
        alt="NuFit"
        className={`${sizeClasses[size]} w-auto object-contain ${imageClassName}`}
      />
      {showText && <span className={textClassName}>NuFit</span>}
    </div>
  )
}

export { nufitLogo }

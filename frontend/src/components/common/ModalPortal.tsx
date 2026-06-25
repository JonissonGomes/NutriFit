import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface ModalPortalProps {
  isOpen: boolean
  children: ReactNode
}

const ModalPortal = ({ isOpen, children }: ModalPortalProps) => {
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return createPortal(children, document.body)
}

export default ModalPortal

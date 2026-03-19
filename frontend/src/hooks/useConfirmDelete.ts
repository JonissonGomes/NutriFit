import { useState } from 'react'

type ConfirmHandler<T> = (target: T) => Promise<void>

export const useConfirmDelete = <T>() => {
  const [target, setTarget] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)

  const open = (nextTarget: T) => setTarget(nextTarget)

  const close = () => {
    if (loading) return
    setTarget(null)
  }

  const confirm = async (handler: ConfirmHandler<T>) => {
    if (!target) return
    setLoading(true)
    try {
      await handler(target)
      setTarget(null)
    } finally {
      setLoading(false)
    }
  }

  return {
    target,
    isOpen: Boolean(target),
    loading,
    open,
    close,
    confirm,
    setTarget,
  }
}

export default useConfirmDelete

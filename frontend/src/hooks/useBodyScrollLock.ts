import { useEffect } from 'react'

/** Bloqueia scroll do body enquanto overlays/modais estão abertos. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [locked])
}

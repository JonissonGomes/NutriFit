import { useEffect, useState } from 'react'
import { profileService } from '../services'

/** Carrega o username do perfil público do profissional logado. */
export function usePublicProfileUsername(enabled: boolean): string | null {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setUsername(null)
      return
    }

    let cancelled = false
    void profileService.getMyProfile().then((res) => {
      if (!cancelled) {
        const value = res.data?.username?.trim()
        setUsername(value || null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return username
}

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/api\/v1\/?$/, '')

/** Normaliza URLs de avatar/capa para exibição no frontend. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  const raw = url?.trim()
  if (!raw) return undefined

  if (raw.startsWith('blob:')) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (/^https?:\/\//i.test(raw)) {
    if (raw.includes('/api/v1/media/')) return raw
    const legacy = raw.match(/^https?:\/\/nufit\/(.+)$/i)
    if (legacy) return `${API_ORIGIN}/api/v1/media/${legacy[1]}`
    try {
      const parsed = new URL(raw)
      const key = parsed.pathname.replace(/^\//, '')
      if (!parsed.hostname.includes('.') && /^[a-f0-9]{24}\//i.test(key)) {
        return `${API_ORIGIN}/api/v1/media/${key}`
      }
    } catch {
      // mantém URL original
    }
    return raw
  }
  if (raw.startsWith('/api/v1/media/')) return `${API_ORIGIN}${raw}`

  // URLs sem protocolo com domínio válido (ex.: cdn.seudominio.com/...)
  if (raw.includes('.') && !raw.includes(' ')) {
    const host = raw.split('/')[0]
    if (host.includes('.')) {
      return `https://${raw}`
    }
  }

  // Chave de objeto R2 ou caminho legado sem protocolo
  if (/^[a-f0-9]{24}\//i.test(raw) || raw.startsWith('nufit/')) {
    const key = raw.startsWith('nufit/') ? raw.slice('nufit/'.length) : raw
    return `${API_ORIGIN}/api/v1/media/${key}`
  }

  return undefined
}

export function getProfileCoverUrl(profile: { coverImage?: string; avatar?: string }): string | undefined {
  return resolveMediaUrl(profile.coverImage) || resolveMediaUrl(profile.avatar)
}

export function getProfileAvatarUrl(profile: { avatar?: string; coverImage?: string }): string | undefined {
  return resolveMediaUrl(profile.avatar) || resolveMediaUrl(profile.coverImage)
}

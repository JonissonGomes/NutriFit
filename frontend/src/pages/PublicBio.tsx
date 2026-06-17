import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { profileService } from '../services/profile.service'
import type { PublicProfile as PublicProfileType } from '../services/profile.service'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'

const PublicBio = () => {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!username) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      const res = await profileService.getPublicProfile(username)
      if (cancelled) return
      if (res.data) {
        setProfile(res.data)
      } else {
        setProfile(null)
        setNotFound(true)
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [username])

  if (loading) {
    return <LoadingState message="Carregando perfil…" className="min-h-[40vh]" />
  }

  if (notFound || !profile) {
    return (
      <div className="app-page py-8">
        <EmptyState title="Perfil não encontrado" description="Verifique o link e tente novamente." />
      </div>
    )
  }

  const links = [
    { label: 'Perfil completo', href: `/profile/${username}` },
    { label: 'Conteúdos', href: `/profile/${username}/conteudos` },
    { label: 'Receitas', href: `/profile/${username}/receitas` },
    profile.contact?.website ? { label: 'Site', href: profile.contact.website } : null,
    profile.social?.instagram?.url ? { label: 'Instagram', href: profile.social.instagram.url } : null,
    profile.contact?.phone ? { label: 'WhatsApp', href: `https://wa.me/${profile.contact.phone.replace(/\D/g, '')}` } : null,
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="app-page app-section py-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.displayName} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-white shadow" />
          ) : null}
          <h1 className="app-title mt-3">{profile.displayName}</h1>
          {profile.bio ? <p className="app-subtitle mt-1">{profile.bio}</p> : null}
        </div>
        <div className="space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href.startsWith('http') ? l.href : l.href}
              className="block app-card text-center font-semibold text-primary-700 hover:bg-primary-50"
              onClick={(e) => {
                if (l.href.startsWith('http')) {
                  e.preventDefault()
                  window.open(l.href, '_blank', 'noreferrer')
                }
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PublicBio

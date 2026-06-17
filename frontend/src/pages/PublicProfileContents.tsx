import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { blogService } from '../services/blog.service'
import { profileService } from '../services/profile.service'
import type { BlogPost } from '../services/blog.service'

const PublicProfileContents = () => {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<BlogPost[]>([])
  const [name, setName] = useState('')
  const shouldScrollMobile = items.length > 3

  useEffect(() => {
    const load = async () => {
      if (!username) return
      setLoading(true)
      const p = await profileService.getPublicProfile(username)
      if (!p.data) {
        setItems([])
        setLoading(false)
        return
      }
      setName(p.data.displayName || '')
      const res = await blogService.getByAuthor(p.data.userId, 100)
      setItems(res.data || [])
      setLoading(false)
    }
    void load()
  }, [username])

  return (
    <div className="app-page app-section py-8">
      <div>
        <h1 className="app-title">Conteúdos de {name || 'profissional'}</h1>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="app-card text-sm text-gray-600">Nenhum conteúdo publicado.</div>
      ) : (
        <div className={`${shouldScrollMobile ? 'overflow-x-auto md:overflow-visible' : 'overflow-hidden md:overflow-visible'}`}>
          <div className={shouldScrollMobile ? 'flex gap-3 min-w-max pb-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:min-w-0 md:pb-0' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {items.map((p) => {
            const thumb = p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url
            return (
              <Link
                key={p.id}
                to={`/conteudos/public/${p.slug}`}
                className={`${shouldScrollMobile ? 'w-[46vw] min-w-[46vw] max-w-[46vw] md:w-full md:min-w-0 md:max-w-none' : 'w-full'} bg-white border border-gray-200 rounded-xl overflow-hidden`}
              >
                {thumb ? <img src={thumb} alt={p.title} className="w-full h-36 object-cover" /> : <div className="w-full h-36 bg-gradient-to-r from-primary-600 to-accent-600" />}
                <div className="p-4">
                  <div className="font-semibold text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">{p.excerpt}</div>
                </div>
              </Link>
            )
          })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProfileContents


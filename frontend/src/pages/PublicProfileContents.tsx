import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { blogService } from '../services/blog.service'
import { profileService } from '../services/profile.service'
import type { BlogPost } from '../services/blog.service'

const PublicProfileContents = () => {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<BlogPost[]>([])
  const [name, setName] = useState('')

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to={`/profile/${username}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Voltar ao perfil
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conteúdos de {name || 'profissional'}</h1>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">Nenhum conteúdo publicado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => {
            const thumb = p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url
            return (
              <Link key={p.id} to={`/conteudos/public/${p.slug}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {thumb ? <img src={thumb} alt={p.title} className="w-full h-36 object-cover" /> : <div className="w-full h-36 bg-gradient-to-r from-primary-600 to-accent-600" />}
                <div className="p-4">
                  <div className="font-semibold text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">{p.excerpt}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PublicProfileContents


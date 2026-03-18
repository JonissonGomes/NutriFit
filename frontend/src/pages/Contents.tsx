import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogService } from '../services/blog.service'
import type { BlogPost } from '../services/blog.service'

const Contents = () => {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const res = await blogService.list({ published: true, page: 1, limit: 20 })
      if (res.error) {
        setError(res.error)
        setPosts([])
        setLoading(false)
        return
      }
      setPosts(res.data?.data ?? [])
      setLoading(false)
    }
    void load()
  }, [])

  const featured = useMemo(() => posts[0], [posts])
  const rest = useMemo(() => posts.slice(1), [posts])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Conteúdos</h1>
          <p className="text-gray-600 mt-1">
            Artigos e materiais publicados por nutricionistas no NuFit.
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
            Carregando...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-sm text-red-700">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
            Nenhum conteúdo publicado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featured && (
              <Link
                to={`/conteudos/public/${featured.slug}`}
                className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {featured.featuredImage || featured.attachments?.find((a) => a.type === 'image')?.url ? (
                  <img
                    src={featured.featuredImage || featured.attachments?.find((a) => a.type === 'image')?.url}
                    alt={featured.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-r from-primary-600 to-accent-600" />
                )}
                <div className="p-5">
                  <h2 className="text-xl font-bold text-gray-900">{featured.title}</h2>
                  <p className="text-gray-600 mt-2 line-clamp-3">{featured.excerpt}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    {featured.author?.name ? `Por ${featured.author.name}` : 'Autor NuFit'} • {featured.readTime || 1} min de leitura
                  </p>
                </div>
              </Link>
            )}

            <div className="space-y-4">
              {rest.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  to={`/conteudos/public/${p.slug}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{p.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{p.excerpt}</p>
                  <p className="text-[11px] text-gray-500 mt-2">
                    {p.author?.name ? `Por ${p.author.name}` : 'Autor NuFit'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Contents


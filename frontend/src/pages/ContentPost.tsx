import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { blogService } from '../services/blog.service'
import type { BlogPost } from '../services/blog.service'

const ContentPost = () => {
  const { slug } = useParams<{ slug: string }>()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!slug) return
      setLoading(true)
      setError('')
      const res = await blogService.getBySlug(slug)
      if (res.error || !res.data) {
        setError(res.error || 'Conteúdo não encontrado.')
        setPost(null)
        setLoading(false)
        return
      }
      setPost(res.data)
      setLoading(false)
    }
    void load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-600 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        <Link to="/conteudos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar para conteúdos
        </Link>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="font-semibold text-gray-900">{error || 'Conteúdo não encontrado.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Link to="/conteudos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800">
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar
        </Link>

        <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {post.featuredImage ? (
            <img src={post.featuredImage} alt={post.title} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-r from-primary-600 to-accent-600" />
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{post.title}</h1>
            <p className="text-sm text-gray-600 mt-2">{post.excerpt}</p>
            <p className="text-xs text-gray-500 mt-4">
              {post.author?.name ? `Por ${post.author.name}` : 'Autor NuFit'} • {post.readTime || 1} min de leitura
            </p>

            <div className="prose prose-gray max-w-none mt-6">
              {/* MVP: renderizar como texto simples. Depois podemos migrar para Markdown com sanitização. */}
              {post.content.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export default ContentPost


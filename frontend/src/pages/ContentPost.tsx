import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { blogService } from '../services/blog.service'
import type { BlogPost } from '../services/blog.service'
import ReactMarkdown from 'react-markdown'

const ContentPost = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!slug) return
      setLoading(true)
      setError('')
      const isMineRoute = location.pathname.startsWith('/conteudos/meus/')
      const res = isMineRoute ? await blogService.getBySlugMine(slug) : await blogService.getBySlug(slug)
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
  }, [slug, location.pathname])

  const content = useMemo(() => post?.content ?? '', [post])

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
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="font-semibold text-gray-900">{error || 'Conteúdo não encontrado.'}</p>
        </div>
      </div>
    )
  }

  const featuredImage =
    post.featuredImage || post.attachments?.find((a) => a.type === 'image')?.url || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar
        </button>

        <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {featuredImage ? (
            <img src={featuredImage} alt={post.title} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-r from-primary-600 to-accent-600" />
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{post.title}</h1>
            <p className="text-sm text-gray-600 mt-2">{post.excerpt}</p>
            <p className="text-xs text-gray-500 mt-4">
              {post.author?.name ? `Por ${post.author.name}` : 'Autor NuFit'} • {post.readTime || 1} min de leitura
            </p>

            <div className="mt-6 text-gray-700">
              <ReactMarkdown
                skipHtml
                components={{
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-700 font-semibold hover:text-primary-800 underline underline-offset-2"
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h2>,
                  h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mb-2 mt-5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mb-2 mt-4">{children}</h3>,
                  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-sm">{children}</code>,
                  pre: ({ children }) => <pre className="overflow-x-auto p-3 rounded-lg bg-gray-900 text-gray-50 text-sm border border-gray-800 mb-3">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary-600 pl-4 py-1 mb-3 text-gray-800">{children}</blockquote>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export default ContentPost


import { useEffect, useMemo, useState } from 'react'
import { blogService } from '../../services/blog.service'
import type { BlogPost } from '../../services/blog.service'
import LoadingButton from '../../components/common/LoadingButton'
import { useToast } from '../../contexts/ToastContext'

const MyContents = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState<BlogPost[]>([])

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(true)

  const canSave = useMemo(() => title.trim().length >= 5 && excerpt.trim().length >= 20 && content.trim().length >= 50, [title, excerpt, content])

  const load = async () => {
    setLoading(true)
    const res = await blogService.getMyPosts(50)
    if (res.error) showToast(res.error, 'error')
    setPosts(res.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await blogService.create({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        // MVP: categoria fixa para evitar termos legados
        category: 'dicas',
        published,
      })
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      showToast(published ? 'Conteúdo publicado!' : 'Rascunho salvo!', 'success')
      setTitle('')
      setExcerpt('')
      setContent('')
      setPublished(true)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!id) return
    const res = await blogService.delete(id)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }
    showToast('Conteúdo excluído.', 'success')
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Conteúdos</h1>
        <p className="text-gray-600 mt-1">Publique materiais para seus pacientes e visitantes do seu perfil.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Novo conteúdo</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex.: Como montar um prato equilibrado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resumo</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Um resumo curto (20+ caracteres) que aparece na listagem."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Escreva o conteúdo do post..."
            />
            <p className="text-xs text-gray-500 mt-1">MVP: texto simples. Depois podemos suportar Markdown.</p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publicar imediatamente
          </label>

          <LoadingButton
            onClick={handleCreate}
            loading={saving}
            disabled={!canSave}
            variant="primary"
            fullWidth
          >
            {published ? 'Publicar' : 'Salvar rascunho'}
          </LoadingButton>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Meus conteúdos</h2>
        {loading ? (
          <p className="text-sm text-gray-600">Carregando...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-600">Você ainda não publicou nenhum conteúdo.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 border border-gray-200 rounded-xl p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{p.excerpt}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {p.published ? 'Publicado' : 'Rascunho'} • slug: {p.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(p.id)}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyContents


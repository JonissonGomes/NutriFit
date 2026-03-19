import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogService } from '../../services/blog.service'
import type { BlogPost } from '../../services/blog.service'
import LoadingButton from '../../components/common/LoadingButton'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useConfirmDelete } from '../../hooks'

const MyContents = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteFlow = useConfirmDelete<BlogPost>()

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [pptxFile, setPptxFile] = useState<File | null>(null)

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

  useEffect(() => {
    // Cleanup previews anteriores
    imagePreviews.forEach((u) => URL.revokeObjectURL(u))
    const next = imageFiles.map((f) => URL.createObjectURL(f))
    setImagePreviews(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFiles])

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

      if ((imageFiles.length > 0 || pptxFile) && res.data?.id) {
        const filesToUpload: File[] = [...imageFiles, ...(pptxFile ? [pptxFile] : [])]
        const uploadRes = await blogService.uploadAttachments(res.data.id, filesToUpload)
        if (uploadRes.error) {
          showToast(uploadRes.error, 'error')
        } else {
          showToast('Anexos enviados com sucesso.', 'success')
        }
      }

      showToast(published ? 'Conteúdo publicado!' : 'Rascunho salvo!', 'success')
      setTitle('')
      setExcerpt('')
      setContent('')
      setPublished(true)
      setImageFiles([])
      setPptxFile(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!id) return
    setDeletingId(id)
    const res = await blogService.delete(id)
    if (res.error) {
      showToast(res.error, 'error')
      setDeletingId(null)
      return
    }
    showToast('Conteúdo excluído.', 'success')
    setDeletingId(null)
    await load()
  }

  const handleToggleVisibility = async (post: BlogPost, nextPublished: boolean) => {
    if (!post?.id) return
    setUpdatingVisibilityId(post.id)
    try {
      const res = await blogService.update(post.id, { published: nextPublished })
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      showToast(nextPublished ? 'Conteúdo visível no perfil.' : 'Conteúdo oculto do perfil.', 'success')
      await load()
    } finally {
      setUpdatingVisibilityId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Conteúdos</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Publique materiais para seus pacientes e visitantes do seu perfil.</p>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Novo conteúdo</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Ex.: Como montar um prato equilibrado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resumo</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Um resumo curto (20+ caracteres) que aparece na listagem."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Escreva o conteúdo do post..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MVP: texto simples. Depois podemos suportar Markdown.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anexos</label>
            <input
              type="file"
              multiple
              accept="image/*,.pptx"
              onChange={(e) => {
                const list = Array.from(e.target.files || [])
                const images = list.filter((f) => f.type.startsWith('image/'))
                const pptx = list.filter((f) => f.name.toLowerCase().endsWith('.pptx'))
                if (images.length > 5) {
                  showToast('Máximo de 5 imagens.', 'error')
                  return
                }
                if (pptx.length > 1) {
                  showToast('Máximo de 1 arquivo .pptx.', 'error')
                  return
                }
                setImageFiles(images)
                setPptxFile(pptx[0] || null)
              }}
              className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Você pode enviar até 5 imagens e 1 arquivo .pptx.</p>

            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Prévia ${idx + 1}`}
                    className="w-full h-28 object-cover rounded-lg border border-gray-200 dark:border-stone-700"
                  />
                ))}
              </div>
            )}

            {pptxFile && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Arquivo .pptx selecionado: {pptxFile.name}
              </p>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Público (visível para visitantes)
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

      <div className="bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Meus conteúdos</h2>
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Você ainda não publicou nenhum conteúdo.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 border border-gray-200 dark:border-stone-700 rounded-xl p-4">
                <div className="min-w-0">
                  {(p.featuredImage ||
                    p.attachments?.find((a) => a.type === 'image')?.url) && (
                    <img
                      src={p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url}
                      alt={p.title}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-stone-700 mb-3"
                    />
                  )}
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{p.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">{p.excerpt}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {p.published ? 'Publicado' : 'Rascunho'} • slug: {p.slug}
                  </p>
                </div>
              <div className="flex flex-col items-end gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={p.published}
                    disabled={updatingVisibilityId === p.id}
                    onChange={(e) => void handleToggleVisibility(p, e.target.checked)}
                  />
                  Visível no perfil
                </label>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/conteudos/meus/${p.slug}`}
                    className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                  >
                    Ler
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteFlow.open(p)}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteFlow.isOpen}
        onClose={deleteFlow.close}
        onConfirm={() =>
          void deleteFlow.confirm(async (target) => {
            await handleDelete(target.id)
          })
        }
        title="Excluir conteúdo"
        message={`Deseja realmente excluir "${deleteFlow.target?.title || 'este conteúdo'}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteFlow.loading || Boolean(deletingId)}
      />
    </div>
  )
}

export default MyContents


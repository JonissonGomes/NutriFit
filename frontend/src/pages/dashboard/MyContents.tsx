import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { blogService } from '../../services/blog.service'
import type { BlogPost } from '../../services/blog.service'
import LoadingButton from '../../components/common/LoadingButton'
import SwitchField from '../../components/common/SwitchField'
import FormModal from '../../components/common/FormModal'
import FileDropzone from '../../components/common/FileDropzone'
import { BlogPostDateMeta } from '../../components/blog/BlogPostDateMeta'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useConfirmDelete } from '../../hooks'
import { limitLength } from '../../utils/inputUtils'
import {
  BLOG_CONTENT_LIMITS,
  formatReadingTimeLabel,
  isBlogDraftValid,
} from '../../utils/blogContentLimits'

const emptyForm = () => ({
  title: '',
  excerpt: '',
  content: '',
  published: true,
  imageFiles: [] as File[],
  pptxFile: null as File | null,
})

const MyContents = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteFlow = useConfirmDelete<BlogPost>()

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [pptxFile, setPptxFile] = useState<File | null>(null)

  const isEditing = Boolean(editingPost)
  const canSave = useMemo(() => isBlogDraftValid(title, excerpt, content), [title, excerpt, content])
  const readingLabel = useMemo(
    () => formatReadingTimeLabel(title, excerpt, content),
    [title, excerpt, content]
  )

  const resetFormState = () => {
    const empty = emptyForm()
    setTitle(empty.title)
    setExcerpt(empty.excerpt)
    setContent(empty.content)
    setPublished(empty.published)
    setImageFiles(empty.imageFiles)
    setPptxFile(empty.pptxFile)
    setEditingPost(null)
  }

  const openCreateModal = () => {
    resetFormState()
    setFormModalOpen(true)
  }

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post)
    setTitle(post.title)
    setExcerpt(post.excerpt)
    setContent(post.content)
    setPublished(post.published)
    setImageFiles([])
    setPptxFile(null)
    setFormModalOpen(true)
  }

  const closeFormModal = () => {
    if (saving) return
    setFormModalOpen(false)
    resetFormState()
  }

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

  const uploadNewAttachments = async (postId: string) => {
    if (imageFiles.length === 0 && !pptxFile) return
    const filesToUpload: File[] = [...imageFiles, ...(pptxFile ? [pptxFile] : [])]
    const uploadRes = await blogService.uploadAttachments(postId, filesToUpload)
    if (uploadRes.error) {
      showToast(uploadRes.error, 'error')
    } else {
      showToast('Novos anexos enviados com sucesso.', 'success')
    }
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        published,
      }

      if (isEditing && editingPost) {
        const res = await blogService.update(editingPost.id, payload)
        if (res.error) {
          showToast(res.error, 'error')
          return
        }
        if (res.data?.id) {
          await uploadNewAttachments(res.data.id)
        }
        showToast('Conteúdo atualizado!', 'success')
      } else {
        const res = await blogService.create({
          ...payload,
          category: 'dicas',
        })
        if (res.error) {
          showToast(res.error, 'error')
          return
        }
        if (res.data?.id) {
          await uploadNewAttachments(res.data.id)
        }
        showToast(published ? 'Conteúdo publicado!' : 'Rascunho salvo!', 'success')
      }

      closeFormModal()
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

  const existingImages = editingPost?.attachments?.filter((a) => a.type === 'image') ?? []
  const existingPptx = editingPost?.attachments?.find((a) => a.type === 'pptx')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Conteúdos</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Publique materiais para seus pacientes e visitantes do seu perfil.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Criar novo conteúdo
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Meus conteúdos</h2>
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-600 dark:text-gray-300">Você ainda não publicou nenhum conteúdo.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-800"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro conteúdo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-col border border-gray-200 dark:border-stone-700 rounded-xl overflow-hidden">
                {(p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url) && (
                  <img
                    src={p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url}
                    alt={p.title}
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{p.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 mt-1 leading-relaxed">{p.excerpt}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {p.published ? 'Publicado' : 'Rascunho'}
                    </p>
                    <BlogPostDateMeta post={p} className="mt-1" />
                  </div>
                  <SwitchField
                    label="Visível no perfil"
                    checked={p.published}
                    disabled={updatingVisibilityId === p.id}
                    onChange={(checked) => void handleToggleVisibility(p, checked)}
                  />
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100 dark:border-stone-800">
                    <Link
                      to={`/conteudos/meus/${p.slug}`}
                      className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      Ler
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
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

      <FormModal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Editar conteúdo' : 'Novo conteúdo'}
        description={
          isEditing
            ? 'Atualize título, resumo e texto. Novos anexos serão adicionados aos existentes.'
            : 'Publique artigos, dicas e materiais para seu público.'
        }
        size="xl"
      >
        <div className="grid grid-cols-1 gap-4">
          {isEditing && editingPost ? (
            <BlogPostDateMeta post={editingPost} className="pb-1 border-b border-gray-100 dark:border-stone-800" />
          ) : null}

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <span className="text-xs text-gray-500">{title.length}/{BLOG_CONTENT_LIMITS.TITLE_MAX}</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(limitLength(e.target.value, BLOG_CONTENT_LIMITS.TITLE_MAX))}
              maxLength={BLOG_CONTENT_LIMITS.TITLE_MAX}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Ex.: Como montar um prato equilibrado"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resumo</label>
              <span className="text-xs text-gray-500">{excerpt.length}/{BLOG_CONTENT_LIMITS.EXCERPT_MAX}</span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(limitLength(e.target.value, BLOG_CONTENT_LIMITS.EXCERPT_MAX))}
              rows={4}
              maxLength={BLOG_CONTENT_LIMITS.EXCERPT_MAX}
              className="w-full min-h-[6.5rem] px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-stone-950 text-gray-900 dark:text-white leading-relaxed resize-y"
              placeholder="Resumo que aparece na listagem (até 4 linhas de leitura)."
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conteúdo</label>
              <span className="text-xs text-gray-500">{content.length}/{BLOG_CONTENT_LIMITS.CONTENT_MAX}</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(limitLength(e.target.value, BLOG_CONTENT_LIMITS.CONTENT_MAX))}
              rows={10}
              maxLength={BLOG_CONTENT_LIMITS.CONTENT_MAX}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-stone-950 text-gray-900 dark:text-white leading-relaxed resize-y"
              placeholder="Texto principal do material — conteúdo objetivo para leitura rápida."
            />
            <p className="text-xs text-gray-500 mt-1">{readingLabel}</p>
          </div>

          {isEditing && (existingImages.length > 0 || existingPptx) ? (
            <div className="rounded-lg border border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-950/50 p-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Anexos atuais</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                {existingImages.map((img) => (
                  <li key={img.url}>{img.filename || 'Imagem'}</li>
                ))}
                {existingPptx ? <li>{existingPptx.filename || 'Apresentação PPTX'}</li> : null}
              </ul>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEditing ? 'Adicionar imagens' : 'Imagens'}
            </label>
            <FileDropzone
              files={imageFiles}
              onChange={setImageFiles}
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              maxFiles={5}
              maxSizeMB={10}
              icon="image"
              acceptedFormatsLabel="JPG, PNG, GIF, WebP"
              hint={isEditing ? 'Novas imagens serão anexadas ao conteúdo' : 'Até 5 imagens para ilustrar o conteúdo'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEditing ? 'Adicionar apresentação (opcional)' : 'Apresentação (opcional)'}
            </label>
            <FileDropzone
              files={pptxFile ? [pptxFile] : []}
              onChange={(files) => setPptxFile(files[0] || null)}
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              multiple={false}
              maxFiles={1}
              maxSizeMB={20}
              icon="file"
              acceptedFormatsLabel="PPTX"
              showPreviews={false}
              hint="1 arquivo PowerPoint para complementar o material"
            />
          </div>

          <SwitchField
            label="Público (visível para visitantes)"
            checked={published}
            onChange={setPublished}
          />

          <LoadingButton
            onClick={() => void handleSave()}
            loading={saving}
            disabled={!canSave}
            variant="primary"
            fullWidth
          >
            {isEditing ? 'Salvar alterações' : published ? 'Publicar' : 'Salvar rascunho'}
          </LoadingButton>
        </div>
      </FormModal>

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

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { blogService } from '../../services/blog.service'
import type { BlogPost } from '../../services/blog.service'
import LoadingButton from '../../components/common/LoadingButton'
import SwitchField from '../../components/common/SwitchField'
import FormModal from '../../components/common/FormModal'
import FileDropzone from '../../components/common/FileDropzone'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useConfirmDelete } from '../../hooks'

const resetForm = () => ({
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
  const [showCreateModal, setShowCreateModal] = useState(false)
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

  const canSave = useMemo(() => title.trim().length >= 5 && excerpt.trim().length >= 20 && content.trim().length >= 50, [title, excerpt, content])

  const closeCreateModal = () => {
    setShowCreateModal(false)
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

  const handleCreate = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await blogService.create({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
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
      const empty = resetForm()
      setTitle(empty.title)
      setExcerpt(empty.excerpt)
      setContent(empty.content)
      setPublished(empty.published)
      setImageFiles(empty.imageFiles)
      setPptxFile(empty.pptxFile)
      closeCreateModal()
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Conteúdos</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Publique materiais para seus pacientes e visitantes do seu perfil.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
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
              onClick={() => setShowCreateModal(true)}
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
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">{p.excerpt}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {p.published ? 'Publicado' : 'Rascunho'}
                    </p>
                  </div>
                  <SwitchField
                    label="Visível no perfil"
                    checked={p.published}
                    disabled={updatingVisibilityId === p.id}
                    onChange={(checked) => void handleToggleVisibility(p, checked)}
                  />
                  <div className="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-stone-800">
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

      <FormModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Novo conteúdo"
        description="Publique artigos, dicas e materiais para seu público."
        size="xl"
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Ex.: Como montar um prato equilibrado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resumo</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Um resumo curto (20+ caracteres) que aparece na listagem."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-stone-950 text-gray-900 dark:text-white"
              placeholder="Escreva o conteúdo do post..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagens</label>
            <FileDropzone
              files={imageFiles}
              onChange={setImageFiles}
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              maxFiles={5}
              maxSizeMB={10}
              icon="image"
              acceptedFormatsLabel="JPG, PNG, GIF, WebP"
              hint="Até 5 imagens para ilustrar o conteúdo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Apresentação (opcional)</label>
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
            onClick={handleCreate}
            loading={saving}
            disabled={!canSave}
            variant="primary"
            fullWidth
          >
            {published ? 'Publicar' : 'Salvar rascunho'}
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

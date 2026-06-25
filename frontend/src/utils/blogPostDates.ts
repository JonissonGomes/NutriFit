import type { BlogPost } from '../services/blog.service'

export function formatBlogShortDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getBlogPostDateLabels(post: Pick<BlogPost, 'createdAt' | 'updatedAt' | 'publishedAt' | 'published'>) {
  const primary =
    post.published && post.publishedAt
      ? `Publicado em ${formatBlogShortDate(post.publishedAt)}`
      : `Criado em ${formatBlogShortDate(post.createdAt)}`

  const wasEdited =
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 60_000

  return {
    primary,
    edited: wasEdited ? `Atualizado em ${formatBlogShortDate(post.updatedAt)}` : null,
  }
}

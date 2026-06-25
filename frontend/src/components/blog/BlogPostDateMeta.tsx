import { getBlogPostDateLabels } from '../../utils/blogPostDates'
import type { BlogPost } from '../../services/blog.service'

export function BlogPostDateMeta({
  post,
  className = '',
}: {
  post: Pick<BlogPost, 'createdAt' | 'updatedAt' | 'publishedAt' | 'published'>
  className?: string
}) {
  const { primary, edited } = getBlogPostDateLabels(post)

  return (
    <div className={`text-[11px] leading-snug text-gray-400 dark:text-gray-500 space-y-0.5 ${className}`}>
      <p>{primary}</p>
      {edited ? <p>{edited}</p> : null}
    </div>
  )
}

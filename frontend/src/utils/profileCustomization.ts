import type { ProfileCustomization, ProfileLayoutType, PublicProfile } from '../services/profile.service'
import { DEFAULT_CUSTOMIZATION } from '../services/profile.service'

export type ResolvedCustomization = ProfileCustomization & {
  showContents: boolean
  showRecipes: boolean
  showBio: boolean
  showEducation: boolean
  showExperience: boolean
  showAwards: boolean
}

/** Mescla customização salva com defaults (compatível com perfis antigos). */
export function mergeCustomization(raw?: ProfileCustomization | null): ResolvedCustomization {
  const base = { ...DEFAULT_CUSTOMIZATION, ...raw }
  return {
    ...base,
    showContents: raw?.showContents ?? true,
    showRecipes: raw?.showRecipes ?? true,
    showBio: raw?.showBio ?? true,
    showEducation: raw?.showEducation ?? true,
    showExperience: raw?.showExperience ?? true,
    showAwards: raw?.showAwards ?? true,
    show3DModels: raw?.show3DModels ?? false,
    pageStyle: raw?.pageStyle ?? 'blocks',
  }
}

export function isEnabled(flag: boolean | undefined): boolean {
  return flag !== false
}

export function hasContactInfo(profile: PublicProfile): boolean {
  const email = profile.contact?.email || profile.email
  const phone = profile.contact?.phone || profile.phone
  const website = profile.contact?.website || profile.website
  return Boolean(
    email?.trim() ||
      phone?.trim() ||
      website?.trim() ||
      profile.social?.instagram?.url ||
      profile.social?.facebook?.url
  )
}

export function gridColumnsClass(columns: number): string {
  switch (columns) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-1 sm:grid-cols-2'
    case 4:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    case 3:
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  }
}

export function contentLayoutClass(
  layout: ProfileLayoutType,
  itemCount: number,
  gridColumns: number = DEFAULT_CUSTOMIZATION.gridColumns
): string {
  if (layout === 'carousel' && itemCount > 1) {
    return 'flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth'
  }
  if (layout === 'masonry' && itemCount > 1) {
    return 'columns-1 sm:columns-2 lg:columns-3 gap-4'
  }
  if (layout === 'featured' && itemCount > 1) {
    return `grid gap-4 ${gridColumnsClass(Math.min(gridColumns, 3))}`
  }
  return `grid gap-4 ${gridColumnsClass(gridColumns)}`
}

export function contentItemClass(layout: ProfileLayoutType, itemCount: number, featured = false): string {
  if (layout === 'carousel' && itemCount > 1) {
    return 'snap-start shrink-0 w-[85%] sm:w-[45%] lg:w-[32%]'
  }
  if (layout === 'masonry' && itemCount > 1) {
    return 'break-inside-avoid mb-4'
  }
  if (layout === 'featured' && featured) {
    return 'sm:col-span-2 lg:row-span-1'
  }
  return ''
}

export function projectCardClasses(style: 'simple' | 'detailed' | 'overlay' = 'simple') {
  switch (style) {
    case 'overlay':
      return {
        wrapper: 'relative rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow group',
        image: 'w-full h-36 object-cover',
        body: 'absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/75 via-black/30 to-transparent text-white',
        title: 'font-semibold line-clamp-2',
        excerpt: 'text-xs text-white/90 mt-1 line-clamp-2',
      }
    case 'detailed':
      return {
        wrapper: 'bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow',
        image: 'w-full h-32 object-cover',
        body: 'p-4',
        title: 'font-semibold text-gray-900 line-clamp-2',
        excerpt: 'text-sm text-gray-600 mt-2 line-clamp-3',
      }
    default:
      return {
        wrapper: 'bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow',
        image: 'w-full h-28 object-cover',
        body: 'p-3',
        title: 'font-semibold text-gray-900 line-clamp-2',
        excerpt: 'text-sm text-gray-600 mt-1 line-clamp-2',
      }
  }
}

export const PROFILE_BLOCK_OPTIONS: Array<{
  key: keyof ResolvedCustomization
  label: string
  description: string
  optional: boolean
}> = [
  { key: 'showBio', label: 'Biografia', description: 'Texto de apresentação no cabeçalho do perfil', optional: true },
  { key: 'showStats', label: 'Indicadores', description: 'Avaliação média e quantidade de pacientes', optional: true },
  { key: 'showServices', label: 'Áreas de atuação', description: 'Tags com especialidades e áreas de atuação', optional: true },
  { key: 'showExperience', label: 'Experiência', description: 'Tempo de atuação e experiência profissional', optional: true },
  { key: 'showEducation', label: 'Formação acadêmica', description: 'Graduação, pós e cursos relevantes', optional: true },
  { key: 'showAwards', label: 'Prêmios e reconhecimentos', description: 'Distinções e certificações destacadas', optional: true },
  { key: 'showContents', label: 'Conteúdos', description: 'Artigos e materiais publicados', optional: true },
  { key: 'showRecipes', label: 'Receitas', description: 'Receitas compartilhadas publicamente', optional: true },
  { key: 'showReviews', label: 'Avaliações', description: 'Depoimentos de pacientes', optional: true },
  { key: 'showContact', label: 'Contato e redes', description: 'E-mail, telefone, site e redes sociais', optional: true },
]

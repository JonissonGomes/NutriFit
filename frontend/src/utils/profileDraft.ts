import type { ProfileCustomization, PublicProfile } from '../services/profile.service'
import {
  HERO_STYLE_OPTIONS,
  LAYOUT_OPTIONS,
  PAGE_STYLE_OPTIONS,
  PROJECT_CARD_STYLE_OPTIONS,
  BACKGROUND_STYLE_OPTIONS,
  GRID_COLUMN_OPTIONS,
} from '../services/profile.service'
import {
  sanitizeEducations,
  sanitizeRecognitions,
  sanitizeWorkExperiences,
  type EducationEntry,
  type RecognitionEntry,
  type WorkExperienceEntry,
} from '../utils/profileCareer'
import { mergeCustomization, PROFILE_BLOCK_OPTIONS, type ResolvedCustomization } from './profileCustomization'
import { unmask } from './inputUtils'

export type ProfileDraftForm = {
  displayName: string
  username: string
  bio: string
  location: string
  specialty: string
  experience: string
  website: string
  phone: string
  instagram: string
  instagramUrl: string
  facebook: string
  facebookUrl: string
  specialties: string[]
}

export type ProfileDraftCareer = {
  workExperiences: WorkExperienceEntry[]
  educations: EducationEntry[]
  recognitions: RecognitionEntry[]
}

export type ProfileDraftSnapshot = {
  form: ProfileDraftForm
  career: ProfileDraftCareer
  customization: ResolvedCustomization
}

const FORM_LABELS: Record<keyof ProfileDraftForm, string> = {
  displayName: 'Nome de exibição',
  username: 'Nome de usuário',
  bio: 'Biografia',
  location: 'Localização',
  specialty: 'Especialidade principal',
  experience: 'Resumo de experiência',
  website: 'Website',
  phone: 'Telefone',
  instagram: 'Instagram',
  instagramUrl: 'Link do Instagram',
  facebook: 'Facebook',
  facebookUrl: 'Link do Facebook',
  specialties: 'Áreas de atuação',
}

const CUSTOMIZATION_LABELS: Partial<Record<keyof ResolvedCustomization, string>> = {
  pageStyle: 'Estilo da página',
  layout: 'Layout de conteúdos',
  gridColumns: 'Colunas da grade',
  primaryColor: 'Cor primária',
  backgroundStyle: 'Fundo da página',
  heroStyle: 'Estilo do cabeçalho',
  projectCardStyle: 'Estilo dos cards',
}

function normalizeForm(form: ProfileDraftForm): ProfileDraftForm {
  return {
    displayName: form.displayName.trim(),
    username: form.username.toLowerCase().trim(),
    bio: form.bio.trim(),
    location: form.location.trim(),
    specialty: form.specialty.trim(),
    experience: form.experience.trim(),
    website: form.website.trim(),
    phone: form.phone ? unmask(form.phone) : '',
    instagram: form.instagram.trim(),
    instagramUrl: form.instagramUrl.trim(),
    facebook: form.facebook.trim(),
    facebookUrl: form.facebookUrl.trim(),
    specialties: [...form.specialties].map((s) => s.trim()).filter(Boolean).sort(),
  }
}

function normalizeCareer(career: ProfileDraftCareer): ProfileDraftCareer {
  return {
    workExperiences: sanitizeWorkExperiences(career.workExperiences),
    educations: sanitizeEducations(career.educations),
    recognitions: sanitizeRecognitions(career.recognitions),
  }
}

export function buildProfileSnapshot(
  formData: ProfileDraftForm,
  career: ProfileDraftCareer,
  customization?: ProfileCustomization | null
): ProfileDraftSnapshot {
  return {
    form: normalizeForm(formData),
    career: normalizeCareer(career),
    customization: mergeCustomization(customization),
  }
}

export function buildProfileSnapshotFromProfile(profile: PublicProfile): ProfileDraftSnapshot {
  const form: ProfileDraftForm = {
    displayName: profile.displayName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    location: profile.location?.address?.city
      ? `${profile.location.address.city}, ${profile.location.address.state || ''}`.replace(/,\s*$/, '')
      : '',
    specialty: profile.specialty || '',
    experience: profile.experience || '',
    website: profile.website || '',
    phone: profile.phone || '',
    instagram: profile.social?.instagram?.username || '',
    instagramUrl: profile.social?.instagram?.url || '',
    facebook: profile.social?.facebook?.username || '',
    facebookUrl: profile.social?.facebook?.url || '',
    specialties: profile.specialties || [],
  }

  return buildProfileSnapshot(
    form,
    {
      workExperiences: profile.workExperiences || [],
      educations: profile.educations || [],
      recognitions: profile.recognitions || [],
    },
    profile.customization ?? undefined
  )
}

function stableSerialize(snapshot: ProfileDraftSnapshot): string {
  return JSON.stringify(snapshot)
}

export function areProfileSnapshotsEqual(a: ProfileDraftSnapshot, b: ProfileDraftSnapshot): boolean {
  return stableSerialize(a) === stableSerialize(b)
}

function optionLabel(
  options: ReadonlyArray<{ value: string | number; label: string }>,
  value: string | number | undefined
): string {
  const found = options.find((o) => String(o.value) === String(value))
  return found?.label ?? String(value ?? '')
}

function describeCustomizationChange(
  key: keyof ResolvedCustomization,
  before: ResolvedCustomization,
  after: ResolvedCustomization
): string | null {
  const prev = before[key]
  const next = after[key]
  if (prev === next) return null

  const block = PROFILE_BLOCK_OPTIONS.find((o) => o.key === key)
  if (block) {
    const prevLabel = prev === false ? 'oculto' : 'visível'
    const nextLabel = next === false ? 'oculto' : 'visível'
    return `${block.label}: ${prevLabel} → ${nextLabel}`
  }

  const label = CUSTOMIZATION_LABELS[key] ?? String(key)

  if (key === 'pageStyle') {
    return `${label}: ${optionLabel(PAGE_STYLE_OPTIONS, before.pageStyle)} → ${optionLabel(PAGE_STYLE_OPTIONS, after.pageStyle)}`
  }
  if (key === 'layout') {
    return `${label}: ${optionLabel(LAYOUT_OPTIONS, before.layout)} → ${optionLabel(LAYOUT_OPTIONS, after.layout)}`
  }
  if (key === 'gridColumns') {
    return `${label}: ${optionLabel(GRID_COLUMN_OPTIONS, String(before.gridColumns))} → ${optionLabel(GRID_COLUMN_OPTIONS, String(after.gridColumns))}`
  }
  if (key === 'heroStyle') {
    return `${label}: ${optionLabel(HERO_STYLE_OPTIONS, before.heroStyle)} → ${optionLabel(HERO_STYLE_OPTIONS, after.heroStyle)}`
  }
  if (key === 'backgroundStyle') {
    return `${label}: ${optionLabel(BACKGROUND_STYLE_OPTIONS, before.backgroundStyle)} → ${optionLabel(BACKGROUND_STYLE_OPTIONS, after.backgroundStyle)}`
  }
  if (key === 'projectCardStyle') {
    return `${label}: ${optionLabel(PROJECT_CARD_STYLE_OPTIONS, before.projectCardStyle)} → ${optionLabel(PROJECT_CARD_STYLE_OPTIONS, after.projectCardStyle)}`
  }
  if (key === 'primaryColor') {
    return `${label}: ${before.primaryColor || 'padrão'} → ${after.primaryColor || 'padrão'}`
  }

  return `${label} alterado`
}

export function getProfileChangeSummaries(
  saved: ProfileDraftSnapshot,
  current: ProfileDraftSnapshot
): string[] {
  const changes: string[] = []

  ;(Object.keys(FORM_LABELS) as (keyof ProfileDraftForm)[]).forEach((key) => {
    const prev = saved.form[key]
    const next = current.form[key]
    if (Array.isArray(prev) && Array.isArray(next)) {
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        changes.push(FORM_LABELS[key])
      }
      return
    }
    if (prev !== next) {
      changes.push(FORM_LABELS[key])
    }
  })

  if (JSON.stringify(saved.career) !== JSON.stringify(current.career)) {
    const parts: string[] = []
    if (JSON.stringify(saved.career.workExperiences) !== JSON.stringify(current.career.workExperiences)) {
      parts.push('experiências')
    }
    if (JSON.stringify(saved.career.educations) !== JSON.stringify(current.career.educations)) {
      parts.push('formações')
    }
    if (JSON.stringify(saved.career.recognitions) !== JSON.stringify(current.career.recognitions)) {
      parts.push('reconhecimentos')
    }
    changes.push(`Trajetória profissional (${parts.join(', ') || 'itens'})`)
  }

  const customizationKeys = new Set([
    ...Object.keys(CUSTOMIZATION_LABELS),
    ...PROFILE_BLOCK_OPTIONS.map((o) => o.key),
  ]) as Set<keyof ResolvedCustomization>

  customizationKeys.forEach((key) => {
    const summary = describeCustomizationChange(key, saved.customization, current.customization)
    if (summary) changes.push(summary)
  })

  return changes
}

export const EMPTY_CAREER: ProfileDraftCareer = {
  workExperiences: [],
  educations: [],
  recognitions: [],
}

import type {
  PublicProfile,
  WorkExperienceEntry,
  EducationEntry,
  RecognitionEntry,
} from '../services/profile.service'

export type { WorkExperienceEntry, EducationEntry, RecognitionEntry }

export interface ResolvedCareer {
  workExperiences: WorkExperienceEntry[]
  educations: EducationEntry[]
  recognitions: RecognitionEntry[]
}

export const MAX_CAREER_ENTRIES = 20

export const CAREER_LIMITS = {
  TITLE: 120,
  ORGANIZATION: 120,
  DEGREE: 120,
  INSTITUTION: 120,
  YEAR: 4,
  DESCRIPTION: 500,
  ISSUER: 120,
} as const

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createWorkExperience(): WorkExperienceEntry {
  return { id: newId('work'), title: '', organization: '' }
}

export function createEducation(): EducationEntry {
  return { id: newId('edu'), degree: '', institution: '' }
}

export function createRecognition(): RecognitionEntry {
  return { id: newId('rec'), title: '', issuer: '' }
}

export function formatCareerPeriod(start?: string, end?: string): string {
  const s = start?.trim()
  const e = end?.trim()
  if (s && e) return `${s} – ${e}`
  if (s && !e) return `${s} – Atual`
  if (!s && e) return e
  return ''
}

export function formatRecognitionYear(year?: string): string {
  const y = year?.trim()
  return y || ''
}

/** Mescla dados estruturados com campos legados em texto livre. */
export function resolveCareer(profile: Pick<
  PublicProfile,
  'workExperiences' | 'educations' | 'recognitions' | 'experience' | 'education' | 'awards'
>): ResolvedCareer {
  if (profile.workExperiences?.length) {
    // ok
  }
  const workExperiences: WorkExperienceEntry[] = profile.workExperiences?.length
    ? profile.workExperiences.map((e) => ({ ...e, id: e.id || newId('work') }))
    : profile.experience?.trim()
      ? [{ id: 'legacy-experience', title: profile.experience.trim(), organization: '' }]
      : []

  const educations: EducationEntry[] = profile.educations?.length
    ? profile.educations.map((e) => ({ ...e, id: e.id || newId('edu') }))
    : profile.education?.trim()
      ? [{ id: 'legacy-education', degree: profile.education.trim(), institution: '' }]
      : []

  const recognitions: RecognitionEntry[] = profile.recognitions?.length
    ? profile.recognitions.map((e) => ({ ...e, id: e.id || newId('rec') }))
    : profile.awards?.trim()
      ? profile.awards
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, i) => ({ id: `legacy-recognition-${i}`, title: line }))
      : []

  return { workExperiences, educations, recognitions }
}

export function hasWorkExperiences(career: ResolvedCareer): boolean {
  return career.workExperiences.some((e) => Boolean(e.title?.trim() || e.organization?.trim()))
}

export function hasEducations(career: ResolvedCareer): boolean {
  return career.educations.some((e) => Boolean(e.degree?.trim() || e.institution?.trim()))
}

export function hasRecognitions(career: ResolvedCareer): boolean {
  return career.recognitions.some((e) => Boolean(e.title?.trim()))
}

export function sanitizeCareerEntries<T extends { id: string }>(
  entries: T[],
  isValid: (entry: T) => boolean
): T[] {
  return entries
    .filter(isValid)
    .slice(0, MAX_CAREER_ENTRIES)
    .map((entry) => ({ ...entry, id: entry.id || newId('item') }))
}

export function sanitizeWorkExperiences(entries: WorkExperienceEntry[]): WorkExperienceEntry[] {
  return sanitizeCareerEntries(entries, (e) => Boolean(e.title?.trim() || e.organization?.trim()))
}

export function sanitizeEducations(entries: EducationEntry[]): EducationEntry[] {
  return sanitizeCareerEntries(entries, (e) => Boolean(e.degree?.trim() || e.institution?.trim()))
}

export function sanitizeRecognitions(entries: RecognitionEntry[]): RecognitionEntry[] {
  return sanitizeCareerEntries(entries, (e) => Boolean(e.title?.trim()))
}

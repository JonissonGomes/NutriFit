// ============================================
// TIPOS BASE DA API
// ============================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: string
  code?: string
  details?: Record<string, string>
}

// ============================================
// AUTENTICAÇÃO
// ============================================

export type UserRole = 'nutricionista' | 'medico' | 'paciente' | 'admin' | 'super_admin'

export interface ProfessionalRegistration {
  type: 'CRN' | 'CRM'
  number: string
}

export interface User {
  id: string // Token opaco (não é o ID real do banco)
  email: string
  name: string
  role: UserRole
  type?: UserRole // Alias para role (compatibilidade)
  avatar?: string
  professionalRegistration?: ProfessionalRegistration
  storageUsedPercent: number // Percentual de uso ao invés de valores exatos
  plan: 'free' | 'starter' | 'professional' | 'business'
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthPayload {
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
  type?: UserRole // Opcional: login único; redirecionamento por role retornado
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: UserRole
  professionalRegistration?: ProfessionalRegistration // Obrigatório para nutricionista e medico
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// ============================================
// PLANOS ALIMENTARES
// ============================================

export type MealPlanStatus = 'draft' | 'active' | 'paused' | 'completed'
export type MealPlanCategory = 'emagrecimento' | 'ganho-massa' | 'performance' | 'saude' | 'gestante' | 'infantil' | 'vegetariano' | 'vegano' | 'intolerancias'
export type MealType = 'cafe-manha' | 'lanche-manha' | 'almoco' | 'lanche-tarde' | 'jantar' | 'ceia'

export interface MacroNutrients {
  calories: number
  proteins: number // gramas
  carbohydrates: number // gramas
  fats: number // gramas
  fiber?: number // gramas
}

export interface FoodItem {
  foodId: string
  name: string
  quantity: number
  unit: string // "g", "ml", "un", etc
  macros?: MacroNutrients
  substitutes?: string[] // IDs de alimentos substitutos
}

export interface Meal {
  type: MealType
  time: string // HH:MM
  foods: FoodItem[]
  macros?: MacroNutrients
  notes?: string
}

export interface ClinicalPatientSnapshot {
  name?: string
  email?: string
  phone?: string
  age?: number
  sex?: string
  height?: number
  weight?: number
}

export interface ClinicalEnergySnapshot {
  objective?: string
  activityLevel?: string
  activityFactor?: number
  tmb?: number
  get?: number
}

export interface ClinicalStrategySnapshot {
  calories?: number
  proteins?: number
  carbohydrates?: number
  fats?: number
  mealsPerDay?: number
}

export interface ClinicalSnapshot {
  patient?: ClinicalPatientSnapshot
  energy?: ClinicalEnergySnapshot
  strategy?: ClinicalStrategySnapshot
  restrictions?: string[]
  preferences?: string[]
  anamnesisSummary?: string
  labExamSummary?: string
  bmi?: number
}

export interface MealPlan {
  id: string
  nutritionistId: string
  patientId?: string
  title: string
  description?: string
  category: MealPlanCategory
  status: MealPlanStatus
  startDate?: string
  endDate?: string
  meals: Meal[]
  totalMacros?: MacroNutrients
  restrictions?: string[]
  clinicalSnapshot?: ClinicalSnapshot
  notes?: string
  isTemplate: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMealPlanRequest {
  patientId?: string
  title: string
  description?: string
  category: MealPlanCategory
  status?: MealPlanStatus
  startDate?: string
  endDate?: string
  meals?: Meal[]
  restrictions?: string[]
  clinicalSnapshot?: ClinicalSnapshot
  notes?: string
  isTemplate?: boolean
}

export interface UpdateMealPlanRequest extends Partial<CreateMealPlanRequest> {}

export interface MealPlanFilters {
  status?: MealPlanStatus
  category?: MealPlanCategory
  search?: string
  page?: number
  limit?: number
}

// ============================================
// IMAGENS
// ============================================

export type ImageStatus = 'processing' | 'ready' | 'failed'

export interface ImageUrls {
  original: string
  compressed: string
  thumbnail: string
  medium: string
}

export interface Image {
  id: string
  projectId: string
  userId: string
  cloudinaryId: string
  publicId: string
  url: string // URL direta para exibição
  urls: ImageUrls
  filename: string
  title?: string // Título alternativo para a imagem
  mimeType: string
  size: {
    original: number
    compressed: number
  }
  dimensions: {
    width: number
    height: number
  }
  caption?: string
  position: number
  status: ImageStatus
  createdAt: string
  updatedAt: string
}

export interface UploadImageRequest {
  projectId: string
  file: File
  caption?: string
}

// ============================================
// MENSAGENS E CONVERSAS
// ============================================

export interface Conversation {
  id: string
  nutritionistId: string
  patientId: string
  lastMessage?: Message
  lastMessageAt: string
  unreadCount: {
    nutritionist: number
    patient: number
  }
  createdAt: string
  updatedAt: string
}

export interface MessageAttachment {
  type: 'image' | 'file'
  url: string
  filename: string
  size: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  text: string
  attachments?: MessageAttachment[]
  read: boolean
  readAt?: string
  createdAt: string
}

export interface SendMessageRequest {
  receiverId: string
  text: string
  attachments?: File[]
}

// ============================================
// SERVIÇOS
// ============================================

export type ServiceCategory = 'emagrecimento' | 'ganho-massa' | 'performance' | 'saude' | 'gestante' | 'infantil' | 'vegetariano' | 'vegano' | 'intolerancias' | 'consultoria'

export interface Service {
  id: string
  userId: string
  name: string
  description: string
  price: number
  duration: string
  category: ServiceCategory
  active: boolean
  features: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateServiceRequest {
  name: string
  description: string
  price: number
  duration: string
  category: ServiceCategory
  features: string[]
}

// ============================================
// EVENTOS/AGENDA
// ============================================

export type EventType = 'consulta' | 'retorno' | 'avaliacao' | 'consultoria' | 'outro'
export type EventStatus = 'confirmado' | 'pendente' | 'concluido' | 'cancelado'
export type EventLocation = 'consultorio' | 'online' | 'domicilio' | 'outro'

export interface Event {
  id: string
  userId: string
  patientId?: string
  mealPlanId?: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  location: EventLocation
  locationAddress?: string
  type: EventType
  status: EventStatus
  reminder?: {
    enabled: boolean
    minutesBefore: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateEventRequest {
  patientId?: string
  mealPlanId?: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  location: EventLocation
  locationAddress?: string
  type: EventType
  reminder?: {
    enabled: boolean
    minutesBefore: number
  }
}

// ============================================
// PERFIL PÚBLICO
// ============================================

export interface SocialLinks {
  instagram?: { username: string; url: string }
  facebook?: { username: string; url: string }
  linkedin?: { username: string; url: string }
  website?: string
}

export interface PublicProfile {
  id: string
  userId: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  coverImage?: string
  location?: {
    address: {
      street?: string
      city: string
      state: string
      neighborhood?: string
      postalCode?: string
      country: string
    }
    coordinates?: {
      latitude: number
      longitude: number
    }
    serviceRadius?: number
    serviceAreas?: string[]
  }
  specialty?: string
  experience?: string
  cau?: string
  specialties?: string[]
  education?: string
  awards?: string
  email?: string
  phone?: string
  social?: SocialLinks
  contact?: {
    email?: string
    phone?: string
    website?: string
  }
  verification?: {
    verified: boolean
    cauVerified: boolean
    verifiedAt?: string
  }
  ratings?: {
    average: number
    total: number
    distribution: Record<string, number>
  }
  boost?: {
    active: boolean
    level: 'basic' | 'premium' | 'highlight'
    endDate?: string
    priority: number
  }
  projectsCount?: number
  viewsCount?: number
  createdAt: string
  updatedAt: string
}

export interface UpdatePublicProfileRequest {
  displayName?: string
  bio?: string
  location?: PublicProfile['location']
  specialty?: string
  experience?: string
  cau?: string
  specialties?: string[]
  education?: string
  awards?: string
  email?: string
  phone?: string
  social?: SocialLinks
}

// ============================================
// FAVORITOS
// ============================================

export interface Favorite {
  id: string
  patientId: string
  nutritionistId: string
  nutritionist?: PublicProfile
  createdAt: string
}

// ============================================
// CONFIGURAÇÕES
// ============================================

export interface UserSettings {
  id: string
  userId: string
  notifications: {
    email: boolean
    mealPlanUpdates: boolean
    patientMessages: boolean
    marketingEmails: boolean
  }
  preferences: {
    language: string
    theme: 'light' | 'dark'
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showEmail: boolean
    showPhone: boolean
  }
  twoFactorAuth: {
    enabled: boolean
  }
  updatedAt: string
}

export interface UpdateSettingsRequest {
  notifications?: Partial<UserSettings['notifications']>
  preferences?: Partial<UserSettings['preferences']>
  privacy?: Partial<UserSettings['privacy']>
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStats {
  totalViews: number
  totalMealPlans: number
  totalPatients: number
  monthlyRevenue: number
  viewsChange: number
  mealPlansChange: number
  patientsChange: number
  revenueChange: number
}

export interface RecentMealPlan {
  id: string
  title: string
  status: MealPlanStatus
  progress?: number
  lastUpdate?: string
  patientName?: string
  updatedAt?: string
}

export interface UpcomingEvent {
  id: string
  title: string
  date: string
  time: string
  type: EventType | string
  clientName?: string
  location?: EventLocation | string
}

// ============================================
// REVIEWS
// ============================================

export interface Review {
  id: string
  nutritionistId: string
  patientId: string
  mealPlanId?: string
  rating: number
  comment: string
  verified: boolean
  helpful: number
  createdAt: string
  updatedAt: string
  patient?: {
    name: string
    avatar?: string
  }
}

export interface CreateReviewRequest {
  nutritionistId: string
  mealPlanId?: string
  rating: number
  comment: string
}

// ============================================
// BUSCA E EXPLORAÇÃO
// ============================================

export interface SearchFilters {
  query?: string
  category?: MealPlanCategory
  location?: string
  minRating?: number
  maxPrice?: number
  radius?: number
  lat?: number
  lng?: number
  page?: number
  limit?: number
}

export interface NutritionistSearchResult {
  profile: PublicProfile
  distance?: number
  mealPlansCount: number
  reviewsCount: number
  isBoosted: boolean
}

// ============================================
// ANAMNESE
// ============================================

export type AnamnesisStatus = 'draft' | 'sent' | 'completed' | 'expired'
export type QuestionType = 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'radio' | 'checkbox' | 'date' | 'boolean'

export interface Question {
  id: string
  type: QuestionType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  default?: any
  validation?: string
  order: number
}

export interface FormTemplate {
  id: string
  name: string
  description?: string
  category?: string
  questions: Question[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AnamnesisAnswer {
  questionId: string
  value: any
}

export interface Anamnesis {
  id: string
  nutritionistId: string
  patientId: string
  templateId?: string
  formTemplate?: FormTemplate
  answers: AnamnesisAnswer[]
  status: AnamnesisStatus
  aiSummary?: string
  sentAt?: string
  completedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// DIÁRIO ALIMENTAR
// ============================================

export type MealPhotoStatus = 'processing' | 'ready' | 'failed'
export type AIAnalysisClassification = 'aligned' | 'attention' | 'off-plan'

export interface AIAnalysis {
  classification: AIAnalysisClassification
  foods: string[]
  estimatedMacros?: MacroNutrients
  calories: number
  confidence: number
  notes?: string
  analyzedAt: string
}

export interface FoodDiaryEntry {
  id: string
  patientId: string
  mealPlanId?: string
  date: string
  mealType: MealType
  photoUrl?: string
  description?: string
  audioUrl?: string
  aiAnalysis?: AIAnalysis
  nutritionistComment?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// COMPATIBILIDADE (migração de ArckDesign → NuFit)
// ============================================

// Algumas telas ainda usam o vocabulário antigo (Project/Arquitetura).
// Mantemos tipos legados enquanto a migração é finalizada.

export type ProjectAccessType = 'public' | 'private' | 'password'
export type ProjectStatus = 'rascunho' | 'em-andamento' | 'revisao' | 'aprovado' | 'concluido'

export type ProjectLocation =
  | string
  | {
      city?: string
      state?: string
      address?: string
    }

export interface ProjectSpecs {
  area?: string
  rooms?: string
  budget?: string
  style?: string
}

export interface Project {
  id: string
  userId: string
  title: string
  description?: string
  category?: string
  coverImage?: string
  views?: number
  filesCount?: number
  projectStatus?: ProjectStatus
  accessType?: ProjectAccessType
  password?: string
  location?: ProjectLocation
  tags?: string[]
  specs?: ProjectSpecs
  createdAt: string
  updatedAt: string
  // Alguns componentes esperam isso no card/lista:
  architect?: {
    id: string
    name: string
    avatar?: string
    username?: string
    rating?: number
    projectsCount?: number
  }
  clientId?: string
}

export interface CreateProjectRequest {
  title: string
  description?: string
  category?: string
  accessType?: ProjectAccessType
  password?: string
  location?: ProjectLocation
  tags?: string[]
  specs?: ProjectSpecs
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  coverImage?: string
  projectStatus?: ProjectStatus
}

export interface ProjectFilters {
  status?: ProjectStatus
  category?: string
  accessType?: ProjectAccessType
  search?: string
  page?: number
  limit?: number
}

// ============================================
// AVALIAÇÃO ANTROPOMÉTRICA
// ============================================

export interface Circumferences {
  neck?: number // cm
  chest?: number // cm
  waist?: number // cm
  hip?: number // cm
  thigh?: number // cm
  arm?: number // cm
}

export interface Body3DReport {
  bodyFatPercent: number
  muscleMass: number // kg
  fatMass: number // kg
  circumferences?: Circumferences
  metabolicRisk: string // "baixo", "medio", "alto"
  bmi: number
  confidence: number
  generatedAt: string
}

export interface Anthropometric {
  id: string
  patientId: string
  date: string
  weight: number // kg
  height: number // cm
  bodyFat?: number // percentual
  muscleMass?: number // kg
  bmi?: number
  circumferences?: Circumferences
  photos?: string[]
  body3dReport?: Body3DReport
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// METAS E OBJETIVOS
// ============================================

export type GoalType = 'weight' | 'body-fat' | 'muscle-mass' | 'water-intake' | 'exercise' | 'habit' | 'custom'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'

export interface GoalCheckIn {
  date: string
  value?: number
  completed: boolean
  notes?: string
}

export interface Goal {
  id: string
  patientId: string
  type: GoalType
  description: string
  targetValue: number
  currentValue: number
  unit: string
  deadline?: string
  status: GoalStatus
  isHabit: boolean
  checkIns?: GoalCheckIn[]
  createdAt: string
  updatedAt: string
}

// ============================================
// EXAMES LABORATORIAIS
// ============================================

export type LabExamType = 'blood' | 'urine' | 'stool' | 'hormonal' | 'vitamin' | 'other'

export interface LabExamResult {
  parameter: string
  value: string
  unit?: string
  reference?: string
  status?: string // "normal", "alto", "baixo"
}

export interface LabExamAIAnalysis {
  summary: string
  findings: string[]
  recommendations: string[]
  concerns?: string[]
  analyzedAt: string
}

export interface LabExam {
  id: string
  patientId: string
  date: string
  type: LabExamType
  fileUrl: string
  results?: LabExamResult[]
  rawText?: string
  aiAnalysis?: LabExamAIAnalysis
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// QUESTIONÁRIOS
// ============================================

export type QuestionnaireType = 'metabolic-screening' | 'eating-pattern' | 'sleep' | 'physical-activity' | 'custom'
export type QuestionnaireStatus = 'draft' | 'sent' | 'completed' | 'expired'

export interface Questionnaire {
  id: string
  nutritionistId: string
  patientId: string
  type: QuestionnaireType
  title: string
  description?: string
  questions: Question[]
  answers?: AnamnesisAnswer[]
  status: QuestionnaireStatus
  sentAt?: string
  completedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// ALIMENTOS
// ============================================

export interface Micronutrients {
  vitaminA?: number // mcg
  vitaminC?: number // mg
  vitaminD?: number // mcg
  vitaminE?: number // mg
  vitaminK?: number // mcg
  thiamin?: number // mg (B1)
  riboflavin?: number // mg (B2)
  niacin?: number // mg (B3)
  vitaminB6?: number // mg
  folate?: number // mcg (B9)
  vitaminB12?: number // mcg
  calcium?: number // mg
  iron?: number // mg
  magnesium?: number // mg
  phosphorus?: number // mg
  potassium?: number // mg
  sodium?: number // mg
  zinc?: number // mg
}

export interface Food {
  id: string
  name: string
  category?: string
  description?: string
  macros: MacroNutrients // por 100g
  micros?: Micronutrients // por 100g
  source?: string // "TBCA", "TACO", "custom"
  isVerified: boolean
  createdAt: string
  updatedAt: string
}
// ============================================
// EXPORTAÇÃO CENTRALIZADA DOS SERVIÇOS
// ============================================

// API Client e utilitários
export { api, tokenManager, sanitizeInput, isValidEmail, isStrongPassword, checkRateLimit } from './api'

// Serviços
export { authService } from './auth.service'
export { messageService } from './message.service'
export { dashboardService } from './dashboard.service'
export { profileService, LAYOUT_OPTIONS, GRID_COLUMN_OPTIONS, HERO_STYLE_OPTIONS, PROJECT_CARD_STYLE_OPTIONS, BACKGROUND_STYLE_OPTIONS, DEFAULT_CUSTOMIZATION } from './profile.service'
export { exploreService } from './explore.service'
export { calendarService } from './calendar.service'
export { favoritesService } from './favorites.service'
export { questionService, QUESTION_CATEGORIES } from './question.service'
export { blogService, BLOG_CATEGORIES } from './blog.service'
export { analyticsService } from './analytics.service'
export { badgeService, BADGE_LEVEL_COLORS, BADGE_LEVEL_LABELS } from './badge.service'
export { compareService } from './compare.service'
export { geolocationService } from './geolocation.service'
export { settingsService } from './settings.service'
export { servicesService } from './services.service'
export type { Service, ServiceCategory, ServiceStats, CreateServiceRequest, UpdateServiceRequest, ServiceFilters } from './services.service'
export { notificationService } from './notification.service'
export type { Notification, NotificationType, NotificationPreferences } from './notification.service'
export { reviewService } from './review.service'
export type { Review, ReviewWithDetails, CreateReviewRequest, UpdateReviewRequest, ArchitectRatingStats } from './review.service'
export { mealPlanService } from './mealPlan.service'
export { foodDiaryService } from './foodDiary.service'
export { anamnesisService } from './anamnesis.service'
export { patientService } from './patient.service'
export { labExamService } from './labExam.service'
export { adminService } from './admin.service'

// Re-exportar tipos principais (apenas da API)
export type * from '../types/api'

// Tipos específicos dos serviços são importados diretamente de cada serviço quando necessário


import type { BlogPost } from '../../../services/blog.service'
import type { PublicProfile as PublicProfileType } from '../../../services/profile.service'
import type { Recipe } from '../../../services/recipe.service'
import type { ReviewWithDetails } from '../../../services/review.service'
import type { ResolvedCustomization } from '../../../utils/profileCustomization'

export interface PublicProfileViewState {
  profile: PublicProfileType
  username: string
  customization: ResolvedCustomization
  posts: BlogPost[]
  recipes: Recipe[]
  reviews: ReviewWithDetails[]
  rating: { avg: number; count: number }
  patientsCount: number
  showBio: boolean
  showStats: boolean
  showServices: boolean
  showExperience: boolean
  showEducation: boolean
  showAwards: boolean
  showProfessionalInfo: boolean
  showContents: boolean
  showRecipes: boolean
  showReviews: boolean
  showContact: boolean
  canSubmitReview: boolean
  avatarUrl?: string
  coverUrl?: string
  contactEmail?: string
  contactPhone?: string
  contactWebsite?: string
  primaryColorSolid?: string
  primaryColorHexAlpha?: string
  postsLayoutClass: string
  recipesLayoutClass: string
  cardClasses: ReturnType<typeof import('../../../utils/profileCustomization').projectCardClasses>
  cardStyle: 'simple' | 'detailed' | 'overlay'
  layoutType: import('../../../services/profile.service').ProfileLayoutType
  isFavorite: boolean
  isAuthenticated: boolean
  userRole?: string
  reviewRating: number
  setReviewRating: (n: number) => void
  reviewComment: string
  setReviewComment: (v: string) => void
  reviewMealPlanId: string
  setReviewMealPlanId: (v: string) => void
  completedMealPlans: any[]
  submittingReview: boolean
  removingReviewId: string | null
  onToggleFavorite: () => void
  onSubmitReview: () => void
  onRemoveReviewAsNutritionist: (id: string) => void
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { favoritesService, mealPlanService, profileService, reviewService } from '../services'
import { INPUT_LIMITS } from '../utils/inputUtils'
import { resolveMediaUrl } from '../utils/mediaUrl'
import {
  mergeCustomization,
  hasContactInfo,
  contentLayoutClass,
  projectCardClasses,
  isEnabled,
} from '../utils/profileCustomization'
import {
  hasEducations,
  hasRecognitions,
  hasWorkExperiences,
  resolveCareer,
} from '../utils/profileCareer'
import { blogService } from '../services/blog.service'
import { recipeService } from '../services/recipe.service'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import type { PublicProfile as PublicProfileType } from '../services/profile.service'
import type { ReviewWithDetails } from '../services/review.service'
import ConfirmModal from '../components/common/ConfirmModal'
import type { BlogPost } from '../services/blog.service'
import type { Recipe } from '../services/recipe.service'
import { useConfirmDelete } from '../hooks'
import { PublicProfilePageView } from '../components/profile/public'
import type { PublicProfileViewState } from '../components/profile/public/types'

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const removeFavoriteFlow = useConfirmDelete<string>()
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewMealPlanId, setReviewMealPlanId] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [completedMealPlans, setCompletedMealPlans] = useState<any[]>([])
  const [removingReviewId, setRemovingReviewId] = useState<string | null>(null)

  const patientsCount = useMemo(() => {
    const raw = (profile as any)?.patientsCount
    const n = typeof raw === 'number' ? raw : Number(raw ?? 0)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }, [profile])

  const rating = useMemo(() => {
    const avg = profile?.ratings?.average ?? 0
    const count = profile?.reviewsCount ?? profile?.ratings?.total ?? 0
    return { avg, count }
  }, [profile])

  const loadErrorShownRef = useRef(false)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    loadErrorShownRef.current = false

    const load = async () => {
      setLoading(true)
      const res = await profileService.getPublicProfile(username)
      if (cancelled) return

      if (!res.data) {
        setProfile(null)
        setLoading(false)
        if (res.error && !loadErrorShownRef.current) {
          loadErrorShownRef.current = true
          showToast(res.error, 'error')
        }
        return
      }

      setProfile(res.data)

      if (res.data.customization?.showReviews !== false) {
        const r = await reviewService.getByNutritionist(res.data.userId, 1, 10)
        if (!cancelled && r.data?.data) setReviews(r.data.data)
      }

      const bp = await blogService.getByAuthor(res.data.userId, 6)
      if (!cancelled && bp.data) setPosts(bp.data)
      const rec = await recipeService.listPublicByNutritionist(res.data.userId)
      if (!cancelled) setRecipes((rec.data as any)?.data || [])

      if (isAuthenticated && user?.role === 'paciente') {
        const fav = await favoritesService.checkFavorite(res.data.userId)
        if (!cancelled) setIsFavorite(Boolean((fav.data as any)?.isFavorite))
        const mp = await mealPlanService.list({ status: 'completed', page: 1, limit: 50 })
        if (!cancelled) {
          const plans = (mp.data as any)?.data || (mp.data as any)?.data?.data || []
          const filtered = Array.isArray(plans)
            ? plans.filter((p: any) => String(p?.nutritionistId || '').trim() === String(res.data?.userId || '').trim())
            : []
          setCompletedMealPlans(filtered)
          if (filtered.length > 0) setReviewMealPlanId(String(filtered[0].id))
        }
      } else if (!cancelled) {
        setIsFavorite(false)
        setCompletedMealPlans([])
      }

      if (!cancelled) setLoading(false)
    }

    void load()
    return () => { cancelled = true }
  }, [username, isAuthenticated, user?.role])

  const handleToggleFavorite = async () => {
    if (!profile?.userId) return
    if (!isAuthenticated) { navigate('/login'); return }
    if (user?.role !== 'paciente') { showToast('Apenas pacientes podem favoritar nutricionistas.', 'warning'); return }
    if (isFavorite) { removeFavoriteFlow.open(profile.userId); return }
    const res = await favoritesService.addFavorite(profile.userId.trim())
    if (res.error) { showToast(res.error, 'error'); return }
    setIsFavorite(true)
    showToast('Adicionado aos favoritos', 'success')
  }

  const confirmRemoveFavorite = async (nutritionistId: string) => {
    const res = await favoritesService.removeFavorite(nutritionistId.trim())
    if (res.error) { showToast(res.error, 'error'); return }
    setIsFavorite(false)
    showToast('Removido dos favoritos', 'success')
  }

  const onSubmitReview = async () => {
    if (submittingReview || !profile?.userId) return
    if (!isAuthenticated) { navigate('/login'); return }
    if (user?.role !== 'paciente') { showToast('Apenas pacientes podem avaliar.', 'warning'); return }
    const comment = reviewComment.trim()
    if (comment.length < INPUT_LIMITS.REVIEW_COMMENT_MIN) { showToast('Comentário obrigatório (mínimo de 20 caracteres).', 'warning'); return }
    if (!reviewMealPlanId) { showToast('Para avaliar, selecione um plano alimentar concluído.', 'warning'); return }
    setSubmittingReview(true)
    try {
      const res = await reviewService.create({ nutritionistId: profile.userId, mealPlanId: reviewMealPlanId, rating: reviewRating, comment })
      if (res.error) { showToast(res.error, 'error'); return }
      showToast('Avaliação enviada com sucesso.', 'success')
      setReviewComment('')
      const r = await reviewService.getByNutritionist(profile.userId, 1, 10)
      if (r.data?.data) setReviews(r.data.data)
    } finally {
      setSubmittingReview(false)
    }
  }

  const onRemoveReviewAsNutritionist = async (reviewId: string) => {
    if (user?.role !== 'nutricionista') return
    setRemovingReviewId(reviewId)
    try {
      const res = await reviewService.deleteAsNutritionist(reviewId)
      if (res.error) { showToast(res.error, 'error'); return }
      showToast('Avaliação removida do perfil.', 'success')
      if (profile?.userId) {
        const r = await reviewService.getByNutritionist(profile.userId, 1, 10)
        if (r.data?.data) setReviews(r.data.data)
      }
    } finally {
      setRemovingReviewId(null)
    }
  }

  const viewState = useMemo((): PublicProfileViewState | null => {
    if (!profile || !username) return null
    const customization = mergeCustomization(profile.customization)
    const layoutType = customization.layout ?? 'grid'
    const gridColumns = customization.gridColumns ?? 3
    const cardStyle = customization.projectCardStyle ?? 'simple'
    const primaryColor = customization.primaryColor?.trim() || undefined
    const primaryColorSolid = primaryColor?.startsWith('#') && primaryColor.length === 7 ? primaryColor : undefined
    const primaryColorHexAlpha = primaryColorSolid ? `${primaryColorSolid}20` : undefined
    const career = resolveCareer(profile)
    const canSubmitReview = isAuthenticated && user?.role === 'paciente'
    const showExperience = isEnabled(customization.showExperience) && hasWorkExperiences(career)
    const showEducation = isEnabled(customization.showEducation) && hasEducations(career)
    const showAwards = isEnabled(customization.showAwards) && hasRecognitions(career)

    return {
      profile,
      username,
      customization,
      posts,
      recipes,
      reviews,
      rating,
      patientsCount,
      showBio: isEnabled(customization.showBio) && Boolean(profile.bio?.trim()),
      showStats: isEnabled(customization.showStats) && (rating.count > 0 || patientsCount > 0),
      showServices: isEnabled(customization.showServices) && Boolean(profile.specialties?.length),
      showExperience,
      showEducation,
      showAwards,
      showProfessionalInfo: showExperience || showEducation || showAwards,
      showContents: isEnabled(customization.showContents) && posts.length > 0,
      showRecipes: isEnabled(customization.showRecipes) && recipes.length > 0,
      showReviews: isEnabled(customization.showReviews) && (reviews.length > 0 || canSubmitReview),
      showContact: isEnabled(customization.showContact) && hasContactInfo(profile),
      canSubmitReview,
      avatarUrl: resolveMediaUrl(profile.avatar),
      coverUrl: resolveMediaUrl(profile.coverImage),
      contactEmail: profile.contact?.email || profile.email,
      contactPhone: profile.contact?.phone || profile.phone,
      contactWebsite: profile.contact?.website || profile.website,
      primaryColorSolid,
      primaryColorHexAlpha,
      postsLayoutClass: contentLayoutClass(layoutType, posts.length, gridColumns),
      recipesLayoutClass: contentLayoutClass(layoutType, recipes.length, gridColumns),
      cardClasses: projectCardClasses(cardStyle),
      cardStyle,
      layoutType,
      isFavorite,
      isAuthenticated,
      userRole: user?.role,
      reviewRating,
      setReviewRating,
      reviewComment,
      setReviewComment,
      reviewMealPlanId,
      setReviewMealPlanId,
      completedMealPlans,
      submittingReview,
      removingReviewId,
      onToggleFavorite: () => void handleToggleFavorite(),
      onSubmitReview: () => void onSubmitReview(),
      onRemoveReviewAsNutritionist: (id) => void onRemoveReviewAsNutritionist(id),
    }
  }, [
    profile, username, posts, recipes, reviews, rating, patientsCount, isFavorite, isAuthenticated,
    user?.role, reviewRating, reviewComment, reviewMealPlanId, completedMealPlans, submittingReview, removingReviewId,
  ])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="text-gray-600 text-sm">Carregando...</div></div>
  }

  if (!viewState) {
    return (
      <div className="app-page app-section py-8">
        <div className="app-card text-center">
          <p className="font-semibold text-gray-900">Nutricionista não encontrado.</p>
          <p className="text-gray-600 mt-2">Verifique o link e tente novamente.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PublicProfilePageView state={viewState} />
      <ConfirmModal
        isOpen={removeFavoriteFlow.isOpen}
        title="Remover dos favoritos?"
        message="Você quer remover este nutricionista da sua lista de favoritos?"
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={() => void removeFavoriteFlow.confirm(confirmRemoveFavorite)}
        onClose={removeFavoriteFlow.close}
        loading={removeFavoriteFlow.loading}
        variant="danger"
      />
    </>
  )
}

export default PublicProfile

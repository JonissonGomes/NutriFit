import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import AddIcon from '@mui/icons-material/Add'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import SchoolIcon from '@mui/icons-material/School'
import WorkIcon from '@mui/icons-material/Work'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { favoritesService, mealPlanService, profileService, reviewService } from '../services'
import { INPUT_LIMITS, limitLength, sanitizeText } from '../utils/inputUtils'
import { resolveMediaUrl } from '../utils/mediaUrl'
import {
  mergeCustomization,
  hasContactInfo,
  contentLayoutClass,
  contentItemClass,
  projectCardClasses,
  isEnabled,
} from '../utils/profileCustomization'
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
          if (filtered.length > 0) {
            setReviewMealPlanId(String(filtered[0].id))
          }
        }
      } else if (!cancelled) {
        setIsFavorite(false)
        setCompletedMealPlans([])
      }

      if (!cancelled) setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [username, isAuthenticated, user?.role])

  const handleToggleFavorite = async () => {
    if (!profile?.userId) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user?.role !== 'paciente') {
      showToast('Apenas pacientes podem favoritar nutricionistas.', 'warning')
      return
    }

    if (isFavorite) {
      removeFavoriteFlow.open(profile.userId)
      return
    }

    const nutritionistId = profile.userId.trim()
    const res = await favoritesService.addFavorite(nutritionistId)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }
    setIsFavorite(true)
    showToast('Adicionado aos favoritos', 'success')
  }

  const confirmRemoveFavorite = async (nutritionistId: string) => {
    const res = await favoritesService.removeFavorite(nutritionistId.trim())
    if (res.error) {
      showToast(res.error, 'error')
      return
    }
    setIsFavorite(false)
    showToast('Removido dos favoritos', 'success')
  }

  const onSubmitReview = async () => {
    if (submittingReview) return
    if (!profile?.userId) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user?.role !== 'paciente') {
      showToast('Apenas pacientes podem avaliar.', 'warning')
      return
    }

    const comment = reviewComment.trim()
    if (comment.length < INPUT_LIMITS.REVIEW_COMMENT_MIN) {
      showToast('Comentário obrigatório (mínimo de 20 caracteres).', 'warning')
      return
    }
    if (!reviewMealPlanId) {
      showToast('Para avaliar, selecione um plano alimentar concluído.', 'warning')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await reviewService.create({
        nutritionistId: profile.userId,
        mealPlanId: reviewMealPlanId,
        rating: reviewRating,
        comment,
      })
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
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
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      showToast('Avaliação removida do perfil.', 'success')
      if (profile?.userId) {
        const r = await reviewService.getByNutritionist(profile.userId, 1, 10)
        if (r.data?.data) setReviews(r.data.data)
      }
    } finally {
      setRemovingReviewId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-600 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="app-page app-section py-8">
        <div className="app-card text-center">
          <p className="font-semibold text-gray-900">Nutricionista não encontrado.</p>
          <p className="text-gray-600 mt-2">Verifique o link e tente novamente.</p>
        </div>
      </div>
    )
  }

  const customization = mergeCustomization(profile.customization)
  const layoutType = customization.layout ?? 'grid'
  const gridColumns = customization.gridColumns ?? 3
  const cardStyle = customization.projectCardStyle ?? 'simple'
  const cardClasses = projectCardClasses(cardStyle)

  const showBio = isEnabled(customization.showBio) && Boolean(profile.bio?.trim())
  const showStats = isEnabled(customization.showStats) && (rating.count > 0 || patientsCount > 0)
  const showServices = isEnabled(customization.showServices) && Boolean(profile.specialties?.length)
  const showExperience = isEnabled(customization.showExperience) && Boolean(profile.experience?.trim())
  const showEducation = isEnabled(customization.showEducation) && Boolean(profile.education?.trim())
  const showAwards = isEnabled(customization.showAwards) && Boolean(profile.awards?.trim())
  const showProfessionalInfo = showExperience || showEducation || showAwards
  const showContents = isEnabled(customization.showContents) && posts.length > 0
  const showRecipes = isEnabled(customization.showRecipes) && recipes.length > 0
  const canSubmitReview = isAuthenticated && user?.role === 'paciente'
  const showReviews =
    isEnabled(customization.showReviews) && (reviews.length > 0 || canSubmitReview)
  const showContact = isEnabled(customization.showContact) && hasContactInfo(profile)

  const heroStyle = customization.heroStyle ?? 'full'
  const isMinimalHero = heroStyle === 'minimal' || layoutType === 'minimalist'

  const primaryColor = customization.primaryColor?.trim() || undefined
  const primaryColorHexAlpha = primaryColor && primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}20` : undefined
  const primaryColorSolid = primaryColor && primaryColor.startsWith('#') && primaryColor.length === 7 ? primaryColor : undefined

  const coverHeightClass =
    isMinimalHero ? 'h-20 md:h-24' : heroStyle === 'full' ? 'h-40 md:h-56' : heroStyle === 'compact' ? 'h-28 md:h-36' : 'h-20 md:h-24'

  const avatarOffsetClass =
    isMinimalHero
      ? 'relative z-10 -mt-8 md:-mt-10'
      : heroStyle === 'full'
        ? 'relative z-10 -mt-16 md:-mt-20'
        : heroStyle === 'compact'
          ? 'relative z-10 -mt-12 md:-mt-14'
          : 'relative z-10 -mt-8 md:-mt-10'

  const avatarSizeClass =
    isMinimalHero
      ? 'w-18 h-18 md:w-20 md:h-20'
      : heroStyle === 'full'
        ? 'w-28 h-28 md:w-32 md:h-32'
        : heroStyle === 'compact'
          ? 'w-20 h-20 md:w-24 md:h-24'
          : 'w-18 h-18 md:w-20 md:h-20'

  const avatarUrl = resolveMediaUrl(profile.avatar)
  const coverUrl = resolveMediaUrl(profile.coverImage)
  const contactEmail = profile.contact?.email || profile.email
  const contactPhone = profile.contact?.phone || profile.phone
  const contactWebsite = profile.contact?.website || profile.website

  const postsLayoutClass = contentLayoutClass(layoutType, posts.length, gridColumns)
  const recipesLayoutClass = contentLayoutClass(layoutType, recipes.length, gridColumns)

  return (
    <div
      className={`min-h-screen ${customization.backgroundStyle === 'dark' ? 'bg-stone-950' : customization.backgroundStyle === 'gradient' ? 'bg-gradient-to-b from-primary-900/10 via-gray-50 to-gray-50' : 'bg-gray-50'}`}
    >
      <div className="app-page app-section py-8">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div
            className={`${coverHeightClass} bg-gradient-to-r from-primary-600 to-accent-600 relative z-0`}
            style={primaryColorSolid ? { backgroundImage: `linear-gradient(90deg, ${primaryColorSolid}, #14b8a6)` } : undefined}
          >
            {coverUrl && (
              <img src={coverUrl} className="w-full h-full object-cover opacity-90" alt="Capa" />
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              <div className={avatarOffsetClass}>
                <div className={`${avatarSizeClass} rounded-2xl bg-white p-1 shadow-md`}>
                  <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">{profile.displayName?.[0] || 'N'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="app-page-title truncate">
                        {profile.displayName}
                      </h1>
                      {profile.verification?.verified && (
                        <VerifiedIcon sx={{ fontSize: 22, color: '#10b981' }} titleAccess="Verificado" />
                      )}
                    </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                          <StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} />
                          {showStats ? (
                            <>
                              {rating.avg.toFixed(1)} ({rating.count})
                            </>
                          ) : rating.count > 0 ? (
                            <>{rating.avg.toFixed(1)}</>
                          ) : null}
                      </span>
                      {showStats && patientsCount > 0 ? <span className="text-gray-400">·</span> : null}
                      {showStats && patientsCount > 0 ? <span>{patientsCount} paciente(s)</span> : null}
                      {profile.location?.address?.city && (
                        <span className="inline-flex items-center gap-1">
                          <LocationOnIcon sx={{ fontSize: 18 }} />
                          {profile.location.address.city}
                          {profile.location.address.state ? `, ${profile.location.address.state}` : ''}
                        </span>
                      )}
                        {profile.specialty && (
                          <span
                            className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-800"
                            style={primaryColorHexAlpha && primaryColorSolid ? { backgroundColor: primaryColorHexAlpha, color: primaryColorSolid } : undefined}
                          >
                            {profile.specialty}
                          </span>
                        )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900"
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {isFavorite ? (
                      <FavoriteIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                    )}
                  </button>
                </div>

                {showBio && <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>}

                {showServices ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.specialties?.slice(0, 10).map((s) => (
                      <span key={s} className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}

              </div>
            </div>
          </div>
        </div>

        {showProfessionalInfo ? (
          <div className="app-card rounded-2xl">
            <h2 className="text-lg font-bold text-gray-900">Trajetória profissional</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {showExperience ? (
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
                    <WorkIcon sx={{ fontSize: 18 }} />
                    Experiência
                  </div>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">{profile.experience}</p>
                </div>
              ) : null}
              {showEducation ? (
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
                    <SchoolIcon sx={{ fontSize: 18 }} />
                    Formação
                  </div>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">{profile.education}</p>
                </div>
              ) : null}
              {showAwards ? (
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
                    <EmojiEventsIcon sx={{ fontSize: 18 }} />
                    Reconhecimentos
                  </div>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.awards}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showContents ? (
          <div className="app-card rounded-2xl">
            <div className="flex items-center justify-between gap-3 md:flex-nowrap min-w-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap truncate">Conteúdos</h2>
                <p className="text-sm text-gray-600 mt-1">Artigos e materiais publicados no NuFit.</p>
              </div>
              <Link
                to={`/profile/${username}/conteudos`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50"
                aria-label="Ver todos os conteúdos"
                title="Ver todos os conteúdos"
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </Link>
            </div>
            <div className="mt-3">
              <div className={postsLayoutClass}>
                {posts.slice(0, 10).map((p, index) => {
                  const thumbUrl = resolveMediaUrl(p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url)
                  const itemClass = contentItemClass(layoutType, posts.length, index === 0)
                  const isOverlay = cardStyle === 'overlay'
                  return (
                    <Link
                      key={p.id}
                      to={`/conteudos/public/${p.slug}`}
                      className={`${cardClasses.wrapper} ${itemClass} block`}
                    >
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={p.title} className={cardClasses.image} />
                      ) : (
                        <div className={`${cardClasses.image} bg-gradient-to-r from-primary-600 to-accent-600`} />
                      )}
                      <div className={cardClasses.body}>
                        <p className={cardClasses.title}>{p.title}</p>
                        {p.excerpt && !isOverlay ? <p className={cardClasses.excerpt}>{p.excerpt}</p> : null}
                        {p.excerpt && isOverlay ? <p className={cardClasses.excerpt}>{p.excerpt}</p> : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {showRecipes ? (
          <div className="app-card rounded-2xl">
            <div className="flex items-center justify-between gap-3 md:flex-nowrap min-w-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap truncate">Receitas</h2>
                <p className="text-sm text-gray-600 mt-1">Receitas compartilhadas publicamente por este profissional.</p>
              </div>
              <Link
                to={`/profile/${username}/receitas`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50"
                aria-label="Ver todas as receitas"
                title="Ver todas as receitas"
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </Link>
            </div>
            <div className="mt-3">
              <div className={recipesLayoutClass}>
                {recipes.slice(0, 10).map((r, index) => {
                  const imageUrl = resolveMediaUrl(r.imageUrls?.[0])
                  const itemClass = contentItemClass(layoutType, recipes.length, index === 0)
                  return (
                    <div key={r.id} className={`${cardClasses.wrapper} ${itemClass}`}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={r.title} className={cardStyle === 'overlay' ? cardClasses.image : `${cardClasses.image} rounded-lg`} />
                      ) : (
                        <div className={`${cardClasses.image} ${cardStyle !== 'overlay' ? 'rounded-lg' : ''} bg-gray-100`} />
                      )}
                      <div className={cardClasses.body}>
                        <div className={cardClasses.title}>{r.title}</div>
                        {r.description ? <div className={cardClasses.excerpt}>{r.description}</div> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {(showReviews || showContact) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {showReviews ? (
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap truncate">Avaliações</h2>
              {isAuthenticated && user?.role === 'paciente' ? (
                <div className="mt-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="text-sm font-semibold text-gray-900">Deixe sua avaliação</div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Estrelas</label>
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const active = n <= reviewRating
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setReviewRating(n)}
                              className="p-1 rounded-md hover:bg-yellow-50 transition-colors"
                              title={`${n} estrela(s)`}
                              aria-label={`${n} estrela(s)`}
                            >
                              <StarIcon sx={{ fontSize: 24, color: active ? '#f59e0b' : '#d1d5db' }} />
                            </button>
                          )
                        })}
                        <span className="ml-2 text-sm text-gray-700">{reviewRating}/5</span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-700">Plano concluído (obrigatório)</label>
                      <select
                        value={reviewMealPlanId}
                        onChange={(e) => setReviewMealPlanId(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={completedMealPlans.length === 0}
                      >
                        {completedMealPlans.length === 0 ? (
                          <option value="">Nenhum plano concluído encontrado</option>
                        ) : (
                          completedMealPlans.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.title || 'Plano alimentar'} ({p.status})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-700">Comentário (mínimo {INPUT_LIMITS.REVIEW_COMMENT_MIN} caracteres)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(limitLength(sanitizeText(e.target.value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';']), INPUT_LIMITS.REVIEW_COMMENT))}
                      maxLength={INPUT_LIMITS.REVIEW_COMMENT}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Conte como foi sua experiência..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{reviewComment.length}/{INPUT_LIMITS.REVIEW_COMMENT}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onSubmitReview()}
                    disabled={submittingReview || completedMealPlans.length === 0}
                    className="mt-3 inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
                  >
                    {submittingReview ? 'Enviando...' : 'Enviar avaliação'}
                  </button>
                  {completedMealPlans.length === 0 ? (
                    <p className="text-xs text-gray-600 mt-2">
                      Para avaliar, você precisa ter um plano alimentar concluído com este profissional.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {reviews.length === 0 && !canSubmitReview ? (
                <p className="text-sm text-gray-600 mt-2">Ainda não há avaliações.</p>
              ) : reviews.length === 0 ? null : (
                <div className="mt-4 space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{r.patientName || (r as any).clientName || 'Paciente'}</div>
                        <div className="text-sm text-gray-700 inline-flex items-center gap-1">
                          <StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} /> {r.rating}
                        </div>
                      </div>
                      {r.mealPlanTitle ? <div className="text-xs text-gray-500 mt-1">Plano: {r.mealPlanTitle}</div> : null}
                      {r.comment && <p className="text-sm text-gray-700 mt-2">{r.comment}</p>}
                      {isAuthenticated && user?.role === 'nutricionista' && r.rating <= 2 ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            disabled={removingReviewId === r.id}
                            onClick={() => void onRemoveReviewAsNutritionist(r.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-60"
                            title="Disponível apenas para avaliações com 1 ou 2 estrelas"
                          >
                            {removingReviewId === r.id ? 'Removendo...' : 'Remover do perfil'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {showContact ? (
            <div className={showReviews ? 'bg-white border border-gray-200 rounded-2xl p-6' : 'bg-white border border-gray-200 rounded-2xl p-6 md:col-span-3'}>
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap truncate">Contato</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {contactEmail && (
                  <div className="flex items-center gap-2">
                    <EmailIcon sx={{ fontSize: 18 }} />
                    <span className="truncate">{contactEmail}</span>
                  </div>
                )}
                {contactPhone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon sx={{ fontSize: 18 }} />
                    <span className="truncate">{contactPhone}</span>
                  </div>
                )}
                {contactWebsite && (
                  <div className="flex items-center gap-2">
                    <LanguageIcon sx={{ fontSize: 18 }} />
                    <a href={contactWebsite} className="text-primary-700 font-semibold truncate" target="_blank" rel="noreferrer">
                      {contactWebsite}
                    </a>
                  </div>
                )}

                {profile.social?.instagram?.url && (
                  <div className="flex items-center gap-2">
                    <InstagramIcon sx={{ fontSize: 18 }} />
                    <a href={profile.social.instagram.url} className="text-primary-700 font-semibold truncate" target="_blank" rel="noreferrer">
                      Instagram
                    </a>
                  </div>
                )}
                {profile.social?.facebook?.url && (
                  <div className="flex items-center gap-2">
                    <FacebookIcon sx={{ fontSize: 18 }} />
                    <a href={profile.social.facebook.url} className="text-primary-700 font-semibold truncate" target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  </div>
                )}

                {profile.verification?.verified && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-800 font-semibold">
                    <VerifiedIcon sx={{ fontSize: 18, color: '#10b981' }} />
                    Verificado
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        ) : null}
      </div>

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
    </div>
  )
}

export default PublicProfile


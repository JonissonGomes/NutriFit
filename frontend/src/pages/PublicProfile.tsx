import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import { favoritesService, mealPlanService, profileService, reviewService } from '../services'
import { blogService } from '../services/blog.service'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import type { PublicProfile as PublicProfileType } from '../services/profile.service'
import { DEFAULT_CUSTOMIZATION } from '../services/profile.service'
import type { ReviewWithDetails } from '../services/review.service'
import ConfirmModal from '../components/common/ConfirmModal'
import type { BlogPost } from '../services/blog.service'

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showRemoveFavoriteModal, setShowRemoveFavoriteModal] = useState(false)
  const [removingFavorite, setRemovingFavorite] = useState(false)
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

  useEffect(() => {
    const load = async () => {
      if (!username) return
      setLoading(true)

      const res = await profileService.getPublicProfile(username)
      if (!res.data) {
        setProfile(null)
        setLoading(false)
        if (res.error) showToast(res.error, 'error')
        return
      }

      setProfile(res.data)

      // Reviews (se habilitado)
      if (res.data.customization?.showReviews !== false) {
        const r = await reviewService.getByNutritionist(res.data.userId, 1, 10)
        if (r.data?.data) setReviews(r.data.data)
      }

      // Conteúdos do autor (público)
      const bp = await blogService.getByAuthor(res.data.userId, 6)
      if (bp.data) setPosts(bp.data)

      // Favorito (somente paciente)
      if (isAuthenticated && user?.role === 'paciente') {
        const fav = await favoritesService.checkFavorite(res.data.userId)
        setIsFavorite(Boolean((fav.data as any)?.isFavorite))

        // Carregar planos concluídos do paciente para permitir avaliação (quando aplicável).
        const mp = await mealPlanService.list({ status: 'completed', page: 1, limit: 50 })
        const plans = (mp.data as any)?.data || (mp.data as any)?.data?.data || []
        const filtered = Array.isArray(plans)
          ? plans.filter((p: any) => String(p?.nutritionistId || '').trim() === String(res.data?.userId || '').trim())
          : []
        setCompletedMealPlans(filtered)
        if (filtered.length > 0) {
          setReviewMealPlanId(String(filtered[0].id))
        }
      } else {
        setIsFavorite(false)
        setCompletedMealPlans([])
      }

      setLoading(false)
    }

    load()
  }, [username, isAuthenticated, user?.role, showToast])

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
      setShowRemoveFavoriteModal(true)
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

  const confirmRemoveFavorite = async () => {
    if (!profile?.userId) return
    setRemovingFavorite(true)
    try {
      const nutritionistId = profile.userId.trim()
      const res = await favoritesService.removeFavorite(nutritionistId)
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      setIsFavorite(false)
      showToast('Removido dos favoritos', 'success')
    } finally {
      setRemovingFavorite(false)
      setShowRemoveFavoriteModal(false)
    }
  }

  const onSubmitReview = async () => {
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
    if (comment.length < 20) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-primary-700 font-semibold">
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar
        </Link>
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="font-semibold text-gray-900">Nutricionista não encontrado.</p>
          <p className="text-gray-600 mt-2">Verifique o link e tente novamente.</p>
        </div>
      </div>
    )
  }

  const customization = profile.customization ?? DEFAULT_CUSTOMIZATION
  const showStats = customization.showStats !== false
  const showServices = customization.showServices !== false
  const showReviews = customization.showReviews !== false
  const showContact = customization.showContact !== false

  const heroStyle = customization.heroStyle ?? 'full'
  const cardStyle = customization.projectCardStyle ?? 'simple'
  const layoutType = customization.layout ?? 'grid'
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

  const contactEmail = profile.contact?.email || profile.email
  const contactPhone = profile.contact?.phone || profile.phone
  const contactWebsite = profile.contact?.website || profile.website

  return (
    <div
      className={`min-h-screen ${customization.backgroundStyle === 'dark' ? 'bg-stone-950' : customization.backgroundStyle === 'gradient' ? 'bg-gradient-to-b from-primary-900/10 via-gray-50 to-gray-50' : 'bg-gray-50'}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div
            className={`${coverHeightClass} bg-gradient-to-r from-primary-600 to-accent-600 relative z-0`}
            style={primaryColorSolid ? { backgroundImage: `linear-gradient(90deg, ${primaryColorSolid}, #14b8a6)` } : undefined}
          >
            {profile.coverImage && (
              <img src={profile.coverImage} className="w-full h-full object-cover opacity-90" alt="Capa" />
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              <div className={avatarOffsetClass}>
                <div className={`${avatarSizeClass} rounded-2xl bg-white p-1 shadow-md`}>
                  <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
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
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
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
                          ) : null}
                      </span>
                      {showStats ? <span className="text-gray-400">·</span> : null}
                      {showStats ? <span>{patientsCount} paciente(s)</span> : null}
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
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-900"
                  >
                    {isFavorite ? (
                      <FavoriteIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                    )}
                    Favoritar
                  </button>
                </div>

                {profile.bio && !isMinimalHero && <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>}

                {profile.specialties?.length && showServices && !isMinimalHero ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.specialties.slice(0, 10).map((s) => (
                      <span key={s} className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Conteúdos */}
                <div className="mt-6">
                  <h2 className="text-lg font-bold text-gray-900">Conteúdos</h2>
                  <p className="text-sm text-gray-600 mt-1">Artigos e materiais publicados no NuFit.</p>
                  {posts.length === 0 ? (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                      Este profissional ainda não publicou conteúdos.
                    </div>
                  ) : (
                    layoutType === 'carousel' ? (
                      <div className="mt-3 -mx-4 px-4 overflow-x-auto pb-2">
                        <div className="flex gap-3">
                          {posts.map((p) => {
                            const thumbUrl = p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url
                            return (
                              <Link
                                key={p.id}
                                to={`/conteudos/public/${p.slug}`}
                                className="min-w-[260px] sm:min-w-[300px] block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
                              >
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt={p.title} className="w-full h-36 object-cover" />
                                ) : (
                                  <div className="w-full h-36 bg-gradient-to-r from-primary-600 to-accent-600" />
                                )}
                                <div className="p-4">
                                  <p className="font-semibold text-gray-900 line-clamp-2">{p.title}</p>
                                  {!isMinimalHero ? (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.excerpt}</p>
                                  ) : null}
                                  <p className="text-[11px] text-gray-500 mt-2">{`Por ${profile.displayName}`}</p>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ) : layoutType === 'featured' && posts.length > 0 ? (
                      <div className="mt-3 space-y-4">
                        {(() => {
                          const featured = posts[0]
                          const featuredThumb = featured.featuredImage || featured.attachments?.find((a) => a.type === 'image')?.url
                          const featuredCard =
                            cardStyle === 'overlay' ? (
                              <Link
                                to={`/conteudos/public/${featured.slug}`}
                                className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
                              >
                                <div className="relative">
                                  {featuredThumb ? (
                                    <img src={featuredThumb} alt={featured.title} className="w-full h-52 object-cover" />
                                  ) : (
                                    <div className="w-full h-52 bg-gradient-to-r from-primary-600 to-accent-600" />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="font-semibold text-white line-clamp-2">{featured.title}</p>
                                    {!isMinimalHero ? (
                                      <p className="text-sm text-white/90 mt-1 line-clamp-2">{featured.excerpt}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <Link
                                to={`/conteudos/public/${featured.slug}`}
                                className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
                              >
                                {featuredThumb ? (
                                  <img src={featuredThumb} alt={featured.title} className="w-full h-52 object-cover" />
                                ) : (
                                  <div className="w-full h-52 bg-gradient-to-r from-primary-600 to-accent-600" />
                                )}
                                <div className="p-5">
                                  <p className="text-xl font-bold text-gray-900">{featured.title}</p>
                                  {cardStyle !== 'simple' && !isMinimalHero ? (
                                    <p className="text-gray-600 mt-2 line-clamp-3">{featured.excerpt}</p>
                                  ) : null}
                                  {cardStyle === 'detailed' ? (
                                    <p className="text-[11px] text-gray-500 mt-3">{`Por ${profile.displayName} • ${featured.readTime || 1} min de leitura`}</p>
                                  ) : null}
                                </div>
                              </Link>
                            )
                          return featuredCard
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {posts.slice(1).map((p) => {
                            const thumbUrl = p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url
                            return (
                              <Link
                                key={p.id}
                                to={`/conteudos/public/${p.slug}`}
                                className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
                              >
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt={p.title} className="w-full h-28 object-cover" />
                                ) : (
                                  <div className="w-full h-28 bg-gradient-to-r from-primary-600 to-accent-600" />
                                )}
                                <div className="p-4">
                                  <p className="font-semibold text-gray-900 line-clamp-2">{p.title}</p>
                                  {!isMinimalHero ? (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.excerpt}</p>
                                  ) : null}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const gridColumns = Math.min(4, Math.max(1, customization.gridColumns ?? 3))
                        const mdColsClass =
                          gridColumns === 1
                            ? 'md:grid-cols-1'
                            : gridColumns === 2
                              ? 'md:grid-cols-2'
                              : gridColumns === 3
                                ? 'md:grid-cols-3'
                                : 'md:grid-cols-4'

                        return (
                          <div className={`mt-3 grid grid-cols-1 ${mdColsClass} gap-3 md:gap-4`}>
                            {posts.map((p) => {
                              const thumbUrl = p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url
                              const isOverlay = cardStyle === 'overlay' || layoutType === 'portfolio'
                              return (
                                <Link
                                  key={p.id}
                                  to={`/conteudos/public/${p.slug}`}
                                  className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
                                >
                                  {isOverlay ? (
                                    <div className="relative">
                                      {thumbUrl ? (
                                        <img src={thumbUrl} alt={p.title} className="w-full h-32 object-cover" />
                                      ) : (
                                        <div className="w-full h-32 bg-gradient-to-r from-primary-600 to-accent-600" />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                      <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <p className="font-semibold text-white line-clamp-2">{p.title}</p>
                                        {!isMinimalHero && cardStyle !== 'simple' ? (
                                          <p className="text-sm text-white/90 mt-1 line-clamp-2">{p.excerpt}</p>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {thumbUrl ? (
                                        <img src={thumbUrl} alt={p.title} className="w-full h-32 object-cover" />
                                      ) : (
                                        <div className="w-full h-32 bg-gradient-to-r from-primary-600 to-accent-600" />
                                      )}
                                      <div className="p-4">
                                        <p className="font-semibold text-gray-900 line-clamp-2">{p.title}</p>
                                        {!isMinimalHero && cardStyle !== 'simple' ? (
                                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.excerpt}</p>
                                        ) : null}
                                        {cardStyle === 'detailed' ? (
                                          <p className="text-[11px] text-gray-500 mt-2">{`Por ${profile.displayName}`}</p>
                                        ) : null}
                                      </div>
                                    </>
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        )
                      })()
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {showReviews ? (
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
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
                    <label className="text-xs font-semibold text-gray-700">Comentário (mínimo 20 caracteres)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Conte como foi sua experiência..."
                    />
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
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-600 mt-2">Ainda não há avaliações.</p>
              ) : (
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
              <h2 className="text-lg font-bold text-gray-900">Contato</h2>
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
      </div>

      <ConfirmModal
        isOpen={showRemoveFavoriteModal}
        title="Remover dos favoritos?"
        message="Você quer remover este nutricionista da sua lista de favoritos?"
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={confirmRemoveFavorite}
        onClose={() => setShowRemoveFavoriteModal(false)}
        loading={removingFavorite}
        variant="danger"
      />
    </div>
  )
}

export default PublicProfile


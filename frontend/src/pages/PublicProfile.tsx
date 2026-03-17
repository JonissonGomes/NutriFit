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
import { favoritesService, profileService, reviewService } from '../services'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import type { PublicProfile as PublicProfileType } from '../services/profile.service'
import type { ReviewWithDetails } from '../services/review.service'
import ConfirmModal from '../components/common/ConfirmModal'

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const [profile, setProfile] = useState<PublicProfileType | null>(null)
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showRemoveFavoriteModal, setShowRemoveFavoriteModal] = useState(false)
  const [removingFavorite, setRemovingFavorite] = useState(false)

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
        const r = await reviewService.getByArchitect(res.data.userId, 1, 10)
        if (r.data?.data) setReviews(r.data.data)
      }

      // Favorito (somente paciente)
      if (isAuthenticated && user?.role === 'paciente') {
        const fav = await favoritesService.checkFavorite(res.data.userId)
        setIsFavorite(Boolean((fav.data as any)?.isFavorite))
      } else {
        setIsFavorite(false)
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

    const res = await favoritesService.addFavorite(profile.userId)
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
      const res = await favoritesService.removeFavorite(profile.userId)
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

  const contactEmail = profile.contact?.email || profile.email
  const contactPhone = profile.contact?.phone || profile.phone
  const contactWebsite = profile.contact?.website || profile.website

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-40 md:h-56 bg-gradient-to-r from-primary-600 to-accent-600 relative">
            {profile.coverImage && (
              <img src={profile.coverImage} className="w-full h-full object-cover opacity-90" alt="Capa" />
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              <div className="-mt-16 md:-mt-20">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white p-1 shadow-md">
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
                        <StarIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        {rating.avg.toFixed(1)} ({rating.count})
                      </span>
                      {profile.location?.address?.city && (
                        <span className="inline-flex items-center gap-1">
                          <LocationOnIcon sx={{ fontSize: 18 }} />
                          {profile.location.address.city}
                          {profile.location.address.state ? `, ${profile.location.address.state}` : ''}
                        </span>
                      )}
                      {profile.specialty && <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-800">{profile.specialty}</span>}
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

                {profile.bio && <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>}

                {profile.specialties?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.specialties.slice(0, 10).map((s) => (
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-600 mt-2">Ainda não há avaliações.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900 truncate">{r.clientName || 'Paciente'}</div>
                      <div className="text-sm text-gray-700 inline-flex items-center gap-1">
                        <StarIcon sx={{ fontSize: 18, color: '#f59e0b' }} /> {r.rating}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-700 mt-2">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
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


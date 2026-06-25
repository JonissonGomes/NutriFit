import { Link } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import VerifiedIcon from '@mui/icons-material/Verified'
import StarIcon from '@mui/icons-material/Star'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { INPUT_LIMITS, limitLength, sanitizeText } from '../../../utils/inputUtils'
import { resolveMediaUrl } from '../../../utils/mediaUrl'
import { contentItemClass } from '../../../utils/profileCustomization'
import type { PublicProfileViewState } from './types'

export function ProfileFavoriteButton({ state, className = '' }: { state: PublicProfileViewState; className?: string }) {
  return (
    <button
      type="button"
      onClick={state.onToggleFavorite}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900 ${className}`}
      aria-label={state.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {state.isFavorite ? (
        <FavoriteIcon sx={{ fontSize: 18, color: '#ef4444' }} />
      ) : (
        <FavoriteBorderIcon sx={{ fontSize: 18 }} />
      )}
    </button>
  )
}

export function ProfileProfessionalSection({ state }: { state: PublicProfileViewState }) {
  if (!state.showProfessionalInfo) return null
  const { profile, showExperience, showEducation, showAwards } = state

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {showExperience && (
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
            <WorkIcon sx={{ fontSize: 18 }} /> Experiência
          </div>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">{profile.experience}</p>
        </div>
      )}
      {showEducation && (
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
            <SchoolIcon sx={{ fontSize: 18 }} /> Formação
          </div>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">{profile.education}</p>
        </div>
      )}
      {showAwards && (
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
            <EmojiEventsIcon sx={{ fontSize: 18 }} /> Reconhecimentos
          </div>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.awards}</p>
        </div>
      )}
    </div>
  )
}

export function ProfileContentsSection({ state, titleClass = 'text-lg font-bold text-gray-900' }: { state: PublicProfileViewState; titleClass?: string }) {
  if (!state.showContents) return null
  const { username, posts, postsLayoutClass, cardClasses, layoutType } = state

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={titleClass}>Conteúdos</h2>
          <p className="text-sm text-gray-600 mt-1">Artigos e materiais publicados no NuFit.</p>
        </div>
        <Link to={`/profile/${username}/conteudos`} className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50" aria-label="Ver todos os conteúdos">
          <AddIcon sx={{ fontSize: 18 }} />
        </Link>
      </div>
      <div className={postsLayoutClass}>
        {posts.slice(0, 10).map((p, index) => {
          const thumbUrl = resolveMediaUrl(p.featuredImage || p.attachments?.find((a) => a.type === 'image')?.url)
          const itemClass = contentItemClass(layoutType, posts.length, index === 0)
          return (
            <Link key={p.id} to={`/conteudos/public/${p.slug}`} className={`${cardClasses.wrapper} ${itemClass} block`}>
              {thumbUrl ? <img src={thumbUrl} alt={p.title} className={cardClasses.image} /> : <div className={`${cardClasses.image} bg-gradient-to-r from-primary-600 to-accent-600`} />}
              <div className={cardClasses.body}>
                <p className={cardClasses.title}>{p.title}</p>
                {p.excerpt ? <p className={cardClasses.excerpt}>{p.excerpt}</p> : null}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function ProfileRecipesSection({ state, titleClass = 'text-lg font-bold text-gray-900' }: { state: PublicProfileViewState; titleClass?: string }) {
  if (!state.showRecipes) return null
  const { username, recipes, recipesLayoutClass, cardClasses, cardStyle, layoutType } = state

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={titleClass}>Receitas</h2>
          <p className="text-sm text-gray-600 mt-1">Receitas compartilhadas publicamente.</p>
        </div>
        <Link to={`/profile/${username}/receitas`} className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50" aria-label="Ver todas as receitas">
          <AddIcon sx={{ fontSize: 18 }} />
        </Link>
      </div>
      <div className={recipesLayoutClass}>
        {recipes.slice(0, 10).map((r, index) => {
          const imageUrl = resolveMediaUrl(r.imageUrls?.[0])
          const itemClass = contentItemClass(layoutType, recipes.length, index === 0)
          return (
            <div key={r.id} className={`${cardClasses.wrapper} ${itemClass}`}>
              {imageUrl ? <img src={imageUrl} alt={r.title} className={cardStyle === 'overlay' ? cardClasses.image : `${cardClasses.image} rounded-lg`} /> : <div className={`${cardClasses.image} ${cardStyle !== 'overlay' ? 'rounded-lg' : ''} bg-gray-100`} />}
              <div className={cardClasses.body}>
                <div className={cardClasses.title}>{r.title}</div>
                {r.description ? <div className={cardClasses.excerpt}>{r.description}</div> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ProfileReviewsSection({ state, className = '' }: { state: PublicProfileViewState; className?: string }) {
  if (!state.showReviews) return null
  const { reviews, canSubmitReview, isAuthenticated, userRole, reviewRating, setReviewRating, reviewComment, setReviewComment, reviewMealPlanId, setReviewMealPlanId, completedMealPlans, submittingReview, removingReviewId, onSubmitReview, onRemoveReviewAsNutritionist, primaryColorSolid } = state

  return (
    <div className={className}>
      <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
      {isAuthenticated && userRole === 'paciente' ? (
        <div className="mt-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Deixe sua avaliação</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Estrelas</label>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)} className="p-1 rounded-md hover:bg-yellow-50">
                    <StarIcon sx={{ fontSize: 24, color: n <= reviewRating ? '#f59e0b' : '#d1d5db' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Plano concluído</label>
              <select value={reviewMealPlanId} onChange={(e) => setReviewMealPlanId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" disabled={completedMealPlans.length === 0}>
                {completedMealPlans.length === 0 ? <option value="">Nenhum plano concluído</option> : completedMealPlans.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title || 'Plano alimentar'}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea value={reviewComment} onChange={(e) => setReviewComment(limitLength(sanitizeText(e.target.value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';']), INPUT_LIMITS.REVIEW_COMMENT))} rows={3} className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-300" placeholder="Conte como foi sua experiência..." />
          <button type="button" onClick={() => void onSubmitReview()} disabled={submittingReview || completedMealPlans.length === 0} className="mt-3 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60">
            {submittingReview ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      ) : null}
      {reviews.length > 0 ? (
        <div className="mt-4 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{r.patientName || 'Paciente'}</div>
                <div className="text-sm inline-flex items-center gap-1"><StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} /> {r.rating}</div>
              </div>
              {r.comment && <p className="text-sm text-gray-700 mt-2">{r.comment}</p>}
              {isAuthenticated && userRole === 'nutricionista' && r.rating <= 2 ? (
                <button
                  type="button"
                  disabled={removingReviewId === r.id}
                  onClick={() => void onRemoveReviewAsNutritionist(r.id)}
                  className="mt-3 px-3 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-700 disabled:opacity-60"
                >
                  {removingReviewId === r.id ? 'Removendo...' : 'Remover do perfil'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : !canSubmitReview ? (
        <p className="text-sm text-gray-600 mt-2">Ainda não há avaliações.</p>
      ) : null}
    </div>
  )
}

export function ProfileContactSection({ state, variant = 'card' }: { state: PublicProfileViewState; variant?: 'card' | 'cta' }) {
  if (!state.showContact) return null
  const { profile, contactEmail, contactPhone, contactWebsite, primaryColorSolid } = state

  return (
    <div className={variant === 'cta' ? 'rounded-2xl p-6 md:p-8 text-white' : 'bg-white border border-gray-200 rounded-2xl p-6'} style={variant === 'cta' && primaryColorSolid ? { backgroundColor: primaryColorSolid } : undefined}>
      <h2 className={`text-lg font-bold ${variant === 'cta' ? 'text-white' : 'text-gray-900'}`}>Contato</h2>
      <div className={`mt-4 space-y-3 text-sm ${variant === 'cta' ? 'text-white/90' : 'text-gray-700'}`}>
        {contactEmail && <div className="flex items-center gap-2"><EmailIcon sx={{ fontSize: 18 }} /><span>{contactEmail}</span></div>}
        {contactPhone && <div className="flex items-center gap-2"><PhoneIcon sx={{ fontSize: 18 }} /><span>{contactPhone}</span></div>}
        {contactWebsite && <div className="flex items-center gap-2"><LanguageIcon sx={{ fontSize: 18 }} /><a href={contactWebsite} className={`font-semibold ${variant === 'cta' ? 'text-white underline' : 'text-primary-700'}`} target="_blank" rel="noreferrer">{contactWebsite}</a></div>}
        {profile.social?.instagram?.url && <div className="flex items-center gap-2"><InstagramIcon sx={{ fontSize: 18 }} /><a href={profile.social.instagram.url} className={`font-semibold ${variant === 'cta' ? 'text-white underline' : 'text-primary-700'}`} target="_blank" rel="noreferrer">Instagram</a></div>}
        {profile.social?.facebook?.url && <div className="flex items-center gap-2"><FacebookIcon sx={{ fontSize: 18 }} /><a href={profile.social.facebook.url} className={`font-semibold ${variant === 'cta' ? 'text-white underline' : 'text-primary-700'}`} target="_blank" rel="noreferrer">Facebook</a></div>}
        {profile.verification?.verified && variant !== 'cta' && <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-800 font-semibold"><VerifiedIcon sx={{ fontSize: 18, color: '#10b981' }} /> Verificado</div>}
      </div>
    </div>
  )
}

export function pageBackgroundClass(customization: PublicProfileViewState['customization']) {
  if (customization.backgroundStyle === 'dark') return 'bg-stone-950'
  if (customization.backgroundStyle === 'gradient') return 'bg-gradient-to-b from-primary-900/10 via-gray-50 to-gray-50'
  return 'bg-gray-50'
}

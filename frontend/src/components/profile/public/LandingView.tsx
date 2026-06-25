import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import type { PublicProfileViewState } from './types'
import {
  pageBackgroundClass,
  ProfileContactSection,
  ProfileContentsSection,
  ProfileFavoriteButton,
  ProfileProfessionalSection,
  ProfileRecipesSection,
  ProfileReviewsSection,
} from './sections'

export default function PublicProfileLandingView({ state }: { state: PublicProfileViewState }) {
  const { profile, customization, showBio, showStats, showServices, rating, patientsCount, avatarUrl, coverUrl, primaryColorSolid } = state

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <section className="relative min-h-[52vh] md:min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600" style={primaryColorSolid ? { backgroundImage: `linear-gradient(135deg, ${primaryColorSolid}, #0f766e)` } : undefined} />
        {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14 pt-24">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-white/90 shadow-2xl overflow-hidden bg-white shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">{profile.displayName?.[0]}</div>}
            </div>
            <div className="flex-1 text-white min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{profile.displayName}</h1>
                    {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 28, color: '#34d399' }} />}
                  </div>
                  {profile.specialty && <p className="mt-2 text-lg text-white/90">{profile.specialty}</p>}
                  {profile.location?.address?.city && (
                    <p className="mt-2 text-sm text-white/80 inline-flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 16 }} />{profile.location.address.city}{profile.location.address.state ? `, ${profile.location.address.state}` : ''}</p>
                  )}
                </div>
                <ProfileFavoriteButton state={state} className="border-white/30 bg-white/10 text-white hover:bg-white/20" />
              </div>
              {showBio && <p className="mt-5 text-base md:text-lg text-white/90 leading-relaxed max-w-3xl">{profile.bio}</p>}
              {showServices && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.specialties?.slice(0, 8).map((s) => <span key={s} className="text-xs font-medium px-3 py-1 rounded-full bg-white/15 text-white backdrop-blur-sm">{s}</span>)}
                </div>
              )}
              {showStats && (rating.count > 0 || patientsCount > 0) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {rating.count > 0 && <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold shadow-lg"><StarIcon sx={{ fontSize: 18, color: '#f59e0b' }} />{rating.avg.toFixed(1)} · {rating.count} avaliações</span>}
                  {patientsCount > 0 && <span className="px-4 py-2 rounded-full bg-white/15 text-white text-sm font-semibold backdrop-blur-sm">{patientsCount} pacientes</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {state.showProfessionalInfo ? (
        <section className="bg-white py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 mb-2">Trajetória</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Experiência e formação</h2>
            <ProfileProfessionalSection state={state} />
          </div>
        </section>
      ) : null}

      {state.showContents ? (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProfileContentsSection state={state} titleClass="text-2xl md:text-3xl font-bold text-gray-900" />
          </div>
        </section>
      ) : null}

      {state.showRecipes ? (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProfileRecipesSection state={state} titleClass="text-2xl md:text-3xl font-bold text-gray-900" />
          </div>
        </section>
      ) : null}

      {state.showReviews ? (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProfileReviewsSection state={state} />
          </div>
        </section>
      ) : null}

      {state.showContact ? (
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProfileContactSection state={state} variant="cta" />
          </div>
        </section>
      ) : null}
    </div>
  )
}

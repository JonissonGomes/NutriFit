import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import type { PublicProfileViewState } from './types'
import { ProfilePageBand, ProfileSplitGrid } from './layout'
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
  const showContentPair = state.showContents && state.showRecipes
  const showBottomPair = state.showReviews && state.showContact

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <section className="relative min-h-[34vh] md:min-h-[40vh] max-h-[520px] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600" style={primaryColorSolid ? { backgroundImage: `linear-gradient(135deg, ${primaryColorSolid}, #0f766e)` } : undefined} />
        {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-10 pt-20 md:pt-24">
          <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white/90 shadow-2xl overflow-hidden bg-white shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">{profile.displayName?.[0]}</div>}
            </div>
            <div className="flex-1 text-white min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{profile.displayName}</h1>
                    {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 26, color: '#34d399' }} />}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:text-base text-white/85">
                    {profile.specialty && <span>{profile.specialty}</span>}
                    {profile.location?.address?.city && (
                      <span className="inline-flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 16 }} />{profile.location.address.city}{profile.location.address.state ? `, ${profile.location.address.state}` : ''}</span>
                    )}
                    {showStats && rating.count > 0 && <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: 16, color: '#fbbf24' }} />{rating.avg.toFixed(1)} · {rating.count}</span>}
                    {showStats && patientsCount > 0 && <span>{patientsCount} pacientes</span>}
                  </div>
                </div>
                <ProfileFavoriteButton state={state} className="border-white/30 bg-white/10 text-white hover:bg-white/20 shrink-0" />
              </div>
              {showBio && <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-none">{profile.bio}</p>}
              {showServices && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.specialties?.slice(0, 10).map((s) => <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/15 text-white backdrop-blur-sm">{s}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {state.showProfessionalInfo ? (
        <ProfilePageBand tone="white">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 mb-1">Trajetória</p>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Experiência e formação</h2>
          <ProfileProfessionalSection state={state} />
        </ProfilePageBand>
      ) : null}

      {showContentPair ? (
        <ProfilePageBand tone="muted">
          <ProfileSplitGrid>
            <ProfileContentsSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" />
            <ProfileRecipesSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" />
          </ProfileSplitGrid>
        </ProfilePageBand>
      ) : (
        <>
          {state.showContents ? (
            <ProfilePageBand tone="muted">
              <ProfileContentsSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" />
            </ProfilePageBand>
          ) : null}
          {state.showRecipes ? (
            <ProfilePageBand tone="white">
              <ProfileRecipesSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" />
            </ProfilePageBand>
          ) : null}
        </>
      )}

      {showBottomPair ? (
        <ProfilePageBand tone="white">
          <ProfileSplitGrid>
            <ProfileReviewsSection state={state} />
            <ProfileContactSection state={state} variant="cta" />
          </ProfileSplitGrid>
        </ProfilePageBand>
      ) : (
        <>
          {state.showReviews ? (
            <ProfilePageBand tone="muted">
              <ProfileReviewsSection state={state} />
            </ProfilePageBand>
          ) : null}
          {state.showContact ? (
            <ProfilePageBand tone="white">
              <ProfileContactSection state={state} variant="cta" />
            </ProfilePageBand>
          ) : null}
        </>
      )}
    </div>
  )
}

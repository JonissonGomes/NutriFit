import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import type { PublicProfileViewState } from './types'
import { ProfileSectionShell, ProfileSplitGrid } from './layout'
import {
  pageBackgroundClass,
  ProfileContactSection,
  ProfileContentsSection,
  ProfileFavoriteButton,
  ProfileProfessionalSection,
  ProfileRecipesSection,
  ProfileReviewsSection,
} from './sections'

export default function PublicProfileBlocksView({ state }: { state: PublicProfileViewState }) {
  const { profile, customization, showBio, showStats, showServices, rating, patientsCount, avatarUrl, coverUrl, primaryColorSolid, primaryColorHexAlpha } = state
  const heroStyle = customization.heroStyle ?? 'full'
  const isMinimalHero = heroStyle === 'minimal' || customization.layout === 'minimalist'
  const coverHeightClass = isMinimalHero ? 'h-20 md:h-24' : heroStyle === 'full' ? 'h-36 md:h-48' : heroStyle === 'compact' ? 'h-28 md:h-36' : 'h-20 md:h-24'
  const showContentPair = state.showContents && state.showRecipes
  const showBottomPair = state.showReviews && state.showContact

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <div className="app-page app-section py-6 md:py-8 space-y-4 md:space-y-5">
        <ProfileSectionShell bare className="overflow-hidden">
          <div className={`${coverHeightClass} bg-gradient-to-r from-primary-600 to-accent-600`} style={primaryColorSolid ? { backgroundImage: `linear-gradient(90deg, ${primaryColorSolid}, #14b8a6)` } : undefined}>
            {coverUrl && <img src={coverUrl} className="w-full h-full object-cover opacity-90" alt="Capa" />}
          </div>
          <div className="p-5 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-5">
              <div className="relative z-10 shrink-0 -mt-10 sm:-mt-12 md:-mt-14">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-600">{profile.displayName?.[0] || 'N'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="app-page-title">{profile.displayName}</h1>
                      {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 22, color: '#10b981' }} />}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                      {profile.specialty && <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-800 font-medium" style={primaryColorHexAlpha && primaryColorSolid ? { backgroundColor: primaryColorHexAlpha, color: primaryColorSolid } : undefined}>{profile.specialty}</span>}
                      {showStats && rating.count > 0 && <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} />{rating.avg.toFixed(1)} ({rating.count})</span>}
                      {showStats && patientsCount > 0 && <span>{patientsCount} paciente(s)</span>}
                      {profile.location?.address?.city && <span className="inline-flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 18 }} />{profile.location.address.city}</span>}
                    </div>
                  </div>
                  <ProfileFavoriteButton state={state} />
                </div>
                {showBio && <p className="mt-3 md:mt-4 text-gray-700 leading-relaxed text-sm md:text-base">{profile.bio}</p>}
                {showServices && (
                  <div className="mt-3 md:mt-4 flex flex-wrap gap-1.5">
                    {profile.specialties?.slice(0, 12).map((s) => <span key={s} className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{s}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ProfileSectionShell>

        {state.showProfessionalInfo ? (
          <ProfileSectionShell title="Trajetória profissional">
            <ProfileProfessionalSection state={state} />
          </ProfileSectionShell>
        ) : null}

        {showContentPair ? (
          <ProfileSplitGrid>
            <ProfileSectionShell><ProfileContentsSection state={state} /></ProfileSectionShell>
            <ProfileSectionShell><ProfileRecipesSection state={state} /></ProfileSectionShell>
          </ProfileSplitGrid>
        ) : (
          <>
            {state.showContents ? <ProfileSectionShell><ProfileContentsSection state={state} /></ProfileSectionShell> : null}
            {state.showRecipes ? <ProfileSectionShell><ProfileRecipesSection state={state} /></ProfileSectionShell> : null}
          </>
        )}

        {showBottomPair ? (
          <ProfileSplitGrid>
            <ProfileSectionShell><ProfileReviewsSection state={state} /></ProfileSectionShell>
            <ProfileContactSection state={state} />
          </ProfileSplitGrid>
        ) : (
          <>
            {state.showReviews ? <ProfileSectionShell><ProfileReviewsSection state={state} /></ProfileSectionShell> : null}
            {state.showContact ? <ProfileContactSection state={state} /> : null}
          </>
        )}
      </div>
    </div>
  )
}

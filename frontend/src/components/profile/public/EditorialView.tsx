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

export default function PublicProfileEditorialView({ state }: { state: PublicProfileViewState }) {
  const { profile, customization, showBio, showStats, showServices, rating, patientsCount, avatarUrl, primaryColorSolid } = state
  const showContentPair = state.showContents && state.showRecipes
  const showBottomPair = state.showReviews && state.showContact

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <header className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8 border-b border-gray-200 pb-8 md:pb-10">
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-gray-100 shadow-lg ring-1 ring-gray-200">
              {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-light text-gray-400">{profile.displayName?.[0]}</div>}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Nutrição profissional</p>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{profile.displayName}</h1>
                  {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 24, color: '#10b981' }} />}
                </div>
                {profile.specialty && <p className="mt-2 text-lg text-gray-600">{profile.specialty}</p>}
                <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-gray-600">
                  {showStats && rating.count > 0 && <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} />{rating.avg.toFixed(1)} ({rating.count})</span>}
                  {showStats && patientsCount > 0 && <span>{patientsCount} pacientes</span>}
                  {profile.location?.address?.city && <span className="inline-flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 18 }} />{profile.location.address.city}</span>}
                </div>
              </div>
              <div className="flex justify-center md:justify-end shrink-0">
                <ProfileFavoriteButton state={state} />
              </div>
            </div>
            {showBio && <p className="mt-4 text-base md:text-lg text-gray-700 leading-relaxed">{profile.bio}</p>}
            {showServices && (
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                {profile.specialties?.map((s) => <span key={s} className="text-sm px-3 py-1 border border-gray-300 rounded-full text-gray-700">{s}</span>)}
              </div>
            )}
          </div>
        </header>

        <div className="py-8 md:py-10 space-y-6 md:space-y-8">
          {state.showProfessionalInfo ? (
            <ProfileSectionShell title="Trajetória profissional">
              <ProfileProfessionalSection state={state} />
            </ProfileSectionShell>
          ) : null}

          {showContentPair ? (
            <ProfileSplitGrid>
              <ProfileSectionShell><ProfileContentsSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" /></ProfileSectionShell>
              <ProfileSectionShell><ProfileRecipesSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" /></ProfileSectionShell>
            </ProfileSplitGrid>
          ) : (
            <>
              {state.showContents ? <ProfileSectionShell><ProfileContentsSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" /></ProfileSectionShell> : null}
              {state.showRecipes ? <ProfileSectionShell><ProfileRecipesSection state={state} titleClass="text-xl md:text-2xl font-bold text-gray-900" /></ProfileSectionShell> : null}
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
    </div>
  )
}

import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import type { PublicProfileViewState } from './types'
import { ProfileSectionShell, ProfileSplitGrid } from './layout'
import {
  pageBackgroundClass,
  ProfileContentsSection,
  ProfileFavoriteButton,
  ProfileProfessionalSection,
  ProfileRecipesSection,
  ProfileReviewsSection,
} from './sections'

export default function PublicProfileStudioView({ state }: { state: PublicProfileViewState }) {
  const { profile, customization, showBio, showStats, showServices, rating, patientsCount, avatarUrl, coverUrl, primaryColorSolid, primaryColorHexAlpha } = state
  const showContentPair = state.showContents && state.showRecipes

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-20 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {coverUrl ? <div className="h-16 md:h-20 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} /> : <div className="h-16 md:h-20 bg-gradient-to-r from-primary-600 to-accent-600" style={primaryColorSolid ? { backgroundImage: `linear-gradient(90deg, ${primaryColorSolid}, #14b8a6)` } : undefined} />}
              <div className="p-4 md:p-5 -mt-8 relative">
                <div className="w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-xl border-4 border-white shadow-md overflow-hidden bg-gray-100">
                  {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{profile.displayName?.[0]}</div>}
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">{profile.displayName}</h1>
                    {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 18, color: '#10b981' }} />}
                  </div>
                  {profile.specialty && <p className="text-sm text-gray-600 mt-1">{profile.specialty}</p>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <ProfileFavoriteButton state={state} />
                </div>
                {showBio && <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-5">{profile.bio}</p>}
                <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                  {showStats && rating.count > 0 && <div className="flex items-center gap-1"><StarIcon sx={{ fontSize: 16, color: primaryColorSolid ?? '#f59e0b' }} />{rating.avg.toFixed(1)} ({rating.count})</div>}
                  {showStats && patientsCount > 0 && <div>{patientsCount} paciente(s)</div>}
                  {profile.location?.address?.city && <div className="flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 16 }} />{profile.location.address.city}</div>}
                </div>
                {showServices && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {profile.specialties?.map((s) => (
                      <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700" style={primaryColorHexAlpha && primaryColorSolid ? { backgroundColor: primaryColorHexAlpha, color: primaryColorSolid } : undefined}>{s}</span>
                    ))}
                  </div>
                )}
                {state.showContact && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm text-gray-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Contato</p>
                    {state.contactEmail && <p className="truncate">{state.contactEmail}</p>}
                    {state.contactPhone && <p>{state.contactPhone}</p>}
                    {state.contactWebsite && <a href={state.contactWebsite} className="text-primary-700 font-medium block truncate" target="_blank" rel="noreferrer">Website</a>}
                    {profile.social?.instagram?.url && <a href={profile.social.instagram.url} className="text-primary-700 font-medium block truncate" target="_blank" rel="noreferrer">Instagram</a>}
                    {profile.social?.facebook?.url && <a href={profile.social.facebook.url} className="text-primary-700 font-medium block truncate" target="_blank" rel="noreferrer">Facebook</a>}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9 space-y-4 md:space-y-5 min-w-0">
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

            {state.showReviews ? <ProfileSectionShell><ProfileReviewsSection state={state} /></ProfileSectionShell> : null}
          </main>
        </div>
      </div>
    </div>
  )
}

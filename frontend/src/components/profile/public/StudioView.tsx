import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedIcon from '@mui/icons-material/Verified'
import type { PublicProfileViewState } from './types'
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

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-20 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {coverUrl ? <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} /> : <div className="h-24 bg-gradient-to-r from-primary-600 to-accent-600" style={primaryColorSolid ? { backgroundImage: `linear-gradient(90deg, ${primaryColorSolid}, #14b8a6)` } : undefined} />}
              <div className="p-5 -mt-10 relative">
                <div className="w-20 h-20 rounded-xl border-4 border-white shadow-md overflow-hidden bg-gray-100 mx-auto">
                  {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{profile.displayName?.[0]}</div>}
                </div>
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <h1 className="text-lg font-bold text-gray-900">{profile.displayName}</h1>
                    {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 18, color: '#10b981' }} />}
                  </div>
                  {profile.specialty && <p className="text-sm text-gray-600 mt-1">{profile.specialty}</p>}
                </div>
                <div className="mt-4 flex justify-center">
                  <ProfileFavoriteButton state={state} />
                </div>
                {showBio && <p className="mt-4 text-sm text-gray-600 leading-relaxed text-center">{profile.bio}</p>}
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {showStats && rating.count > 0 && <div className="flex items-center justify-center gap-1"><StarIcon sx={{ fontSize: 16, color: primaryColorSolid ?? '#f59e0b' }} />{rating.avg.toFixed(1)} ({rating.count})</div>}
                  {showStats && patientsCount > 0 && <div className="text-center">{patientsCount} paciente(s)</div>}
                  {profile.location?.address?.city && <div className="flex items-center justify-center gap-1"><LocationOnIcon sx={{ fontSize: 16 }} />{profile.location.address.city}</div>}
                </div>
                {showServices && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {profile.specialties?.slice(0, 6).map((s) => (
                      <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700" style={primaryColorHexAlpha && primaryColorSolid ? { backgroundColor: primaryColorHexAlpha, color: primaryColorSolid } : undefined}>{s}</span>
                    ))}
                  </div>
                )}
                {state.showContact && (
                  <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm text-gray-600 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Contato</p>
                    {state.contactEmail && <p className="truncate">{state.contactEmail}</p>}
                    {state.contactPhone && <p>{state.contactPhone}</p>}
                    {state.contactWebsite && <a href={state.contactWebsite} className="text-primary-700 font-medium block truncate" target="_blank" rel="noreferrer">Website</a>}
                    {profile.social?.instagram?.url && <a href={profile.social.instagram.url} className="text-primary-700 font-medium block" target="_blank" rel="noreferrer">Instagram</a>}
                    {profile.social?.facebook?.url && <a href={profile.social.facebook.url} className="text-primary-700 font-medium block" target="_blank" rel="noreferrer">Facebook</a>}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            {state.showProfessionalInfo ? <div className="app-card rounded-2xl"><h2 className="text-lg font-bold text-gray-900 mb-4">Trajetória profissional</h2><ProfileProfessionalSection state={state} /></div> : null}
            {state.showContents ? <div className="app-card rounded-2xl"><ProfileContentsSection state={state} /></div> : null}
            {state.showRecipes ? <div className="app-card rounded-2xl"><ProfileRecipesSection state={state} /></div> : null}
            {state.showReviews ? <div className="app-card rounded-2xl"><ProfileReviewsSection state={state} /></div> : null}
          </main>
        </div>
      </div>
    </div>
  )
}

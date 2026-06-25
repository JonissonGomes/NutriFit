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

export default function PublicProfileBlocksView({ state }: { state: PublicProfileViewState }) {
  const { profile, customization, showBio, showStats, showServices, rating, patientsCount, avatarUrl, coverUrl, primaryColorSolid, primaryColorHexAlpha } = state
  const heroStyle = customization.heroStyle ?? 'full'
  const isMinimalHero = heroStyle === 'minimal' || customization.layout === 'minimalist'
  const coverHeightClass = isMinimalHero ? 'h-20 md:h-24' : heroStyle === 'full' ? 'h-40 md:h-56' : heroStyle === 'compact' ? 'h-28 md:h-36' : 'h-20 md:h-24'

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <div className="app-page app-section py-8 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className={`${coverHeightClass} bg-gradient-to-r from-primary-600 to-accent-600`} style={primaryColorSolid ? { backgroundImage: `linear-gradient(90deg, ${primaryColorSolid}, #14b8a6)` } : undefined}>
            {coverUrl && <img src={coverUrl} className="w-full h-full object-cover opacity-90" alt="Capa" />}
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              <div className="relative z-10 -mt-12 md:-mt-16">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-600">{profile.displayName?.[0] || 'N'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="app-page-title truncate">{profile.displayName}</h1>
                      {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 22, color: '#10b981' }} />}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                      {showStats && rating.count > 0 && <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} />{rating.avg.toFixed(1)} ({rating.count})</span>}
                      {showStats && patientsCount > 0 && <span>{patientsCount} paciente(s)</span>}
                      {profile.location?.address?.city && <span className="inline-flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 18 }} />{profile.location.address.city}</span>}
                      {profile.specialty && <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-800" style={primaryColorHexAlpha && primaryColorSolid ? { backgroundColor: primaryColorHexAlpha, color: primaryColorSolid } : undefined}>{profile.specialty}</span>}
                    </div>
                  </div>
                  <ProfileFavoriteButton state={state} />
                </div>
                {showBio && <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>}
                {showServices && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.specialties?.slice(0, 10).map((s) => <span key={s} className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{s}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {state.showProfessionalInfo ? <div className="app-card rounded-2xl"><h2 className="text-lg font-bold text-gray-900 mb-4">Trajetória profissional</h2><ProfileProfessionalSection state={state} /></div> : null}
        {state.showContents ? <div className="app-card rounded-2xl"><ProfileContentsSection state={state} /></div> : null}
        {state.showRecipes ? <div className="app-card rounded-2xl"><ProfileRecipesSection state={state} /></div> : null}
        {(state.showReviews || state.showContact) ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.showReviews ? <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6"><ProfileReviewsSection state={state} /></div> : null}
            {state.showContact ? <ProfileContactSection state={state} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

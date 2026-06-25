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

export default function PublicProfileEditorialView({ state }: { state: PublicProfileViewState }) {
  const { profile, customization, showBio, showStats, showServices, rating, patientsCount, avatarUrl, primaryColorSolid } = state

  return (
    <div className={`min-h-screen ${pageBackgroundClass(customization)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start border-b border-gray-200 pb-10">
          <div className="lg:col-span-4">
            <div className="w-full max-w-xs aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              {avatarUrl ? <img src={avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl font-light text-gray-400">{profile.displayName?.[0]}</div>}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Nutrição profissional</p>
                <div className="flex items-center gap-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">{profile.displayName}</h1>
                  {profile.verification?.verified && <VerifiedIcon sx={{ fontSize: 26, color: '#10b981' }} />}
                </div>
                {profile.specialty && <p className="mt-3 text-xl text-gray-600">{profile.specialty}</p>}
              </div>
              <ProfileFavoriteButton state={state} />
            </div>
            {showBio && <p className="mt-6 text-lg text-gray-700 leading-relaxed">{profile.bio}</p>}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
              {showStats && rating.count > 0 && <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: 18, color: primaryColorSolid ?? '#f59e0b' }} />{rating.avg.toFixed(1)} ({rating.count})</span>}
              {showStats && patientsCount > 0 && <span>{patientsCount} pacientes</span>}
              {profile.location?.address?.city && <span className="inline-flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 18 }} />{profile.location.address.city}</span>}
            </div>
            {showServices && (
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.specialties?.map((s) => <span key={s} className="text-sm px-3 py-1 border border-gray-300 rounded-full text-gray-700">{s}</span>)}
              </div>
            )}
          </div>
        </header>

        <div className="py-10 space-y-12">
          {state.showProfessionalInfo ? (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Trajetória profissional</h2>
              <ProfileProfessionalSection state={state} />
            </section>
          ) : null}
          {state.showContents ? <section><ProfileContentsSection state={state} titleClass="text-3xl font-bold text-gray-900" /></section> : null}
          {state.showRecipes ? <section><ProfileRecipesSection state={state} titleClass="text-3xl font-bold text-gray-900" /></section> : null}
          {state.showReviews ? <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"><ProfileReviewsSection state={state} /></section> : null}
          {state.showContact ? <section><ProfileContactSection state={state} /></section> : null}
        </div>
      </div>
    </div>
  )
}

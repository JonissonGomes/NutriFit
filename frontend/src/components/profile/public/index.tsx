import type { ProfilePageStyle } from '../../../services/profile.service'
import PublicProfileBlocksView from './BlocksView'
import PublicProfileEditorialView from './EditorialView'
import PublicProfileLandingView from './LandingView'
import PublicProfileStudioView from './StudioView'
import type { PublicProfileViewState } from './types'

export function PublicProfilePageView({ state }: { state: PublicProfileViewState }) {
  const pageStyle: ProfilePageStyle = state.customization.pageStyle ?? 'blocks'

  switch (pageStyle) {
    case 'landing':
      return <PublicProfileLandingView state={state} />
    case 'editorial':
      return <PublicProfileEditorialView state={state} />
    case 'studio':
      return <PublicProfileStudioView state={state} />
    case 'blocks':
    default:
      return <PublicProfileBlocksView state={state} />
  }
}

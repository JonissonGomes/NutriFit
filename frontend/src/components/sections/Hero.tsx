import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FolderIcon from '@mui/icons-material/Folder'
import { useAuth } from '../../contexts/AuthContext'

const Hero = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const handleUserTypeSelect = () => {
    navigate('/explore')
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background: gradiente saúde/nutrição (verde suave) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1920&h=1080&fit=crop")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Overlay verde mais transparente para deixar a imagem aparecer */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/70 via-primary-900/55 to-primary-900/75" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary-500/20 backdrop-blur-sm border border-primary-400/30 text-primary-100 text-xs md:text-sm font-medium mb-6 md:mb-8">
            <RestaurantIcon sx={{ fontSize: 16, marginRight: 1 }} />
            <span>
              {isAuthenticated
                ? user?.type === 'nutricionista'
                  ? 'Bem-vindo de volta, nutricionista!'
                  : 'Bem-vindo de volta!'
                : 'Plataforma completa para nutricionistas e pacientes'}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white mb-6 md:mb-8 leading-[0.95] tracking-tight px-4">
            {isAuthenticated ? (
              user?.type === 'nutricionista' ? (
                <>
                  Gerencie seus{' '}
                  <span className="text-accent-400">planos alimentares</span>{' '}
                  com eficiência
                </>
              ) : (
                <>
                  Acompanhe sua{' '}
                  <span className="text-accent-400">nutrição</span>{' '}
                  e evolução
                </>
              )
            ) : (
              <>
                Cuide da sua{' '}
                <span className="text-accent-400">saúde nutricional</span>{' '}
                com quem entende
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-stone-200 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4 font-light">
            {isAuthenticated ? (
              user?.type === 'nutricionista' ? (
                'Acesse seu dashboard, prescreva planos alimentares, acompanhe pacientes e organize sua agenda profissional.'
              ) : (
                'Acompanhe seu plano alimentar, diário e metas com o suporte do seu nutricionista.'
              )
            ) : (
              'A plataforma que conecta nutricionistas e pacientes. Planos alimentares personalizados, anamnese, diário alimentar e acompanhamento em um só lugar.'
            )}
          </p>

          {/* User Type Selection - Only show if not authenticated */}
          {!isAuthenticated && (
            <div className="mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              <div className="bg-stone-900/60 backdrop-blur-md rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-stone-700/50 flex flex-col gap-2">
                <button
                  onClick={() => handleUserTypeSelect()}
                  className="w-full px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-lg shadow-primary-600/50 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/60"
                >
                  <SearchIcon sx={{ fontSize: 20 }} />
                  Encontrar profissionais
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-accent-500 text-white shadow-lg shadow-accent-500/50 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/60"
                >
                  <DashboardIcon sx={{ fontSize: 20 }} />
                  Meu espaço
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show if authenticated */}
          {isAuthenticated && (
            <div className="mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              <div className="bg-stone-900/60 backdrop-blur-md rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-stone-700/50 flex flex-col sm:flex-row gap-2">
                {user?.type === 'nutricionista' ? (
                  <>
                    <button
                      onClick={() => navigate('/nutritionist/dashboard')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-lg shadow-primary-600/50 hover:bg-primary-700"
                    >
                      <DashboardIcon sx={{ fontSize: 20 }} />
                      Meu espaço
                    </button>
                    <button
                      onClick={() => navigate('/nutritionist/meal-plans')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-accent-500 text-white shadow-lg shadow-accent-500/50 hover:bg-accent-600"
                    >
                      <FolderIcon sx={{ fontSize: 20 }} />
                      Meus Planos Alimentares
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/patient/dashboard')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-lg shadow-primary-600/50 hover:bg-primary-700"
                    >
                      <DashboardIcon sx={{ fontSize: 20 }} />
                      Meu espaço
                    </button>
                    <button
                      onClick={() => navigate('/explore')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-accent-500 text-white shadow-lg shadow-accent-500/50 hover:bg-accent-600"
                    >
                      <SearchIcon sx={{ fontSize: 20 }} />
                      Buscar Nutricionistas
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-stone-300 px-4">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-primary-400 rounded-full animate-pulse" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-primary-400 rounded-full animate-pulse" />
              <span>Teste gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-primary-400 rounded-full animate-pulse" />
              <span>Foco em saúde e nutrição</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 md:h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </div>
    </section>
  )
}

export default Hero

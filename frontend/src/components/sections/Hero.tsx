import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FolderIcon from '@mui/icons-material/Folder'
import { useAuth } from '../../contexts/AuthContext'

const Hero = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const handleUserTypeSelect = (type: 'cliente' | 'arquiteto') => {
    if (type === 'cliente') {
      navigate('/explore')
    } else {
      navigate('/signup')
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop"
        >
          <source
            src="https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_25fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/70 to-stone-900/90"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary-500/20 backdrop-blur-sm border border-primary-400/30 text-primary-100 text-xs md:text-sm font-medium mb-6 md:mb-8">
            <ApartmentIcon sx={{ fontSize: 16, marginRight: 1 }} />
            <span>
              {isAuthenticated 
                ? (user?.type === 'arquiteto' 
                    ? 'Bem-vindo de volta, arquiteto!' 
                    : 'Bem-vindo de volta!')
                : 'Plataforma completa para arquitetos e clientes'}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white mb-6 md:mb-8 leading-[0.95] tracking-tight px-4">
            {isAuthenticated ? (
              user?.type === 'arquiteto' ? (
                <>
                  Gerencie seus{' '}
                  <span className="text-accent-400">projetos arquitetônicos</span>{' '}
                  com eficiência
                </>
              ) : (
                <>
                  Acompanhe seus{' '}
                  <span className="text-accent-400">projetos arquitetônicos</span>{' '}
                  em andamento
                </>
              )
            ) : (
              <>
                Transforme seus{' '}
                <span className="text-accent-400">projetos arquitetônicos</span>{' '}
                em realidade
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-stone-200 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4 font-light">
            {isAuthenticated ? (
              user?.type === 'arquiteto' ? (
                'Acesse seu dashboard, gerencie projetos, comunique-se com clientes e organize sua agenda profissional.'
              ) : (
                'Visualize seus projetos em andamento, acompanhe aprovações e mantenha contato com seus arquitetos.'
              )
            ) : (
              'A plataforma que conecta arquitetos e clientes. Apresente projetos, receba aprovações e gerencie tudo em um só lugar.'
            )}
          </p>

          {/* User Type Selection - Only show if not authenticated */}
          {!isAuthenticated && (
            <div className="mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              <div className="bg-stone-900/60 backdrop-blur-md rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-stone-700/50 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleUserTypeSelect('cliente')}
                  className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-lg shadow-primary-600/50 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/60 transform hover:scale-105"
                >
                  <SearchIcon sx={{ fontSize: 20 }} />
                  Quero contratar um arquiteto
                </button>
                <button
                  onClick={() => handleUserTypeSelect('arquiteto')}
                  className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-accent-500 text-white shadow-lg shadow-accent-500/50 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/60 transform hover:scale-105"
                >
                  <PersonIcon sx={{ fontSize: 20 }} />
                  Sou um arquiteto
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show if authenticated */}
          {isAuthenticated && (
            <div className="mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              <div className="bg-stone-900/60 backdrop-blur-md rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-stone-700/50 flex flex-col sm:flex-row gap-2">
                {user?.type === 'arquiteto' ? (
                  <>
                    <button
                      onClick={() => navigate('/architect/dashboard')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-lg shadow-primary-600/50 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/60 transform hover:scale-105"
                    >
                      <DashboardIcon sx={{ fontSize: 20 }} />
                      Acessar Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/architect/projects')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-accent-500 text-white shadow-lg shadow-accent-500/50 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/60 transform hover:scale-105"
                    >
                      <FolderIcon sx={{ fontSize: 20 }} />
                      Meus Projetos
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/client/dashboard')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-primary-600 text-white shadow-lg shadow-primary-600/50 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/60 transform hover:scale-105"
                    >
                      <DashboardIcon sx={{ fontSize: 20 }} />
                      Acessar Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/explore')}
                      className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 bg-accent-500 text-white shadow-lg shadow-accent-500/50 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/60 transform hover:scale-105"
                    >
                      <SearchIcon sx={{ fontSize: 20 }} />
                      Buscar Arquitetos
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-stone-300 px-4">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>Teste gratuito de 14 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>Suporte 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 md:h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero

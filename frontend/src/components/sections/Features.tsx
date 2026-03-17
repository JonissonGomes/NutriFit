import RestaurantIcon from '@mui/icons-material/Restaurant'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ChatIcon from '@mui/icons-material/Chat'
import DescriptionIcon from '@mui/icons-material/Description'
import PublicIcon from '@mui/icons-material/Public'
import CategoryIcon from '@mui/icons-material/Category'
import LockIcon from '@mui/icons-material/Lock'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const Features = () => {
  const mainFeatures: Feature[] = [
    {
      icon: <RestaurantIcon sx={{ fontSize: 28 }} />,
      title: 'Planos Alimentares',
      description: 'Prescreva cardápios personalizados com macros, refeições e substituições. Modelos prontos e biblioteca de alimentos.',
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
      title: 'Anamnese Digital',
      description: 'Formulários personalizáveis, biblioteca de perguntas e resumos com IA para uma avaliação completa do paciente.',
    },
    {
      icon: <PhotoCameraIcon sx={{ fontSize: 28 }} />,
      title: 'Diário Alimentar',
      description: 'Pacientes registram refeições por foto, texto ou áudio. Análise por IA opcional para aderência ao plano.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      title: 'Avaliação Antropométrica',
      description: 'Acompanhe peso, medidas e evolução ao longo do tempo. Gráficos e histórico para cada paciente.',
    },
    {
      icon: <ChatIcon sx={{ fontSize: 28 }} />,
      title: 'Comunicação com Pacientes',
      description: 'Chat integrado, comentários no diário alimentar e notificações. Tudo em um só lugar.',
    },
    {
      icon: <DescriptionIcon sx={{ fontSize: 28 }} />,
      title: 'Metas e Objetivos',
      description: 'Defina metas nutricionais e checklists de hábitos. Acompanhe o progresso com check-ins.',
    },
  ]

  const additionalFeatures = [
    {
      icon: <PublicIcon sx={{ fontSize: 32 }} />,
      title: 'Perfil público',
      description: 'Página profissional para pacientes encontrarem você',
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100',
    },
    {
      icon: <CategoryIcon sx={{ fontSize: 32 }} />,
      title: 'Por objetivo',
      description: 'Emagrecimento, ganho de massa, performance, saúde',
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100',
    },
    {
      icon: <LockIcon sx={{ fontSize: 32 }} />,
      title: 'Dados seguros',
      description: 'Informações de saúde protegidas e em conformidade',
      gradient: 'from-primary-600 to-primary-700',
      bgGradient: 'from-primary-50 to-primary-100',
    },
  ]

  return (
    <section id="features" className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white via-primary-50/30 to-white overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200 text-primary-700 text-xs md:text-sm font-semibold mb-4 md:mb-6 shadow-sm">
            <AutoAwesomeIcon sx={{ fontSize: 16 }} />
            <span>Funcionalidades Completas</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
            Tudo para sua{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              prática nutricional
            </span>
          </h2>

          <div className="relative px-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-200 to-accent-200 rounded-xl md:rounded-2xl blur-xl opacity-20" />
            <div className="relative bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border border-primary-100 shadow-xl">
              <p className="text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed">
                Prescreva planos alimentares, acompanhe pacientes com diário e avaliações, use anamnese digital e ferramentas opcionais de IA. Tudo em uma única plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {mainFeatures.map((feature, index) => (
            <div key={index} className="group relative h-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-500" />
              <div className="relative h-full p-5 md:p-6 lg:p-7 rounded-xl md:rounded-2xl bg-white border-2 border-gray-200 group-hover:border-primary-300 shadow-md group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 md:group-hover:-translate-y-2">
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4 md:mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <div className="space-y-2 md:space-y-3">
                  <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-[15px]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative my-12 md:my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 py-1.5 md:px-6 md:py-2 bg-white text-xs md:text-sm font-semibold text-primary-700 rounded-full border border-primary-200">
              Recursos Adicionais
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${feature.gradient} rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-500`} />
              <div className={`relative text-center p-6 md:p-8 lg:p-10 rounded-xl md:rounded-2xl bg-gradient-to-br ${feature.bgGradient} border border-primary-100 hover:border-primary-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="relative inline-block mb-4 md:mb-5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-lg md:rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity`} />
                  <div className={`relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-xl`}>
                    {feature.icon}
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 mb-2 md:mb-3 text-base md:text-lg lg:text-xl">
                  {feature.title}
                </h4>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 text-center px-4">
          <div className="inline-block w-full max-w-3xl p-6 md:p-8 lg:p-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-2xl">
            <p className="text-white text-sm md:text-base lg:text-lg font-medium mb-4 md:mb-6 px-2">
              Tudo que você precisa para prescrever, acompanhar e evoluir seus pacientes em um só lugar
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <a
                href="/signup"
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-primary-700 rounded-lg md:rounded-xl hover:bg-primary-50 transition-all duration-200 font-bold text-sm md:text-base shadow-lg hover:shadow-xl"
              >
                Começar Gratuitamente
              </a>
              <a
                href="/explore"
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg md:rounded-xl hover:bg-white/20 transition-all duration-200 font-bold text-sm md:text-base"
              >
                Ver Nutricionistas
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features

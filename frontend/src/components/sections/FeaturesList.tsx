import {
  Search, Users, MessageSquare, FileText, Calendar,
  Building2, CheckSquare, BarChart3, Utensils, ClipboardList,
  Target, Shield, Apple
} from 'lucide-react'

interface FeatureCategory {
  title: string
  description: string
  features: {
    icon: React.ReactNode
    title: string
    description: string
  }[]
}

const FeaturesList = () => {
  const patientFeatures: FeatureCategory = {
    title: 'Para Pacientes',
    description: 'Recursos para quem busca acompanhamento nutricional',
    features: [
      {
        icon: <Search className="h-5 w-5" />,
        title: 'Encontrar Nutricionista',
        description: 'Busque por especialidade, objetivo ou localização e veja perfis verificados',
      },
      {
        icon: <Apple className="h-5 w-5" />,
        title: 'Plano Alimentar',
        description: 'Acesse seu cardápio personalizado, refeições e lista de substituições',
      },
      {
        icon: <ClipboardList className="h-5 w-5" />,
        title: 'Diário Alimentar',
        description: 'Registre refeições por foto, texto ou áudio e acompanhe sua evolução',
      },
      {
        icon: <Target className="h-5 w-5" />,
        title: 'Metas e Hábitos',
        description: 'Checklist de hábitos e metas definidas com seu nutricionista',
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'Evolução',
        description: 'Gráficos de peso e medidas ao longo do tempo',
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        title: 'Chat com Nutricionista',
        description: 'Tire dúvidas e receba orientações direto na plataforma',
      },
      {
        icon: <FileText className="h-5 w-5" />,
        title: 'Anamnese e Questionários',
        description: 'Responda formulários de avaliação de forma digital',
      },
      {
        icon: <Shield className="h-5 w-5" />,
        title: 'Dados Seguros',
        description: 'Suas informações de saúde protegidas com privacidade',
      },
    ],
  }

  const professionalFeatures: FeatureCategory = {
    title: 'Para Nutricionistas',
    description: 'Ferramentas para prescrever e acompanhar pacientes',
    features: [
      {
        icon: <Users className="h-5 w-5" />,
        title: 'CRM de Pacientes',
        description: 'Cadastro, histórico e gestão de pacientes em um só lugar',
      },
      {
        icon: <Utensils className="h-5 w-5" />,
        title: 'Planos Alimentares',
        description: 'Prescrição com macros, refeições e substituições. Modelos e IA opcional',
      },
      {
        icon: <ClipboardList className="h-5 w-5" />,
        title: 'Anamnese Digital',
        description: 'Templates personalizáveis, biblioteca de perguntas e resumo com IA',
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'Avaliação Antropométrica',
        description: 'Registro de peso, medidas e evolução com gráficos',
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        title: 'Agenda e Consultas',
        description: 'Eventos, lembretes e integração com sua rotina',
      },
      {
        icon: <FileText className="h-5 w-5" />,
        title: 'Diário do Paciente',
        description: 'Visualize registros alimentares e comente para orientar',
      },
      {
        icon: <Target className="h-5 w-5" />,
        title: 'Metas e Check-ins',
        description: 'Defina objetivos e acompanhe o progresso do paciente',
      },
      {
        icon: <Building2 className="h-5 w-5" />,
        title: 'Perfil Público',
        description: 'Página profissional para pacientes encontrarem você',
      },
      {
        icon: <CheckSquare className="h-5 w-5" />,
        title: 'Exames e Questionários',
        description: 'Upload de exames, interpretação com IA e questionários de saúde',
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        title: 'Comunicação Centralizada',
        description: 'Chat, notificações e mensagens em um único canal',
      },
    ],
  }

  return (
    <section id="funcionalidades" className="py-20 md:py-32 bg-gradient-to-b from-white via-primary-50/20 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Funcionalidades para todos
          </h2>
          <p className="text-xl text-gray-600">
            Uma plataforma completa para nutricionistas prescreverem e para pacientes acompanharem sua saúde nutricional
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="bg-white rounded-2xl border border-primary-100 p-8 shadow-lg">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{patientFeatures.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{patientFeatures.description}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patientFeatures.features.map((feature, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg text-primary-600 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-primary-100 p-8 shadow-lg">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-accent-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-accent-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{professionalFeatures.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{professionalFeatures.description}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {professionalFeatures.features.map((feature, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-100 hover:border-accent-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent-50 rounded-lg text-accent-600 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Quer conhecer todas as funcionalidades em detalhes?
          </p>
          <a
            href="#planos"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Ver Planos e Preços
          </a>
        </div>
      </div>
    </section>
  )
}

export default FeaturesList

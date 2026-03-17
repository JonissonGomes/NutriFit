import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Link } from 'react-router-dom'

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: { text: string; included: boolean }[]
  highlighted: boolean
  cta: string
}

const Pricing = () => {
  const plans: PricingPlan[] = [
    {
      name: 'Freelancer',
      price: 'R$ 149',
      period: '/mês',
      description: 'Para nutricionistas autônomos e freelancers',
      highlighted: false,
      cta: 'Começar teste grátis',
      features: [
        { text: 'Até 10 pacientes ativos', included: true },
        { text: '50GB de armazenamento', included: true },
        { text: 'Planos alimentares com macros', included: true },
        { text: 'Anamnese digital', included: true },
        { text: 'Diário alimentar do paciente', included: true },
        { text: 'Portfólio público', included: true },
        { text: 'Lista de compras (por plano)', included: true },
        { text: 'Relatórios básicos', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'Gestão de equipe', included: false },
        { text: 'White label', included: false },
      ],
    },
    {
      name: 'Escritório',
      price: 'R$ 399',
      period: '/mês',
      description: 'Para consultórios e equipes de nutrição',
      highlighted: true,
      cta: 'Começar teste grátis',
      features: [
        { text: 'Pacientes ilimitados', included: true },
        { text: '500GB de armazenamento', included: true },
        { text: 'Planos alimentares ilimitados', included: true },
        { text: 'Anamnese e questionários', included: true },
        { text: 'Diário com foto (beta)', included: true },
        { text: 'Portfólio público categorizado', included: true },
        { text: 'Relatórios e evolução do paciente', included: true },
        { text: 'Agenda e lembretes', included: true },
        { text: 'Gestão de equipe (até 10 membros)', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'White label', included: false },
      ],
    },
    {
      name: 'Rede',
      price: 'R$ 999',
      period: '/mês',
      description: 'Para redes de escritórios e franquias',
      highlighted: false,
      cta: 'Falar com vendas',
      features: [
        { text: 'Projetos ilimitados', included: true },
        { text: '2TB de armazenamento', included: true },
        { text: 'Upload de plantas, renders e fotos', included: true },
        { text: 'Sistema de aprovação customizável', included: true },
        { text: 'Visualizador de plantas avançado', included: true },
        { text: 'Múltiplos portfólios públicos', included: true },
        { text: 'Timeline e comparação de propostas', included: true },
        { text: 'Sistema completo de contratos', included: true },
        { text: 'Gestão de equipe ilimitada', included: true },
        { text: 'Suporte prioritário 24/7', included: true },
        { text: 'White label completo', included: true },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Planos para arquitetos de todos os portes
            </h1>
            <p className="text-base md:text-lg text-primary-100 mb-6">
              Escolha o plano ideal para seu escritório. Cancele quando quiser, sem compromisso.
            </p>
            <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-medium">
              <AutoAwesomeIcon sx={{ fontSize: 16, marginRight: 1 }} />
              14 dias de teste grátis em todos os planos pagos
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-white shadow-2xl scale-105 border-2 border-primary-500'
                    : 'bg-white shadow-lg hover:shadow-xl border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-center py-1.5 text-xs font-semibold">
                    MAIS POPULAR
                  </div>
                )}

                <div className={`p-6 md:p-8 ${plan.highlighted ? 'pt-10 md:pt-12' : ''}`}>
                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-sm md:text-base text-gray-600">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to="/signup"
                    className={`block w-full text-center py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 mb-6 ${
                      plan.highlighted
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <CheckIcon sx={{ fontSize: 18, color: '#10b981', flexShrink: 0 }} />
                        ) : (
                          <CloseIcon sx={{ fontSize: 18, color: '#d1d5db', flexShrink: 0 }} />
                        )}
                        <span
                          className={`text-xs md:text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Perguntas Frequentes
            </h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Posso cancelar a qualquer momento?
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  Sim! Você pode cancelar seu plano a qualquer momento, sem multas ou taxas
                  adicionais.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Como funciona o teste grátis?
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  Você tem 14 dias para testar todas as funcionalidades do plano escolhido. Não
                  solicitamos cartão de crédito durante o teste.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Posso mudar de plano depois?
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-primary-600 to-accent-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-sm md:text-base text-primary-100 mb-6 max-w-2xl mx-auto">
            Junte-se a centenas de arquitetos que já usam nossa plataforma
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-primary-700 px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            Começar Agora
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Pricing

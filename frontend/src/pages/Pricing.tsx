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
  const nutritionistPlans: PricingPlan[] = [
    {
      name: 'Grátis',
      price: 'R$ 0',
      period: '/mês',
      description: 'Comece agora e fidelize pacientes com o básico do NuFit',
      highlighted: false,
      cta: 'Criar conta grátis',
      features: [
        { text: 'Até 10 pacientes ativos', included: true },
        { text: 'Planos alimentares básicos', included: true },
        { text: 'Diário alimentar (foto + comentário)', included: true },
        { text: 'Metas e evolução (básico)', included: true },
        { text: 'Lista de compras (por plano)', included: true },
        { text: 'Mensagens e agenda (básico)', included: true },
        { text: 'Portfólio público', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'IA (resumos/análises)', included: false },
        { text: 'Equipe (multiusuário)', included: false },
      ],
    },
    {
      name: 'Inicial',
      price: 'R$ 59',
      period: '/mês',
      description: 'Para atendimentos regulares com mais recursos e organização',
      highlighted: true,
      cta: 'Começar teste grátis',
      features: [
        { text: 'Até 50 pacientes ativos', included: true },
        { text: 'Planos alimentares completos + substituições', included: true },
        { text: 'Anamnese + questionários', included: true },
        { text: 'Diário alimentar com foto + IA (limitado)', included: true },
        { text: 'Exames laboratoriais (upload)', included: true },
        { text: 'Relatórios básicos e evolução', included: true },
        { text: 'Agenda e lembretes', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Equipe (multiusuário)', included: false },
      ],
    },
    {
      name: 'Profissional',
      price: 'R$ 129',
      period: '/mês',
      description: 'Para nutricionistas com alto volume e automações',
      highlighted: false,
      cta: 'Falar com vendas',
      features: [
        { text: 'Pacientes ilimitados', included: true },
        { text: 'IA (resumos e análises) com limites maiores', included: true },
        { text: 'Modelos de plano (biblioteca)', included: true },
        { text: 'Relatórios avançados (aderência)', included: true },
        { text: 'Equipe (até 3 usuários)', included: true },
        { text: 'Suporte dedicado', included: true },
      ],
    },
  ]

  const doctorPlans: PricingPlan[] = [
    {
      name: 'Médico Grátis',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para médicos acompanharem pacientes sem prescrição alimentar estruturada',
      highlighted: false,
      cta: 'Criar conta grátis',
      features: [
        { text: 'Agenda e lembretes', included: true },
        { text: 'Chat com paciente', included: true },
        { text: 'Exames laboratoriais (upload)', included: true },
        { text: 'IA Assistant (apoio clínico)', included: true },
        { text: 'Analytics básico', included: true },
        { text: 'Prescrição alimentar estruturada', included: false },
        { text: 'IA gerar dieta', included: false },
      ],
    },
    {
      name: 'Médico Pro',
      price: 'R$ 89',
      period: '/mês',
      description: 'Recursos clínicos e organização para rotina médica',
      highlighted: true,
      cta: 'Começar teste grátis',
      features: [
        { text: 'Agenda e lembretes avançados', included: true },
        { text: 'Chat com paciente', included: true },
        { text: 'Exames laboratoriais (upload + IA)', included: true },
        { text: 'Body3D', included: true },
        { text: 'Analytics completo', included: true },
        { text: 'Prescrição alimentar estruturada', included: false },
        { text: 'IA gerar dieta', included: false },
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
              Planos para profissionais de saúde
            </h1>
            <p className="text-base md:text-lg text-primary-100 mb-6">
              Planos mensais com limites e recursos por perfil. Cancele quando quiser.
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
          <div className="max-w-7xl mx-auto space-y-10">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Planos para Nutricionistas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {nutritionistPlans.map((plan) => (
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

                      <Link
                        to="/signup?role=nutricionista"
                        className={`block w-full text-center py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 mb-6 ${
                          plan.highlighted
                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {plan.cta}
                      </Link>

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

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Planos para Médicos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {doctorPlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-white shadow-2xl scale-105 border-2 border-sky-500'
                        : 'bg-white shadow-lg hover:shadow-xl border border-gray-200'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-sky-600 to-primary-600 text-white text-center py-1.5 text-xs font-semibold">
                        MAIS POPULAR
                      </div>
                    )}

                    <div className={`p-6 md:p-8 ${plan.highlighted ? 'pt-10 md:pt-12' : ''}`}>
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

                      <Link
                        to="/signup?role=medico"
                        className={`block w-full text-center py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 mb-6 ${
                          plan.highlighted
                            ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {plan.cta}
                      </Link>

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
            Junte-se a centenas de profissionais que já usam nossa plataforma
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

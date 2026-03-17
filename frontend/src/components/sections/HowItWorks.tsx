import { UserPlus, ClipboardList, TrendingUp } from 'lucide-react'

interface Step {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}

const HowItWorks = () => {
  const steps: Step[] = [
    {
      number: '01',
      icon: <UserPlus className="h-8 w-8" />,
      title: 'Cadastre seus pacientes',
      description: 'Adicione pacientes ao seu CRM, envie anamnese digital e questionários. Tenha o histórico e dados em um só lugar.',
    },
    {
      number: '02',
      icon: <ClipboardList className="h-8 w-8" />,
      title: 'Prescreva planos alimentares',
      description: 'Monte cardápios personalizados com macros, refeições e substituições. Use modelos prontos ou sugestões de IA (opcional).',
    },
    {
      number: '03',
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Acompanhe a evolução',
      description: 'Diário alimentar, avaliações antropométricas e metas. Acompanhe a aderência e os resultados de cada paciente.',
    },
  ]

  return (
    <section id="como-funciona" className="py-20 md:py-32 bg-gradient-to-b from-white to-primary-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Prática nutricional em três passos
          </h2>
          <p className="text-xl text-gray-600">
            NuFit centraliza pacientes, planos alimentares e acompanhamento para você focar no que importa: a saúde do paciente.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-primary-100 transform translate-x-6">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary-600 rounded-full" />
                  </div>
                )}

                <div className="relative bg-white p-8 rounded-2xl border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-200 h-full">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.number}
                  </div>

                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary-100 text-primary-600 mb-6">
                    {step.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks

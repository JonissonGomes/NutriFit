import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

const CTA = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Seu escritório digital pronto para impressionar clientes
          </h2>

          {/* Description */}
          <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-2xl mx-auto text-balance">
            Cadastre-se, organize seu portfólio e comece a apresentar projetos arquitetônicos de forma profissional.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl flex items-center gap-2"
            >
              Criar minha conta
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/pricing"
              className="group bg-transparent text-white border-2 border-white/30 px-8 py-4 rounded-lg hover:border-white hover:bg-white/10 transition-all duration-200 font-semibold text-lg"
            >
              Ver planos e preços
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-primary-100">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-white rounded-full"></div>
              <span>Sem compromisso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-white rounded-full"></div>
              <span>Configuração em minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-white rounded-full"></div>
              <span>Suporte dedicado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA


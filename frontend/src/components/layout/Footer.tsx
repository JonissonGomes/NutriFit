import { Utensils } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary-900 text-primary-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Utensils className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold text-white">NuFit</span>
            </div>
            <p className="text-primary-200 max-w-md">
              Plataforma completa para nutricionistas. Prescreva planos alimentares, acompanhe pacientes e gerencie sua prática com foco em saúde e nutrição.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produto</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-primary-300 transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-primary-300 transition-colors">
                  Planos
                </a>
              </li>
              <li>
                <a href="#precos" className="hover:text-primary-300 transition-colors">
                  Preços
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <a href="#sobre" className="hover:text-primary-300 transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-primary-300 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contato" className="hover:text-primary-300 transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-8 pt-8 text-center text-sm text-primary-300">
          <p>© {currentYear} NuFit. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

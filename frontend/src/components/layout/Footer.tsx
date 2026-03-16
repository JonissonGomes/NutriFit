import { Building2 } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold text-white">ArckDesign</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Plataforma completa para arquitetos. Apresente, aprove e gerencie projetos de arquitetura de forma profissional.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produto</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-primary-400 transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-primary-400 transition-colors">
                  Planos
                </a>
              </li>
              <li>
                <a href="#precos" className="hover:text-primary-400 transition-colors">
                  Preços
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <a href="#sobre" className="hover:text-primary-400 transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-primary-400 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contato" className="hover:text-primary-400 transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {currentYear} ArckDesign. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer


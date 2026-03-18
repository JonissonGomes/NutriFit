import React from 'react'
import { Home as HomeIcon } from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Ilustração 404 */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-500/20 select-none">404</div>
          <HomeIcon className="text-6xl -mt-16 mb-4 text-gray-400 mx-auto" />
        </div>

        {/* Mensagem */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Página não encontrada
        </h1>
        <p className="text-stone-400 mb-8 text-lg">
          Ops! Parece que a página que você está procurando não existe ou foi movida.
          Não se preocupe, isso acontece às vezes.
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-600 transition-colors"
          >
            ← Voltar
          </button>
          <Link
            to="/"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ir para a Home
          </Link>
        </div>

        {/* Links úteis */}
        <div className="mt-12 pt-8 border-t border-stone-700">
          <p className="text-stone-500 mb-4">Ou acesse diretamente:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/explore" className="text-primary-400 hover:text-primary-300 transition">
              Explorar Nutricionistas
            </Link>
            <span className="text-stone-600">•</span>
            <Link to="/pricing" className="text-primary-400 hover:text-primary-300 transition">
              Planos
            </Link>
            <span className="text-stone-600">•</span>
            <Link to="/login" className="text-primary-400 hover:text-primary-300 transition">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound



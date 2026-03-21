import { Component, ErrorInfo, ReactNode } from 'react'
import { Warning, Refresh, Home } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            {/* Ícone de erro */}
            <Warning className="text-6xl mb-6 text-yellow-500 mx-auto" />

            {/* Mensagem */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Algo deu errado
            </h1>
            <p className="text-stone-400 mb-6 text-lg">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
            </p>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-600 transition-colors flex items-center justify-center gap-2"
              >
                <Refresh />
                Recarregar página
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home />
                Ir para a Home
              </button>
            </div>

            {/* Suporte */}
            <div className="mt-8 text-stone-500 text-sm">
              <p>Se o problema persistir, entre em contato conosco:</p>
              <a
                href="mailto:suporte@nufit.com.br"
                className="text-primary-400 hover:text-primary-300 transition"
              >
                suporte@nufit.com.br
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary


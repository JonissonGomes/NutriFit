import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

// ============================================
// TIPOS
// ============================================

interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface TourConfig {
  id: string
  steps: TourStep[]
}

// ============================================
// CONFIGURAÇÕES DE TOUR
// ============================================

const TOURS: Record<string, TourConfig> = {
  '/nutritionist/dashboard': {
    id: 'nutritionist-dashboard',
    steps: [
      {
        target: '[data-tour="stats"]',
        title: 'Suas estatísticas',
        content: 'Aqui você pode ver um resumo das visualizações do seu perfil, planos e mensagens recebidas.',
        position: 'bottom',
      },
      {
        target: '[data-tour="projects"]',
        title: 'Seus planos',
        content: 'Gerencie seus planos alimentares e o acompanhamento dos pacientes.',
        position: 'top',
      },
      {
        target: '[data-tour="sidebar"]',
        title: 'Menu de navegação',
        content: 'Use o menu lateral para acessar todas as funcionalidades: planos, mensagens, serviços e configurações.',
        position: 'right',
      },
    ],
  },
  '/medico/dashboard': {
    id: 'medico-dashboard',
    steps: [
      {
        target: '[data-tour="stats"]',
        title: 'Suas estatísticas',
        content: 'Aqui você pode ver um resumo das visualizações do seu perfil e mensagens recebidas.',
        position: 'bottom',
      },
      {
        target: '[data-tour="projects"]',
        title: 'Painel',
        content: 'Acesse agenda, pacientes, exames e mensagens.',
        position: 'top',
      },
      {
        target: '[data-tour="sidebar"]',
        title: 'Menu de navegação',
        content: 'Use o menu lateral para acessar agenda, mensagens, serviços e configurações.',
        position: 'right',
      },
    ],
  },
  '/client/dashboard': {
    id: 'client-dashboard',
    steps: [
      {
        target: '[data-tour="search"]',
        title: 'Busque nutricionistas',
        content: 'Use a busca para encontrar nutricionistas por especialidade, localização ou nome.',
        position: 'bottom',
      },
      {
        target: '[data-tour="favorites"]',
        title: 'Seus favoritos',
        content: 'Salve os nutricionistas que mais gostar para consultar depois.',
        position: 'top',
      },
    ],
  },
  '/patient/dashboard': {
    id: 'patient-dashboard',
    steps: [
      {
        target: '[data-tour="search"]',
        title: 'Busque nutricionistas',
        content: 'Use a busca para encontrar nutricionistas por especialidade, localização ou nome.',
        position: 'bottom',
      },
      {
        target: '[data-tour="favorites"]',
        title: 'Seus favoritos',
        content: 'Salve os nutricionistas que mais gostar para consultar depois.',
        position: 'top',
      },
    ],
  },
}

// ============================================
// COMPONENTE DE TOUR
// ============================================

const OnboardingTour: React.FC = () => {
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [tour, setTour] = useState<TourConfig | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  // Verificar se o tour deve ser exibido
  useEffect(() => {
    const tourConfig = TOURS[location.pathname]
    if (!tourConfig) {
      setIsVisible(false)
      return
    }

    // Verificar se o usuário já fez este tour
    const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
    if (completedTours.includes(tourConfig.id)) {
      return
    }

    // Verificar se é o primeiro acesso
    const isFirstVisit = !localStorage.getItem('hasVisitedBefore')
    if (isFirstVisit) {
      localStorage.setItem('hasVisitedBefore', 'true')
      setTimeout(() => {
        setTour(tourConfig)
        setCurrentStep(0)
        setIsVisible(true)
      }, 1000) // Delay para a página carregar
    }
  }, [location.pathname])

  // Atualizar posição do elemento alvo
  useEffect(() => {
    if (!tour || !isVisible) return

    const step = tour.steps[currentStep]
    const element = document.querySelector(step.target)
    
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
      
      // Scroll para o elemento se necessário
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setTargetRect(null)
    }
  }, [tour, currentStep, isVisible])

  const handleNext = useCallback(() => {
    if (!tour) return
    
    if (currentStep < tour.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Finalizar tour
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
      completedTours.push(tour.id)
      localStorage.setItem('completedTours', JSON.stringify(completedTours))
      setIsVisible(false)
    }
  }, [tour, currentStep])

  const handleSkip = useCallback(() => {
    if (tour) {
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]')
      completedTours.push(tour.id)
      localStorage.setItem('completedTours', JSON.stringify(completedTours))
    }
    setIsVisible(false)
  }, [tour])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  if (!isVisible || !tour) return null

  const step = tour.steps[currentStep]
  const isLastStep = currentStep === tour.steps.length - 1

  // Calcular posição do tooltip
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const padding = 16
    const tooltipWidth = 320

    switch (step.position) {
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2 - 60,
          right: window.innerWidth - targetRect.left + padding,
        }
      case 'right':
      default:
        return {
          top: targetRect.top + targetRect.height / 2 - 60,
          left: targetRect.right + padding,
        }
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay escuro */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={handleSkip}
      />
      
      {/* Highlight do elemento */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary-500 rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl shadow-2xl p-6 max-w-xs animate-fade-in"
        style={{ ...getTooltipStyle(), width: 320 }}
      >
        {/* Indicador de progresso */}
        <div className="flex gap-1 mb-4">
          {tour.steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Conteúdo */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {step.title}
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          {step.content}
        </p>

        {/* Ações */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Pular tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// FUNÇÃO PARA RESETAR TOURS (útil para testes)
// ============================================

export const resetTours = () => {
  localStorage.removeItem('completedTours')
  localStorage.removeItem('hasVisitedBefore')
}

export default OnboardingTour




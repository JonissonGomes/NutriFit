import { 
  Search, Users, Eye, MessageSquare, FileText, Calendar,
  Building2, CheckSquare, Maximize2, Download, Star, Shield,
  BarChart3, Zap, Globe, Palette
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
  const clientFeatures: FeatureCategory = {
    title: 'Para Clientes',
    description: 'Funcionalidades para quem busca contratar um arquiteto',
    features: [
      {
        icon: <Search className="h-5 w-5" />,
        title: 'Descobrir Portfólios',
        description: 'Navegue por projetos residenciais, comerciais e interiores de arquitetos verificados',
      },
      {
        icon: <Eye className="h-5 w-5" />,
        title: 'Visualização em Tempo Real',
        description: 'Acesse plantas, renderizações e documentos do seu projeto a qualquer momento',
      },
      {
        icon: <CheckSquare className="h-5 w-5" />,
        title: 'Aprovação por Etapas',
        description: 'Aprove ou solicite alterações em cada fase: conceito, anteprojeto, executivo',
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        title: 'Timeline Visual',
        description: 'Acompanhe o progresso do projeto com linha do tempo e marcos importantes',
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        title: 'Chat Integrado',
        description: 'Comunicação direta com o arquiteto, histórico completo de conversas',
      },
      {
        icon: <FileText className="h-5 w-5" />,
        title: 'Documentos Organizados',
        description: 'Acesse orçamentos, contratos e documentos do projeto em um só lugar',
      },
      {
        icon: <Star className="h-5 w-5" />,
        title: 'Avaliar e Recomendar',
        description: 'Deixe avaliações e ajude outros clientes na escolha do arquiteto ideal',
      },
      {
        icon: <Shield className="h-5 w-5" />,
        title: 'Assinatura Digital',
        description: 'Assine contratos diretamente na plataforma com segurança jurídica',
      },
    ],
  }

  const professionalFeatures: FeatureCategory = {
    title: 'Para Arquitetos',
    description: 'Ferramentas profissionais para gerenciar projetos e clientes',
    features: [
      {
        icon: <Building2 className="h-5 w-5" />,
        title: 'Galeria de Projetos',
        description: 'Organize plantas, renderizações e documentos por projeto e categoria',
      },
      {
        icon: <CheckSquare className="h-5 w-5" />,
        title: 'Sistema de Aprovação',
        description: 'Controle de aprovações por etapas com notificações automáticas',
      },
      {
        icon: <Maximize2 className="h-5 w-5" />,
        title: 'Visualizador de Plantas',
        description: 'Visualize plantas com zoom, medidas e anotações. Suporte PDF, DWG, DXF',
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        title: 'Timeline e Cronograma',
        description: 'Linha do tempo visual, marcos importantes e alertas de prazos',
      },
      {
        icon: <Globe className="h-5 w-5" />,
        title: 'Portfólio Público',
        description: 'Site profissional com seus projetos, domínio próprio e SEO otimizado',
      },
      {
        icon: <FileText className="h-5 w-5" />,
        title: 'Orçamentos e Contratos',
        description: 'Gere orçamentos, propostas e contratos com assinatura digital integrada',
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: 'Gestão de Clientes',
        description: 'CRM integrado, histórico de projetos e pipeline de vendas',
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'Analytics e Relatórios',
        description: 'Estatísticas de projetos, visualizações e relatórios financeiros',
      },
      {
        icon: <Download className="h-5 w-5" />,
        title: 'Compartilhamento Inteligente',
        description: 'Links privados com senha, controle de acesso e rastreamento',
      },
      {
        icon: <Palette className="h-5 w-5" />,
        title: 'Portfólio por Categorias',
        description: 'Organize por tipo: Residencial, Comercial, Interiores, Paisagismo',
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        title: 'Comunicação Centralizada',
        description: 'Chat integrado, notificações automáticas e mensagens configuráveis',
      },
      {
        icon: <Zap className="h-5 w-5" />,
        title: 'Automações',
        description: 'Notificações, lembretes e relatórios automáticos para economizar tempo',
      },
    ],
  }

  return (
    <section id="funcionalidades" className="py-20 md:py-32 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Funcionalidades para todos
          </h2>
          <p className="text-xl text-gray-600">
            Uma plataforma completa que atende tanto clientes buscando arquitetos quanto profissionais gerenciando projetos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Client Features */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{clientFeatures.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{clientFeatures.description}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clientFeatures.features.map((feature, index) => (
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

          {/* Professional Features */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
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

        {/* CTA */}
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


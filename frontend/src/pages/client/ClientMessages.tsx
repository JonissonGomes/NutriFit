import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Chat, Person, Email, Send } from '@mui/icons-material'
import { Trash2, Search, ArrowLeft } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { messageService } from '../../services'
import LoadingButton from '../../components/common/LoadingButton'
import ConfirmModal from '../../components/common/ConfirmModal'
import { sanitizeText, limitLength } from '../../utils/inputUtils'
import { useConfirmDelete } from '../../hooks'

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string
    avatar?: string
  }
  lastMessage?: {
    content: string
    createdAt: string
  }
  unreadCount: number
}

const ClientMessages: React.FC = () => {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isInitializingConversation, setIsInitializingConversation] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null)
  const deleteFlow = useConfirmDelete<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    const loadMessagesForConversation = async () => {
      if (!selectedConversation) {
        setMessages([])
        return
      }

      setLoadingMessages(true)
      try {
        const response = await messageService.getMessages(selectedConversation)
        if (response.data?.data) {
          setMessages(response.data.data.reverse()) // Mais recentes primeiro
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error)
        showToast('Erro ao carregar mensagens', 'error')
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessagesForConversation()
  }, [selectedConversation])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Verificar se há query params para iniciar conversa com mensagem pré-preenchida
  useEffect(() => {
    const architectId = searchParams.get('architect')
    const initialMessage = searchParams.get('initialMessage')

    if (architectId && initialMessage) {
      // Limpar query params da URL
      navigate('/patient/messages', { replace: true })
      
      // Iniciar conversa com o arquiteto
      initializeConversationWithMessage(architectId, initialMessage)
    }
  }, [searchParams, navigate])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const response = await messageService.getConversations()
      if (response.data) {
        // Mapear conversas garantindo que otherUser sempre exista
        const mappedConversations: Conversation[] = (response.data as any[]).map((conv: any) => {
          // Determinar qual é o outro usuário (arquiteto, já que o cliente está visualizando)
          const otherUser = conv.architect || conv.otherParticipant || conv.otherUser || {
            id: conv.architectId || '',
            name: 'Arquiteto',
            avatar: undefined
          }
          
          return {
            id: conv.id,
            otherUser: {
              id: otherUser.id || conv.architectId || '',
              name: otherUser.name || otherUser.displayName || 'Arquiteto',
              avatar: otherUser.avatar || undefined
            },
            lastMessage: conv.lastMessageData ? {
              content: conv.lastMessageData.text || conv.lastMessageData.content || '',
              createdAt: conv.lastMessageData.createdAt || conv.lastMessageAt || new Date().toISOString()
            } : undefined,
            unreadCount: typeof conv.unreadCount === 'object' 
              ? (conv.unreadCount.client || conv.unreadCount[conv.id] || 0)
              : (conv.unreadCount || 0)
          }
        })
        setConversations(mappedConversations)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      showToast('Erro ao carregar conversas', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeConversationWithMessage = async (architectId: string, initialMessage: string) => {
    setIsInitializingConversation(true)
    try {
      // Primeiro, recarregar conversas para ter a lista atualizada
      const conversationsResponse = await messageService.getConversations()
      if (!conversationsResponse.data) {
        showToast('Erro ao carregar conversas', 'error')
        return
      }

      // Mapear conversas corretamente
      const mappedConversations: Conversation[] = (conversationsResponse.data as any[]).map((conv: any) => {
        const otherUser = conv.architect || conv.otherParticipant || conv.otherUser || {
          id: conv.architectId || '',
          name: 'Arquiteto',
          avatar: undefined
        }
        
        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id || conv.architectId || '',
            name: otherUser.name || otherUser.displayName || 'Arquiteto',
            avatar: otherUser.avatar || undefined
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.text || conv.lastMessage.content || '',
            createdAt: conv.lastMessage.createdAt || conv.lastMessageAt || new Date().toISOString()
          } : undefined,
          unreadCount: typeof conv.unreadCount === 'object' 
            ? (conv.unreadCount.client || conv.unreadCount[conv.id] || 0)
            : (conv.unreadCount || 0)
        }
      })

      setConversations(mappedConversations)
      
      // Verificar se já existe uma conversa com este arquiteto
      // Usar comparação por ID do outro usuário (arquiteto)
      const existingConversation = mappedConversations.find(
        (conv) => {
          const otherUserId = conv.otherUser?.id
          return otherUserId && otherUserId === architectId
        }
      )

      if (existingConversation) {
        // Se já existe, apenas selecionar e pré-preencher mensagem
        setSelectedConversation(existingConversation.id)
        setMessageText(initialMessage)
        showToast('Conversa encontrada! Mensagem pré-preenchida. Você pode editar antes de enviar.', 'info')
        setIsInitializingConversation(false)
        return // Não criar nova conversa
      } else {
        // Criar nova conversa apenas se não existir
        const conversationResponse = await messageService.startConversation(architectId)
        if (conversationResponse.data) {
          // Recarregar conversas novamente após criar
          await loadConversations()
          
          // Buscar a conversa recém-criada na lista atualizada
          const updatedResponse = await messageService.getConversations()
          if (updatedResponse.data) {
            const updatedMapped = (updatedResponse.data as any[]).map((conv: any) => {
              const otherUser = conv.architect || conv.otherParticipant || conv.otherUser || {
                id: conv.architectId || '',
                name: 'Arquiteto',
                avatar: undefined
              }
              
              return {
                id: conv.id,
                otherUser: {
                  id: otherUser.id || conv.architectId || '',
                  name: otherUser.name || otherUser.displayName || 'Arquiteto',
                  avatar: otherUser.avatar || undefined
                },
                lastMessage: conv.lastMessage ? {
                  content: conv.lastMessage.text || conv.lastMessage.content || '',
                  createdAt: conv.lastMessage.createdAt || conv.lastMessageAt || new Date().toISOString()
                } : undefined,
                unreadCount: typeof conv.unreadCount === 'object' 
                  ? (conv.unreadCount.client || conv.unreadCount[conv.id] || 0)
                  : (conv.unreadCount || 0)
              }
            })
            
            setConversations(updatedMapped)
            
            const newConversation = updatedMapped.find(
              (conv) => conv.otherUser?.id === architectId
            )
            
            if (newConversation) {
              setSelectedConversation(newConversation.id)
              setMessageText(initialMessage)
              showToast('Conversa iniciada! Você pode editar a mensagem antes de enviar.', 'info')
            }
          }
        } else {
          showToast(conversationResponse.error || 'Erro ao iniciar conversa', 'error')
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar conversa:', error)
      showToast('Erro ao iniciar conversa', 'error')
    } finally {
      setIsInitializingConversation(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sendingMessage) return

    setSendingMessage(true)
    try {
      // Obter o userId do destinatário da conversa
      const conversation = conversations.find((c) => c.id === selectedConversation)
      if (!conversation) {
        showToast('Conversa não encontrada', 'error')
        return
      }

      // Sanitizar mensagem antes de enviar (permitir acentos e caracteres especiais)
      const sanitizedMessage = sanitizeText(messageText.trim(), ['\n', ' ', '.', ',', '!', '?', '-', ':', ';', '(', ')', '[', ']', '{', '}', '/', '\\', '@', '#', '$', '%', '*', '+', '=', '_', '|', '~', '`', '^', '´', '°', 'ª', 'º'])
      const limitedMessage = limitLength(sanitizedMessage, 5000) // Limite de mensagem

      const response = await messageService.sendMessage(conversation.otherUser?.id || '', limitedMessage)
      if (response.data) {
        // Adicionar mensagem à lista local
        setMessages(prev => [...prev, {
          id: response.data?.id || Date.now().toString(),
          text: limitedMessage,
          senderId: '', // Será preenchido pelo backend
          receiverId: conversation.otherUser?.id || '',
          createdAt: new Date().toISOString(),
        }])
        setMessageText('')
        loadConversations()
        showToast('Mensagem enviada!', 'success')
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } catch {
      showToast('Erro ao enviar mensagem', 'error')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevenir seleção da conversa
    deleteFlow.open(conversationId)
  }

  const confirmDeleteConversation = async (conversationId: string) => {
    setDeletingConversation(conversationId)
    try {
      const response = await messageService.deleteConversation(conversationId)
      if (response.data) {
        showToast('Conversa deletada com sucesso', 'success')
        
        // Remover da lista local
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        
        // Se a conversa deletada estava selecionada, limpar seleção
        if (selectedConversation === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
      showToast('Erro ao deletar conversa', 'error')
    } finally {
      setDeletingConversation(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Header - apenas no desktop ou quando nenhuma conversa está selecionada no mobile */}
      <div className={`flex items-center gap-4 mb-4 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mensagens</h1>
          <p className="text-gray-600 mt-1 text-xs md:text-sm hidden md:block">Converse com nutricionistas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 h-[calc(100%-5rem)] md:h-[calc(100%-5rem)] flex overflow-hidden shadow-sm">
        {/* Lista de conversas - oculta no mobile quando uma conversa está selecionada */}
        <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Busca - com header no mobile */}
          <div className="p-3 md:p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3 md:mb-0 md:hidden">
              <h1 className="text-lg font-bold text-gray-900 flex-1">Mensagens</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                maxLength={100}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

        {conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Chat className="text-5xl mb-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 mb-2">Nenhuma conversa</h3>
            <p className="text-gray-500 text-sm">
              Inicie uma conversa com um nutricionista para tirar dúvidas.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-3 md:p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition border-b border-gray-100 text-left relative group ${
                  selectedConversation === conv.id ? 'bg-primary-50 md:bg-primary-50' : ''
                }`}
              >
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {conv.otherUser?.avatar ? (
                    <img src={conv.otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Person sx={{ fontSize: 28 }} className="text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <p className="font-semibold md:font-medium text-gray-900 truncate text-sm md:text-base">
                      {conv.otherUser?.name || 'Nutricionista'}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conv.lastMessage?.createdAt && (
                        <p className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">
                          {formatDate(conv.lastMessage.createdAt)}
                        </p>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate pr-2">
                    {conv.lastMessage?.content || 'Sem mensagens'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteConversation(conv.id, e)
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-opacity z-10"
                  title="Excluir conversa"
                  type="button"
                >
                  {deletingConversation === conv.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-600" />
                  )}
                </button>
              </button>
            ))}
          </div>
        )}
        </div>

        {/* Área de Chat - oculta no mobile quando nenhuma conversa está selecionada */}
        <div className={`flex-1 flex flex-col min-h-0 ${
          !selectedConversation && !isInitializingConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {(selectedConversation || isInitializingConversation) ? (
            <div className="flex-1 flex flex-col min-h-0">
              {isInitializingConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Iniciando conversa...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header do chat - estilo Facebook mobile */}
                  <div className="p-3 md:p-4 border-b border-gray-200 flex items-center justify-between bg-white md:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Voltar"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                      </button>
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {conversations.find(c => c.id === selectedConversation)?.otherUser?.avatar ? (
                          <img 
                            src={conversations.find(c => c.id === selectedConversation)?.otherUser?.avatar} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Person sx={{ fontSize: 20 }} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                          {conversations.find(c => c.id === selectedConversation)?.otherUser?.name || 'Nutricionista'}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">Ativo agora</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const conv = conversations.find(c => c.id === selectedConversation)
                        if (conv) {
                          handleDeleteConversation(conv.id, e)
                        }
                      }}
                      className="p-1.5 md:p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                      title="Excluir conversa"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                    </button>
                  </div>

                  {/* Mensagens - estilo Facebook mobile */}
                  <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-gray-50 md:bg-gray-50 min-h-0">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Carregando mensagens...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <p className="text-sm">Nenhuma mensagem ainda. Inicie a conversa!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        // Determinar se a mensagem é do cliente (senderId diferente do otherUser.id)
                        const conversation = conversations.find(c => c.id === selectedConversation)
                        const isMyMessage = message.senderId !== conversation?.otherUser?.id
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-md px-3 md:px-4 py-2 md:py-2.5 rounded-2xl ${
                                isMyMessage
                                  ? 'bg-primary-600 text-white rounded-tr-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                              }`}
                            >
                              <p className="text-sm md:text-sm whitespace-pre-wrap break-words">{message.text}</p>
                              <p
                                className={`text-[10px] md:text-xs mt-1 ${
                                  isMyMessage ? 'text-primary-100' : 'text-gray-500'
                                }`}
                              >
                                {formatDate(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                  {/* Input - estilo Facebook mobile */}
                  <div className="p-2.5 md:p-4 border-t border-gray-200 bg-white">
                    {messageText && searchParams.get('initialMessage') && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs md:text-sm text-blue-700">
                        💬 Mensagem pré-preenchida. Você pode editar antes de enviar.
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={messageText}
                        onChange={(e) => {
                          // Para mensagens, permitir todos os caracteres acentuados e especiais comuns
                          const sanitized = sanitizeText(e.target.value, ['\n', ' ', '.', ',', '!', '?', '-', ':', ';', '(', ')', '[', ']', '{', '}', '/', '\\', '@', '#', '$', '%', '*', '+', '=', '_', '|', '~', '`', '^', '´', '°', 'ª', 'º'])
                          setMessageText(limitLength(sanitized, 5000))
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !sendingMessage && messageText.trim()) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="Digite uma mensagem..."
                        disabled={sendingMessage || isInitializingConversation}
                        maxLength={5000}
                        rows={Math.min(Math.max(messageText.split('\n').length, 1), 4) || 1}
                        className="flex-1 px-3 md:px-4 py-2 md:py-2.5 text-sm border border-gray-300 rounded-full md:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 resize-none min-h-[40px] md:min-h-[60px] max-h-[100px] md:max-h-[120px]"
                      />
                      <LoadingButton
                        onClick={handleSendMessage}
                        loading={sendingMessage}
                        variant="primary"
                        size="md"
                        disabled={!messageText.trim()}
                        icon={<Send className="h-4 w-4 md:h-5 md:w-5" />}
                        className="rounded-full md:rounded-lg flex-shrink-0"
                      >
                        <span className="hidden md:inline text-sm">Enviar</span>
                      </LoadingButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 hidden md:flex">
              <Email sx={{ fontSize: 64 }} className="mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecione uma conversa</h3>
              <p className="text-gray-500">Escolha uma conversa na lista para ver as mensagens</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação para deletar conversa */}
      <ConfirmModal
        isOpen={deleteFlow.isOpen}
        onClose={deleteFlow.close}
        onConfirm={() => void deleteFlow.confirm(confirmDeleteConversation)}
        title="Excluir conversa?"
        message="Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteFlow.loading || !!deletingConversation}
      />
    </div>
  )
}

export default ClientMessages


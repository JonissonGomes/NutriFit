import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { api } from '../../services'
import { INPUT_LIMITS, limitLength, sanitizeText } from '../../utils/inputUtils'
import { useToast } from '../../contexts/ToastContext'
import { getFriendlyErrorMessage } from '../../utils/feedbackMessages'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const AIAssistant = () => {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const q = limitLength(sanitizeText(input.trim(), ['?', '!', '.', ',', ' ']), INPUT_LIMITS.AI_QUESTION)
    if (!q) return

    setMessages((m) => [...m, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post<{ data?: { answer?: string } }>(`/ai-assistant/chat`, { question: q })

      if (res.error) {
        showToast(getFriendlyErrorMessage(res.error, 'Não foi possível obter uma resposta agora.'), 'error')
        return
      }

      const answer =
        (res.data as any)?.answer ||
        (res.data as any)?.data?.answer ||
        'Não encontrei uma resposta para essa pergunta. Tente reformular.'

      setMessages((m) => [...m, { role: 'assistant', content: answer }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Assistente</h1>
        <p className="text-gray-600 mt-1">Tire dúvidas rápidas (não substitui orientação do seu nutricionista).</p>
      </div>

      <div className="bg-white border border-primary-100 rounded-xl p-4 h-[420px] overflow-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-sm">Pergunte algo como “posso trocar arroz por batata?”</p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'ml-auto bg-primary-600 text-white'
                  : 'bg-primary-50 text-gray-800 border border-primary-100'
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            Pensando…
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(limitLength(sanitizeText(e.target.value, ['?', '!', '.', ',', ' ']), INPUT_LIMITS.AI_QUESTION))}
          maxLength={INPUT_LIMITS.AI_QUESTION}
          disabled={loading}
          className="flex-1 bg-white border border-primary-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60"
          placeholder="Digite sua pergunta..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) void send()
          }}
        />
        <button
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar
        </button>
      </div>
    </div>
  )
}

export default AIAssistant

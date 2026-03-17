import { useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '../../services'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const q = input.trim()
    if (!q) return

    setMessages((m) => [...m, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    const res = await api.post<{ data?: { answer?: string } }>(`/ai-assistant/chat`, { question: q })
    const answer = (res.data as any)?.answer || (res.data as any)?.data?.answer || res.error || 'Não foi possível responder agora.'
    setMessages((m) => [...m, { role: 'assistant', content: answer }])
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assistente</h1>
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
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white border border-primary-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="Digite sua pergunta..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send()
          }}
        />
        <button
          onClick={() => void send()}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </div>
    </div>
  )
}

export default AIAssistant


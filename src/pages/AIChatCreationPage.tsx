import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import ServiceReviewForm from '../components/service/ServiceReviewForm'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { startChatSession, sendMessage, type ChatResponse, type ServiceData } from '../services/GeminiService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatCreationPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz? (Masalan: dasturlash, dizayn, tushuntirish va h.k.)',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSession, setChatSession] = useState<any>(null)
  const [aiData, setAiData] = useState<ServiceData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize chat session
  useEffect(() => {
    const initChat = async () => {
      try {
        const chat = await startChatSession()
        setChatSession(chat)
      } catch (error) {
        console.error('Error initializing chat:', error)
        alert('AI xizmati ishlamayapti. Iltimos, keyinroq urinib ko\'ring.')
        navigate(-1)
      }
    }
    initChat()
  }, [navigate])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !chatSession) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response: ChatResponse = await sendMessage(chatSession, userMessage.content)

      if (response.isFinished && response.data) {
        // Service data is ready - show review form
        setAiData(response.data)
      } else {
        // Regular AI response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message || 'Xatolik yuz berdi.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Show review form if AI data is ready
  if (aiData) {
    return (
      <>
        <ServiceReviewForm data={aiData} onBack={() => setAiData(null)} />
        <BottomNav />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">Xizmat Yaratish</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('uz-UZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI yozmoqda...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Xabar yozing..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
            style={{
              minHeight: '48px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-full transition-colors ${
              inputValue.trim() && !isLoading
                ? 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

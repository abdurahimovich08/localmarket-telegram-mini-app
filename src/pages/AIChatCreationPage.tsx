import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getUserServices } from '../lib/supabase'
import { startChatSession, sendMessage, type ChatResponse } from '../services/GeminiService'
import { sanitizeAITags, suggestIntentBasedTags } from '../lib/tagUtils'
import ServiceReviewForm from '../components/service/ServiceReviewForm'
import type { ServiceData } from '../services/GeminiService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import BackButton from '../components/BackButton'

export default function AIChatCreationPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chat, setChat] = useState<any>(null)
  const [aiData, setAiData] = useState<ServiceData | null>(null)
  const [checkingService, setCheckingService] = useState(true)
  const [existingService, setExistingService] = useState<{ service_id: string; title: string } | null>(null)

  // Check if user already has a service (only one service per user)
  useEffect(() => {
    const checkExistingService = async () => {
      if (user) {
        setCheckingService(true)
        const services = await getUserServices(user.telegram_user_id)
        if (services.length > 0) {
          const firstService = services[0]
          setExistingService({ 
            service_id: firstService.service_id, 
            title: firstService.title 
          })
        }
        setCheckingService(false)
      }
    }
    checkExistingService()
  }, [user])

  useEffect(() => {
    const initChat = async () => {
      const chatSession = await startChatSession()
      setChat(chatSession)
      setMessages([
        { role: 'ai', content: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz? (Masalan: dasturlash, dizayn, tushuntirish va h.k.)' }
      ])
    }
    initChat()
  }, [])

  const scrollToBottom = () => {
    const messagesContainer = document.getElementById('messages-container')
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !chat) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response: ChatResponse = await sendMessage(chat, userMessage)
      
      if (response.isFinished && response.data) {
        setAiData(response.data)
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: response.message || 'Xatolik yuz berdi' }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [...prev, { role: 'ai', content: 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Show loading while checking for existing service
  if (checkingService) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user already has a service, redirect to edit page
  if (existingService) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center px-4 py-3">
            <BackButton />
            <h1 className="flex-1 text-center font-semibold text-gray-900">Xizmat Yaratish</h1>
            <div className="w-10"></div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center bg-white rounded-lg p-6 shadow-sm max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sizda allaqachon xizmat mavjud</h2>
            <p className="text-gray-600 mb-4">{existingService.title}</p>
            <button
              onClick={() => navigate(`/service/${existingService.service_id}/edit`)}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Xizmatni Tahrirlash
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If AI finished and returned data, show review form
  if (aiData) {
    return (
      <ServiceReviewForm
        data={aiData}
        onBack={() => {
          setAiData(null)
          setMessages([
            { role: 'ai', content: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz? (Masalan: dasturlash, dizayn, tushuntirish va h.k.)' }
          ])
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">Xizmat Yaratish</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div
          id="messages-container"
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Xabar yozing..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Yuborish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

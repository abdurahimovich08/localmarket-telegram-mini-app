/**
 * Unified AI Creation Page
 * 
 * Works for BOTH products and services
 * Schema-driven questioning and validation
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { 
  startUnifiedChatSession, 
  sendUnifiedMessage, 
  clearSession,
  getSessionData 
} from '../services/UnifiedGeminiService'
import { getCategorySchema } from '../schemas/categories'
import type { UnifiedAIOutput } from '../schemas/categories/types'
import UnifiedReviewForm from '../components/UnifiedReviewForm'
import TaxonomyPicker, { type TaxonomySelection } from '../components/chat/TaxonomyPicker'
import SellerMemoryBanner from '../components/chat/SellerMemoryBanner'
import type { TaxonNode } from '../taxonomy/clothing.uz'
import { buildTagsFromSelection, audienceLabels, segmentLabels } from '../taxonomy/clothing.utils'
import BackButton from '../components/BackButton'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface UnifiedAICreationPageProps {
  entityType: 'product' | 'service'
  category: string
  onComplete?: (data: UnifiedAIOutput) => void
}

export default function UnifiedAICreationPage({
  entityType: entityTypeProp,
  category: categoryProp,
  onComplete,
}: UnifiedAICreationPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useUser()
  
  // Get category and entityType from URL params (priority) or props
  const categoryFromUrl = searchParams.get('category')
  const entityTypeFromUrl = searchParams.get('entityType') as 'product' | 'service' | null
  
  const category = categoryFromUrl || categoryProp
  const entityType = entityTypeFromUrl || entityTypeProp || 'product'
  
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [aiData, setAiData] = useState<UnifiedAIOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Taxonomy selection state (for clothing category)
  const [taxonomySelection, setTaxonomySelection] = useState<TaxonomySelection>({ tags: [] })
  const [taxonomyContext, setTaxonomyContext] = useState<{
    taxonomy: { 
      id: string
      pathUz: string
      audience: string
      segment: string
      labelUz: string
      audienceUz?: string
      segmentUz?: string
      leafUz?: string
    }
    taxonomyNode?: TaxonNode
    tags: string[]
  } | null>(null)
  
  // Check if this is clothing category that requires taxonomy
  const isClothingCategory = entityType === 'product' && category === 'clothing'
  const isTaxonomyComplete = isClothingCategory ? !!taxonomySelection.leaf : true

  // Get schema
  const schema = category ? getCategorySchema(category) : null
  
  // Show error if category missing
  if (!category || !schema) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center px-4 py-3">
            <BackButton />
            <h1 className="flex-1 text-center font-semibold text-gray-900">Xatolik</h1>
            <div className="w-10"></div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center bg-white rounded-lg p-6 shadow-sm max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Kategoriya topilmadi</h2>
            <p className="text-gray-600 mb-4">
              {!category ? 'Kategoriya ko\'rsatilmagan' : `Kategoriya: ${category}`}
            </p>
            <button
              onClick={() => navigate('/create-unified')}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors mb-2"
            >
              Kategoriya Tanlash
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Orqaga
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Guard to prevent double session start
  const hasStartedRef = useRef(false)
  
  // Initialize chat session (skip for clothing until taxonomy selected)
  useEffect(() => {
    // For clothing category, wait for taxonomy selection
    if (isClothingCategory && !taxonomyContext) {
      // Don't show messages until taxonomy is selected
      return
    }

    // Prevent double start
    if (hasStartedRef.current && sessionId) {
      return
    }

    const initChat = async () => {
      try {
        // Mark as started
        hasStartedRef.current = true
        
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const { greeting } = await startUnifiedChatSession(
          newSessionId,
          entityType,
          category,
          taxonomyContext || undefined
        )
        setSessionId(newSessionId)
        // AI greeting already includes taxonomy confirmation, no need to add UI message
        setMessages([{ role: 'ai', content: greeting }])
      } catch (err) {
        console.error('Error initializing chat:', err)
        setError('Chatni boshlashda xatolik yuz berdi')
        hasStartedRef.current = false // Reset on error
      }
    }
    initChat()

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        clearSession(sessionId)
        hasStartedRef.current = false
      }
    }
  }, [entityType, category, taxonomyContext, isClothingCategory])
  
  // Handle taxonomy selection complete
  const handleTaxonomyComplete = (leaf: TaxonNode, tags: string[]) => {
    setTaxonomyContext({
      taxonomy: {
        id: leaf.id,
        pathUz: leaf.pathUz,
        audience: leaf.audience,
        segment: leaf.segment,
        labelUz: leaf.labelUz,
        audienceUz: audienceLabels[leaf.audience],
        segmentUz: segmentLabels[leaf.segment],
        leafUz: leaf.labelUz,
      },
      taxonomyNode: leaf, // Full node for field profiling
      tags,
      // Store attributes for tag building (will be enriched with entity IDs later)
      attributes: {},
    })
  }

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
    if (!inputValue.trim() || isLoading || !sessionId) return
    
    // Gate: clothing category requires taxonomy selection
    if (isClothingCategory && !isTaxonomyComplete) {
      return
    }

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    setError(null)

    try {
      const response = await sendUnifiedMessage(sessionId, userMessage)
      
      if (response.isFinished && response.data) {
        setAiData(response.data)
        if (onComplete) {
          onComplete(response.data)
        }
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: response.message || 'Xatolik yuz berdi' }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
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

  // If AI finished and returned data, show review form
  if (aiData) {
    // Merge taxonomy context into aiData for review form
    const aiDataWithContext = taxonomyContext
      ? {
          ...aiData,
          context: {
            ...aiData.context,
            taxonomy: taxonomyContext.taxonomy,
            tags: taxonomyContext.tags,
          },
        }
      : aiData
    
    return (
      <UnifiedReviewForm
        data={aiDataWithContext}
        schema={schema}
        onBack={() => {
          setAiData(null)
          const session = getSessionData(sessionId!)
          if (session) {
            setMessages([
              { role: 'ai', content: schema.aiInstructions?.greeting || 'Salom! Davom etamizmi?' }
            ])
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 relative">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">
            {schema.displayName} {schema.emoji} Yaratish
          </h1>
          {isClothingCategory && isTaxonomyComplete && taxonomyContext && (
            <button
              onClick={() => {
                setTaxonomyContext(null)
                setTaxonomySelection({ tags: [] })
                setMessages([])
                hasStartedRef.current = false
                if (sessionId) {
                  clearSession(sessionId)
                  setSessionId(null)
                }
              }}
              className="text-xs text-primary hover:text-primary-dark font-medium"
            >
              🔁 O'zgartirish
            </button>
          )}
          {(!isClothingCategory || !isTaxonomyComplete || !taxonomyContext) && (
            <div className="w-10"></div>
          )}
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* CHAT AREA - Only show if taxonomy is complete (for clothing) */}
        {(isTaxonomyComplete || !isClothingCategory) && (
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
        )}

        {/* SELLER MEMORY BANNER - Show before overlay if user has history */}
        {isClothingCategory && !isTaxonomyComplete && user?.id && (
          <SellerMemoryBanner
            userId={user.id}
            onSelect={(leaf) => {
              // Quick resume: skip overlay, go directly to chat
              const tags = buildTagsFromSelection(leaf)
              handleTaxonomyComplete(leaf, tags)
            }}
            onDismiss={() => {
              // User dismissed, show overlay
            }}
          />
        )}

        {/* TAXONOMY OVERLAY - Full screen overlay for clothing category */}
        {isClothingCategory && !isTaxonomyComplete && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col">
            <TaxonomyPicker
              value={taxonomySelection}
              onChange={setTaxonomySelection}
              onComplete={handleTaxonomyComplete}
              onClose={() => navigate('/create-unified')}
              isOverlay={true}
            />
          </div>
        )}

        {/* INPUT AREA */}
        <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={!isTaxonomyComplete && isClothingCategory ? "Kiyim turini tanlang 👆" : "Xabar yozing..."}
              className={`flex-1 px-4 py-2 border rounded-lg transition-all ${
                !isTaxonomyComplete && isClothingCategory
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
              }`}
              disabled={isLoading || (!isTaxonomyComplete && isClothingCategory)}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || (!isTaxonomyComplete && isClothingCategory)}
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

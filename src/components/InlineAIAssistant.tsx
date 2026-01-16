/**
 * Inline AI Assistant Component
 * 
 * Provides field-specific AI help within the form
 * Appears as a floating button or inline help icon
 */

import { useState } from 'react'
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface InlineAIAssistantProps {
  fieldKey: string
  fieldLabel: string
  currentValue?: any
  schema: any
  taxonomyContext?: any
  onSuggestion?: (suggestion: any) => void
}

export default function InlineAIAssistant({
  fieldKey,
  fieldLabel,
  currentValue,
  schema,
  taxonomyContext,
  onSuggestion,
}: InlineAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGetHelp = async () => {
    setIsOpen(true)
    setIsLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      // Call AI API for field-specific help
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Men "${fieldLabel}" maydonini to'ldirmoqchiman. ${taxonomyContext ? `Taxonomy: ${taxonomyContext.taxonomy?.leafUz || taxonomyContext.taxonomy?.labelUz}` : ''} Bu maydon uchun qanday qiymat yozishim kerak? Qisqa va aniq maslahat bering.`,
          context: {
            fieldKey,
            fieldLabel,
            currentValue,
            taxonomy: taxonomyContext?.taxonomy,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('AI yordam olishda xatolik')
      }

      const data = await response.json()
      setSuggestion(data.response || 'Maslahat topilmadi')
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestion = () => {
    if (suggestion && onSuggestion) {
      onSuggestion(suggestion)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      {/* Floating Help Button */}
      <button
        type="button"
        onClick={handleGetHelp}
        className="absolute -right-2 top-0 p-2 text-primary hover:text-primary-dark transition-colors"
        title="AI yordam"
      >
        <SparklesIcon className="w-5 h-5" />
      </button>

      {/* AI Help Panel */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-primary" />
              AI Yordam
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 py-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-sm text-gray-600 ml-2">AI o'ylayapti...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {suggestion && !isLoading && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{suggestion}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Qo'llash
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

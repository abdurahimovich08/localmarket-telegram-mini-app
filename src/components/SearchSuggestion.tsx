/**
 * SearchSuggestion Component
 * 
 * Shows "Did you mean...?" suggestions when typos are detected
 * Also shows brand normalization suggestions
 */

import { useEffect, useState } from 'react'
import { buildSmartSearch, type SmartSearchResult } from '../lib/smartSearch'
import { SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchSuggestionProps {
  query: string
  onSuggestionClick: (suggestion: string) => void
}

export default function SearchSuggestion({ query, onSuggestionClick }: SearchSuggestionProps) {
  const [smartSearch, setSmartSearch] = useState<SmartSearchResult | null>(null)
  
  useEffect(() => {
    if (query && query.trim().length >= 2) {
      const result = buildSmartSearch(query)
      setSmartSearch(result)
    } else {
      setSmartSearch(null)
    }
  }, [query])
  
  // Don't show if no corrections or brand matches
  if (!smartSearch) return null
  
  const hasSuggestion = smartSearch.suggestedCorrection || smartSearch.brandMatch
  
  if (!hasSuggestion) return null
  
  return (
    <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
      {/* Typo correction */}
      {smartSearch.suggestedCorrection && (
        <button
          onClick={() => onSuggestionClick(smartSearch.suggestedCorrection!)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-purple-500" />
          <span>
            Siz <span className="font-semibold text-primary">"{smartSearch.suggestedCorrection}"</span> demoqchimisiz?
          </span>
        </button>
      )}
      
      {/* Brand match info */}
      {smartSearch.brandMatch && !smartSearch.suggestedCorrection && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <SparklesIcon className="w-4 h-4 text-purple-500" />
          <span>
            <span className="font-semibold text-primary capitalize">{smartSearch.brandMatch}</span> brendi bo'yicha qidirilmoqda
          </span>
        </div>
      )}
      
      {/* Synonyms hint */}
      {smartSearch.synonyms.length > 3 && (
        <div className="mt-1 text-xs text-gray-500">
          Shuningdek: {smartSearch.synonyms.slice(0, 3).join(', ')}...
        </div>
      )}
    </div>
  )
}

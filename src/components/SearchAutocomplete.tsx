/**
 * SearchAutocomplete Component
 * 
 * Shows suggestions as user types:
 * - Recent searches
 * - Popular searches
 * - Brand suggestions
 * - Category suggestions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlassIcon, ClockIcon, FireIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getAutocompleteSuggestions, getRecentSearches, clearSearchHistory, SearchSuggestion } from '../lib/searchAnalytics'
import { debounce } from '../lib/utils'

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Qidirish...",
  autoFocus = false,
  className = "",
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches(5))
  }, [])

  // Fetch suggestions when query changes
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const results = await getAutocompleteSuggestions(query)
        setSuggestions(results)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 200),
    []
  )

  useEffect(() => {
    fetchSuggestions(value)
  }, [value, fetchSuggestions])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = value.length >= 2 ? suggestions : recentSearches.map(q => ({ query: q, score: 0, type: 'recent' as const }))
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const selectedQuery = 'query' in items[selectedIndex] ? items[selectedIndex].query : items[selectedIndex]
          onChange(selectedQuery as string)
          onSearch(selectedQuery as string)
        } else if (value.trim()) {
          onSearch(value)
        }
        setIsOpen(false)
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (query: string) => {
    onChange(query)
    onSearch(query)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleClearHistory = () => {
    clearSearchHistory()
    setRecentSearches([])
  }

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <ClockIcon className="w-4 h-4 text-gray-400" />
      case 'popular':
        return <FireIcon className="w-4 h-4 text-orange-400" />
      case 'brand':
        return <TagIcon className="w-4 h-4 text-blue-400" />
      case 'category':
        return <MagnifyingGlassIcon className="w-4 h-4 text-green-400" />
    }
  }

  const showDropdown = isOpen && (
    (value.length < 2 && recentSearches.length > 0) ||
    (value.length >= 2 && suggestions.length > 0)
  )

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                     text-gray-900 placeholder-gray-400 text-sm"
        />
        {value && (
          <button
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 
                        rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
          {/* Recent searches (when no query) */}
          {value.length < 2 && recentSearches.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase">So'nggi qidiruvlar</span>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-primary hover:text-primary-dark"
                >
                  Tozalash
                </button>
              </div>
              {recentSearches.map((query, index) => (
                <button
                  key={query}
                  onClick={() => handleSuggestionClick(query)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 
                             transition-colors ${selectedIndex === index ? 'bg-gray-50' : ''}`}
                >
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{query}</span>
                </button>
              ))}
            </>
          )}

          {/* Suggestions (when query >= 2 chars) */}
          {value.length >= 2 && suggestions.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase">Tavsiyalar</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.query}`}
                  onClick={() => handleSuggestionClick(suggestion.query)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 
                             transition-colors ${selectedIndex === index ? 'bg-gray-50' : ''}`}
                >
                  {getIcon(suggestion.type)}
                  <span className="text-gray-700 flex-1">
                    {highlightMatch(suggestion.query, value)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {suggestion.type === 'popular' && '🔥'}
                    {suggestion.type === 'brand' && '®️'}
                    {suggestion.type === 'category' && '📁'}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Helper to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  
  if (index === -1) return text
  
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-primary">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  )
}

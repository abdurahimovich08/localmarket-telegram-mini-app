import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useUser } from '../contexts/UserContext'
import { useAppMode } from '../contexts/AppModeContext'
import { useSearchParams } from 'react-router-dom'
import { useUnifiedItems } from '../hooks/useUnifiedItems'
import { useNavigateWithCtx } from '../lib/preserveCtx'
import { trackUserSearch, trackListingView } from '../lib/tracking'
import { trackSearch, getRecentSearches, getAutocompleteSuggestions, SearchSuggestion as SearchSuggestionType } from '../lib/searchAnalytics'
import UniversalCard from '../components/UniversalCard'
import SearchFilters, { type SearchFilters as SearchFiltersType } from '../components/SearchFilters'
import SearchSuggestion from '../components/SearchSuggestion'
import BackButton from '../components/BackButton'
import CartIcon from '../components/CartIcon'
import BottomNav from '../components/BottomNav'
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon, FireIcon, TagIcon } from '@heroicons/react/24/outline'
import { debounce } from '../lib/utils'

export default function Search() {
  const { user } = useUser()
  const { mode } = useAppMode()
  const navigateWithCtx = useNavigateWithCtx()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || undefined
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery) // Separate state for input
  const [filters, setFilters] = useState<SearchFiltersType>({
    category: initialCategory as any,
    radius: user?.search_radius_miles || 10,
  })
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteResults, setAutocompleteResults] = useState<SearchSuggestionType[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  const isBrandedMode = mode.kind === 'store' || mode.kind === 'service'
  
  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches(5))
  }, [])
  
  // Debounced search query update
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value)
    }, 300),
    []
  )
  
  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length >= 2) {
        const results = await getAutocompleteSuggestions(inputValue)
        setAutocompleteResults(results)
      } else {
        setAutocompleteResults([])
      }
    }
    fetchSuggestions()
  }, [inputValue])
  
  // Handle click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value)
    setShowAutocomplete(true)
    setSelectedIndex(-1)
    debouncedSetSearchQuery(value)
  }
  
  // Handle suggestion click
  const handleSuggestionClick = (query: string) => {
    setInputValue(query)
    setSearchQuery(query)
    setShowAutocomplete(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = inputValue.length >= 2 ? autocompleteResults : recentSearches.map(q => ({ query: q, score: 0, type: 'recent' as const }))
    
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
          handleSuggestionClick(selectedQuery as string)
        }
        setShowAutocomplete(false)
        break
      case 'Escape':
        setShowAutocomplete(false)
        setSelectedIndex(-1)
        break
    }
  }
  
  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <ClockIcon className="w-4 h-4 text-gray-400" />
      case 'popular':
        return <FireIcon className="w-4 h-4 text-orange-400" />
      case 'brand':
        return <TagIcon className="w-4 h-4 text-blue-400" />
      default:
        return <MagnifyingGlassIcon className="w-4 h-4 text-green-400" />
    }
  }

  // ✅ Filters: mode'ga qarab + search query + filterlar
  const unifiedFilters = useMemo(() => {
    const baseFilters: any = {
      searchQuery: searchQuery.trim() || undefined,
      category: filters.category || initialCategory || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      limit: 100,
    }

    // Store mode: faqat store mahsulotlar
    if (mode.kind === 'store') {
      baseFilters.itemType = 'store_product'
      baseFilters.storeId = mode.storeId
    } 
    // Service mode: faqat services
    else if (mode.kind === 'service') {
      baseFilters.itemType = 'service'
    }
    // Marketplace mode: hamma itemlar (listing + service)
    // itemType undefined = hammasi

    return baseFilters
  }, [searchQuery, filters, initialCategory, mode])

  // ✅ useUnifiedItems hook
  const { 
    data: unifiedItems = [], 
    isLoading, 
    isError,
    error,
    refetch 
  } = useUnifiedItems(unifiedFilters)

  // Track search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      // Legacy tracking
      if (user?.telegram_user_id) {
        trackUserSearch(
          user.telegram_user_id,
          searchQuery.trim(),
          initialCategory,
          unifiedItems.length
        )
      }
      // New analytics tracking
      trackSearch({
        query: searchQuery.trim(),
        category: initialCategory,
        resultCount: unifiedItems.length,
        userId: user?.telegram_user_id,
      })
    }
  }, [searchQuery, user?.telegram_user_id, initialCategory, unifiedItems.length])

  const handleCardClick = (item: typeof unifiedItems[0]) => {
    // Track view
    if (user?.telegram_user_id) {
      trackListingView(user.telegram_user_id, item.id, undefined)
    }
    // ✅ Routing: entity_type bo'yicha + useNavigateWithCtx
    if (item.type === 'service') {
      navigateWithCtx(`/service/${item.id}`)
    } else {
      navigateWithCtx(`/listing/${item.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <BackButton />
            <CartIcon />
            <div ref={autocompleteRef} className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowAutocomplete(true)}
                onKeyDown={handleKeyDown}
                placeholder="Qidiruv... (masalan: nike, krossovka, jinsi)"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 focus:bg-white transition-colors"
                autoFocus
              />
              {inputValue && (
                <button
                  onClick={() => {
                    setInputValue('')
                    setSearchQuery('')
                    inputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && (
                (inputValue.length < 2 && recentSearches.length > 0) ||
                (inputValue.length >= 2 && autocompleteResults.length > 0)
              ) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 
                                rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
                  {/* Recent searches (when no query) */}
                  {inputValue.length < 2 && recentSearches.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500 uppercase">So'nggi qidiruvlar</span>
                      </div>
                      {recentSearches.map((query, index) => (
                        <button
                          key={query}
                          onClick={() => handleSuggestionClick(query)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 
                                     transition-colors ${selectedIndex === index ? 'bg-primary/5' : ''}`}
                        >
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{query}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Autocomplete suggestions */}
                  {inputValue.length >= 2 && autocompleteResults.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500 uppercase">Tavsiyalar</span>
                      </div>
                      {autocompleteResults.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.query}`}
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 
                                     transition-colors ${selectedIndex === index ? 'bg-primary/5' : ''}`}
                        >
                          {getSuggestionIcon(suggestion.type)}
                          <span className="text-gray-700 flex-1">
                            {highlightMatch(suggestion.query, inputValue)}
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
          </div>
        </div>
        
        {/* Filters */}
        <SearchFilters filters={filters} onFiltersChange={setFilters} />
        
        {/* Smart Search Suggestions */}
        {searchQuery && (
          <SearchSuggestion 
            query={searchQuery} 
            onSuggestionClick={(suggestion) => handleSuggestionClick(suggestion)}
          />
        )}
      </header>

      {/* ✅ UI States: Loading/Error/Empty/Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Qidirilmoqda...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Xatolik yuz berdi
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {error?.message || 'Qidiruvda xatolik yuz berdi'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Qayta urinib ko'ring
          </button>
        </div>
      ) : unifiedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Natijalar topilmadi' : 'Qidiruvni boshlang'}
          </h2>
          <p className="text-gray-600 text-center">
            {searchQuery
              ? 'Boshqa kalit so\'zlarni sinab ko\'ring yoki filtrlarni tekshiring'
              : 'Mahallangizdagi buyumlarni qidiring'}
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            {unifiedItems.length} {unifiedItems.length === 1 ? 'natija' : 'natija'} topildi
            {initialCategory && (
              <span className="ml-2 text-primary">
                • Kategoriya: {initialCategory}
              </span>
            )}
          </p>
          
          {/* ✅ UniversalCard grid */}
          <div className="grid grid-cols-2 gap-4">
            {unifiedItems.map((item) => (
              <div
                key={item.stableId || item.id}
                onClick={() => handleCardClick(item)}
                className="cursor-pointer"
              >
                <UniversalCard
                  data={item}
                  variant={isBrandedMode ? 'store' : 'marketplace'}
                  layout="grid"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
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

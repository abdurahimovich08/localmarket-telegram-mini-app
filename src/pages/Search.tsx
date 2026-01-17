import { useState, useEffect, useMemo } from 'react'
import { useUser } from '../contexts/UserContext'
import { useAppMode } from '../contexts/AppModeContext'
import { useSearchParams } from 'react-router-dom'
import { useUnifiedItems } from '../hooks/useUnifiedItems'
import { useNavigateWithCtx } from '../lib/preserveCtx'
import { trackUserSearch, trackListingView } from '../lib/tracking'
import UniversalCard from '../components/UniversalCard'
import SearchFilters, { type SearchFilters as SearchFiltersType } from '../components/SearchFilters'
import SearchSuggestion from '../components/SearchSuggestion'
import BackButton from '../components/BackButton'
import CartIcon from '../components/CartIcon'
import BottomNav from '../components/BottomNav'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Search() {
  const { user } = useUser()
  const { mode } = useAppMode()
  const navigateWithCtx = useNavigateWithCtx()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || undefined
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFiltersType>({
    category: initialCategory as any,
    radius: user?.search_radius_miles || 10,
  })

  const isBrandedMode = mode.kind === 'store' || mode.kind === 'service'

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
    if (searchQuery.trim() && user?.telegram_user_id) {
      trackUserSearch(
        user.telegram_user_id,
        searchQuery.trim(),
        initialCategory,
        unifiedItems.length
      )
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
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidiruv... (masalan: kamaz, kmz, машин, kuchmas mulk)"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
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
            onSuggestionClick={(suggestion) => setSearchQuery(suggestion)}
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

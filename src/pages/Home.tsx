import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useAppMode } from '../contexts/AppModeContext'
import { getStores } from '../lib/supabase'
import { useUnifiedItems } from '../hooks/useUnifiedItems'
import { useNavigateWithCtx } from '../lib/preserveCtx'
import { trackListingView, trackUserSearch } from '../lib/tracking'
import type { Store } from '../types'
import UniversalCard from '../components/UniversalCard'
import Pagination from '../components/Pagination'
import CategoryCarousel from '../components/CategoryCarousel'
import CartIcon from '../components/CartIcon'
import { MagnifyingGlassIcon, PlusCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline'

type TabType = 'personalized' | 'deals'

export default function Home() {
  const { user } = useUser()
  const { mode } = useAppMode()
  const navigate = useNavigate()
  const navigateWithCtx = useNavigateWithCtx()
  const [stores, setStores] = useState<Store[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('personalized')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const isBrandedMode = mode.kind === 'store' || mode.kind === 'service'

  // ✅ Filters: mode'ga qarab minimal shartlar
  // ✅ useMemo bilan stable object (har renderda yangi object emas)
  const filters = useMemo(() => {
    if (mode.kind === 'store') {
      // Store mode: faqat store mahsulotlar
      return {
        itemType: 'store_product' as const,
        storeId: mode.storeId,
        limit: 100,
      }
    } else if (mode.kind === 'service') {
      // Service mode: faqat service
      return {
        itemType: 'service' as const,
        // Note: serviceId filter VIEW'da bo'lmasligi mumkin, lekin entity_type='service' yetarli
        limit: 100,
      }
    } else {
      // Marketplace mode: hamma itemlar (listing + service)
      return {
        // itemType undefined = hammasi
        limit: 100,
      }
    }
  }, [mode.kind, mode.storeId])

  // ✅ Query design: stable key with object params
  const queryKey = useMemo(() => [
    'unifiedItems',
    {
      modeKind: mode.kind,
      storeId: mode.kind === 'store' ? mode.storeId : undefined,
      serviceId: mode.kind === 'service' ? mode.serviceId : undefined,
      sort: 'created_at',
      page: currentPage,
    }
  ], [mode.kind, mode.storeId, mode.serviceId, currentPage])

  // ✅ useUnifiedItems hook
  const { 
    data: unifiedItems = [], 
    isLoading, 
    isError,
    error,
    refetch 
  } = useUnifiedItems(filters)

  // Load stores (only in marketplace mode)
  useEffect(() => {
    if (!isBrandedMode) {
      getStores(3, user?.telegram_user_id).then(setStores).catch(console.error)
    }
  }, [isBrandedMode, user?.telegram_user_id])

  // Filter items by category (for branded mode)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const storeCategories = isBrandedMode && unifiedItems.length > 0
    ? Array.from(new Set(unifiedItems.map(item => item.category))).filter(Boolean)
    : []

  const filteredItems = useMemo(() => {
    if (isBrandedMode && selectedCategory) {
      return unifiedItems.filter(item => item.category === selectedCategory)
    }
    return unifiedItems
  }, [unifiedItems, isBrandedMode, selectedCategory])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Reset to page 1 when tab or category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, selectedCategory])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (user?.telegram_user_id) {
        trackUserSearch(user.telegram_user_id, searchQuery.trim())
      }
      navigateWithCtx(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigateWithCtx('/search')
    }
  }

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

  // ✅ UI States: Skeleton/Empty/Error
  if (isLoading) {
    return (
      <div className={`min-h-screen pb-20 ${isBrandedMode ? 'gradient-purple-blue' : 'bg-gray-50'}`}>
        {/* Header */}
        {!isBrandedMode && (
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">LocalMarket</h1>
                <div className="flex items-center gap-2">
                  <CartIcon />
                  <Link to="/create" className="p-2 text-primary hover:text-primary/80 transition-colors">
                    <PlusCircleIcon className="w-6 h-6" />
                  </Link>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Skeleton Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={`aspect-square rounded-lg ${isBrandedMode ? 'bg-white/20' : 'bg-gray-200'}`} />
                <div className={`mt-2 h-4 rounded ${isBrandedMode ? 'bg-white/20' : 'bg-gray-200'}`} />
                <div className={`mt-1 h-3 rounded w-2/3 ${isBrandedMode ? 'bg-white/20' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={`min-h-screen pb-20 flex items-center justify-center ${isBrandedMode ? 'gradient-purple-blue' : 'bg-gray-50'}`}>
        <div className="text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`text-xl font-semibold mb-2 ${isBrandedMode ? 'text-white' : 'text-gray-900'}`}>
            Xatolik yuz berdi
          </h2>
          <p className={`mb-6 ${isBrandedMode ? 'text-white/80' : 'text-gray-600'}`}>
            {error?.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi'}
          </p>
          <button
            onClick={() => refetch()}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isBrandedMode 
                ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30' 
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            Qayta urinib ko'ring
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-20 ${isBrandedMode ? 'gradient-purple-blue' : 'bg-gray-50'}`}>
      {/* Header with Search - Only show in marketplace mode */}
      {!isBrandedMode && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">LocalMarket</h1>
              <div className="flex items-center gap-2 relative z-50">
                <CartIcon />
                <Link
                  to="/create"
                  className="p-2 text-primary hover:text-primary/80 transition-colors relative z-50"
                  title="E'lon Yaratish"
                >
                  <PlusCircleIcon className="w-6 h-6" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Qidiruv..."
                className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={handleSearch}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                  title="QR Scanner"
                >
                  <QrCodeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Category Carousel - Only show in marketplace mode */}
      {!isBrandedMode && <CategoryCarousel />}

      {/* Stores Section - Only show in marketplace mode */}
      {!isBrandedMode && stores.length > 0 && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="px-4 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Do'konlar</h2>
          </div>
          <div className="px-4 overflow-x-auto">
            <div className="flex gap-4">
              {stores.map((store) => (
                <div
                  key={store.store_id}
                  onClick={() => navigateWithCtx(`/store/${store.store_id}`)}
                  className="flex-shrink-0 w-64 bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  {store.banner_url ? (
                    <div className="relative w-full h-20 overflow-hidden">
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                  )}
                  <div className="p-3 relative">
                    <div className="flex items-start gap-3">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="w-12 h-12 rounded-full border-2 border-white -mt-6 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-white -mt-6 bg-primary/20 flex items-center justify-center">
                          <span className="text-lg text-primary font-semibold">
                            {store.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-medium text-gray-900 truncate">{store.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {store.subscriber_count} obunachi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Siz uchun / Kun narxlari - Only show in marketplace mode */}
      {!isBrandedMode && (
        <div className="bg-white border-b border-gray-200 sticky top-[140px] z-30">
          <div className="flex">
            <button
              onClick={() => setActiveTab('personalized')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'personalized'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Siz uchun
              {activeTab === 'personalized' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'deals'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kun narxlari
              {activeTab === 'deals' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Category Filters - Only in branded mode */}
      {isBrandedMode && storeCategories.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`neumorphic-category px-4 py-2 whitespace-nowrap ${
                selectedCategory === null ? 'neumorphic-category-active' : ''
              }`}
            >
              <span className="text-white font-medium">All</span>
            </button>
            {storeCategories.map((cat) => {
              const categoryEmoji = unifiedItems.find(item => item.category === cat)?.categoryEmoji || '📦'
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`neumorphic-category px-4 py-2 whitespace-nowrap flex items-center gap-2 ${
                    selectedCategory === cat ? 'neumorphic-category-active' : ''
                  }`}
                >
                  <span className="text-white text-lg">{categoryEmoji}</span>
                  <span className="text-white text-sm">{cat}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">
            {isBrandedMode ? '🛍️' : activeTab === 'personalized' ? '🎯' : '💰'}
          </div>
          <h2 className={`text-xl font-semibold mb-2 ${isBrandedMode ? 'text-white' : 'text-gray-900'}`}>
            {isBrandedMode 
              ? 'Do\'konda hozircha mahsulot yo\'q'
              : activeTab === 'personalized'
                ? 'Hali tavsiyalar yo\'q'
                : 'Hozircha aksiyalar yo\'q'}
          </h2>
          <p className={`text-center mb-6 ${isBrandedMode ? 'text-white/80' : 'text-gray-600'}`}>
            {isBrandedMode
              ? 'Tez orada yangi mahsulotlar paydo bo\'ladi'
              : activeTab === 'personalized'
                ? 'Bir nechta e\'lon ko\'rib, qidiruv qiling. Biz sizga mos tavsiyalar beramiz!'
                : 'Tez orada aksiya va bepul e\'lonlar paydo bo\'ladi.'}
          </p>
          {!isBrandedMode && (
            <Link
              to="/create"
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              E'lon Yaratish
            </Link>
          )}
        </div>
      ) : (
        <div className="p-4">
          {/* Items Grid */}
          {isBrandedMode ? (
            /* Branded Mode - Neumorphic Grid */
            <div className="grid grid-cols-2 gap-4">
              {paginatedItems.map((item) => (
                <div key={item.stableId || item.id} onClick={() => handleCardClick(item)}>
                  <UniversalCard
                    data={item}
                    variant="store"
                    layout="grid"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Marketplace Mode - Grid */
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredItems.length} {filteredItems.length === 1 ? 'natija' : 'natija'} ko'rsatilmoqda
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {paginatedItems.map((item) => (
                  <div key={item.stableId || item.id} onClick={() => handleCardClick(item)}>
                    <UniversalCard
                      data={item}
                      variant="marketplace"
                      layout="grid"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  )
}

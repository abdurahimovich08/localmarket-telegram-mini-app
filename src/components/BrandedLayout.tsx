import { ReactNode, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppMode } from '../contexts/AppModeContext'
import { useUser } from '../contexts/UserContext'
import { 
  getStore, 
  getService, 
  getStoreListings,
  subscribeToStore,
  unsubscribeFromStore,
  addToCart
} from '../lib/supabase'
import type { Store, Service, Listing } from '../types'
import { CATEGORIES } from '../types'
import { ArrowLeftIcon, ShareIcon, CheckBadgeIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'
import BottomNav from './BottomNav'
import LocationDisplay from './LocationDisplay'
import PremiumProductCard from './PremiumProductCard'
import StickyFloatingCart from './StickyFloatingCart'
import StoreTrustScore from './StoreTrustScore'
import CrossSellSection from './CrossSellSection'
import SkeletonLoading from './SkeletonLoading'
import StorePolicyRow from './StorePolicyRow'
import { useDebounce } from '../hooks/useDebounce'
import { trackStoreEvent } from '../lib/storeAnalytics'
import { initTelegram } from '../lib/telegram'

type SortType = 'newest' | 'cheapest' | 'popular'

interface BrandedLayoutProps {
  children: ReactNode
}

/**
 * BrandedLayout - Layout for store/service branded mode
 * Shows store/service header, scoped navigation, no global marketplace features
 */
export default function BrandedLayout({ children }: BrandedLayoutProps) {
  const { mode, resetAppMode } = useAppMode()
  const navigate = useNavigate()
  const { user } = useUser()
  const [store, setStore] = useState<Store | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Store listings state (for store mode)
  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [sortType, setSortType] = useState<SortType>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  useEffect(() => {
    const loadEntity = async () => {
      setLoading(true)
      try {
        if (mode.kind === 'store') {
          const storeData = await getStore(mode.storeId, user?.telegram_user_id)
          if (!storeData) {
            resetAppMode()
            return
          }
          setStore(storeData)
          
          // ✅ Load store listings
          setListingsLoading(true)
          try {
            const storeListings = await getStoreListings(mode.storeId)
            setListings(storeListings)
          } catch (error) {
            console.error('Error loading store listings:', error)
          } finally {
            setListingsLoading(false)
          }
          
          // ✅ Track store view
          trackStoreEvent({
            event_type: 'store_view',
            store_id: mode.storeId,
            user_telegram_id: user?.telegram_user_id
          })
        } else if (mode.kind === 'service') {
          const serviceData = await getService(mode.serviceId)
          if (!serviceData) {
            resetAppMode()
            return
          }
          setService(serviceData)
        }
      } catch (error) {
        console.error('Error loading store/service:', error)
        resetAppMode()
      } finally {
        setLoading(false)
      }
    }

    if (mode.kind !== 'marketplace') {
      loadEntity()
    } else {
      setLoading(false)
    }
  }, [mode, resetAppMode, user])
  
  // ✅ Track search
  useEffect(() => {
    if (debouncedSearchQuery && mode.kind === 'store' && mode.storeId) {
      trackStoreEvent({
        event_type: 'search_store',
        store_id: mode.storeId,
        user_telegram_id: user?.telegram_user_id,
        metadata: { query: debouncedSearchQuery }
      })
    }
  }, [debouncedSearchQuery, mode, user])
  
  // ✅ Track category select
  useEffect(() => {
    if (selectedCategory && mode.kind === 'store' && mode.storeId) {
      trackStoreEvent({
        event_type: 'category_select',
        store_id: mode.storeId,
        user_telegram_id: user?.telegram_user_id,
        metadata: { category: selectedCategory }
      })
    }
  }, [selectedCategory, mode, user])

  const handleShare = () => {
    const webApp = (window as any).Telegram?.WebApp
    if (webApp) {
      if (mode.kind === 'store' && store) {
        const shareText = `🏪 ${store.name}\n\n${store.description || 'Do\'konni ko\'ring'}\n\n${window.location.origin}/?ctx=store:${store.store_id}`
        webApp.sendData(JSON.stringify({
          type: 'share',
          text: shareText
        }))
      } else if (mode.kind === 'service' && service) {
        const shareText = `🛠 ${service.title}\n\n${service.description}\n\n${window.location.origin}/?ctx=service:${service.service_id}`
        webApp.sendData(JSON.stringify({
          type: 'share',
          text: shareText
        }))
      }
    } else {
      // Fallback: copy to clipboard
      const url = mode.kind === 'store' 
        ? `${window.location.origin}/?ctx=store:${mode.storeId}`
        : `${window.location.origin}/?ctx=service:${mode.serviceId}`
      navigator.clipboard.writeText(url)
      alert('Link nusxalandi!')
    }
  }

  // ✅ Handle subscribe
  const handleSubscribe = async () => {
    if (!user || !store || mode.kind !== 'store') return

    const previousState = {
      is_subscribed: store.is_subscribed,
      subscriber_count: store.subscriber_count || 0
    }

    setSubscribing(true)
    try {
      if (store.is_subscribed) {
        await unsubscribeFromStore(user.telegram_user_id, store.store_id)
        setStore({
          ...store,
          is_subscribed: false,
          subscriber_count: Math.max(0, (store.subscriber_count || 0) - 1)
        })
      } else {
        await subscribeToStore(user.telegram_user_id, store.store_id)
        setStore({
          ...store,
          is_subscribed: true,
          subscriber_count: (store.subscriber_count || 0) + 1
        })
      }
      
      trackStoreEvent({
        event_type: 'subscribe_store',
        store_id: store.store_id,
        user_telegram_id: user.telegram_user_id
      })
    } catch (error) {
      console.error('Error toggling subscription:', error)
      setStore({ ...store, ...previousState })
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setSubscribing(false)
    }
  }

  // ✅ Handle add to cart
  const handleAddToCart = async (listingId: string) => {
    if (!user) {
      alert('Iltimos, avval tizimga kiring')
      return
    }

    const webApp = initTelegram()
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('medium')
    }

    try {
      await addToCart(user.telegram_user_id, listingId, 1)
      
      if (mode.kind === 'store' && mode.storeId) {
        trackStoreEvent({
          event_type: 'add_to_cart',
          store_id: mode.storeId,
          listing_id: listingId,
          user_telegram_id: user.telegram_user_id
        })
      }
      
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    }
  }

  // ✅ Performance: useMemo for sorted listings
  const sortedListings = useMemo(() => {
    const sorted = [...listings]
    switch (sortType) {
      case 'cheapest':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'popular':
        return sorted.sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0))
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [listings, sortType])
  
  // ✅ Performance: useMemo for filtered listings
  const filteredListings = useMemo(() => {
    return sortedListings.filter(l => {
      const matchesCategory = !selectedCategory || l.category === selectedCategory
      const matchesSearch = !debouncedSearchQuery || 
        l.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        l.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [sortedListings, selectedCategory, debouncedSearchQuery])
  
  // ✅ Performance: useMemo for categories
  const storeCategories = useMemo(() => {
    return Array.from(new Set(listings.map(l => l.category))).filter(Boolean)
  }, [listings])

  if (loading) {
    return <SkeletonLoading type="store" count={6} />
  }

  const entity = mode.kind === 'store' ? store : service

  if (!entity) {
    return null
  }

  return (
    <div className="min-h-screen gradient-purple-blue">
      {/* Sticky Header - Do'kon nomi va Share tugmasi */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-purple-600/90 border-b border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={resetAppMode}
            className="p-2 -ml-2 text-white hover:text-white/80 transition-colors flex-shrink-0"
            title="Bozorga qaytish"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-bold text-white text-lg truncate px-2">
            {mode.kind === 'store' ? (store as Store).name : (service as Service).title}
          </h1>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 text-white hover:text-white/80 transition-colors flex-shrink-0"
            title="Ulashish"
          >
            <ShareIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Location Display - Sticky header ostida (faqat store uchun) */}
        {mode.kind === 'store' && (
          <div className="px-4 pb-3">
            <LocationDisplay 
              onLocationChange={(location) => {
                // Location o'zgarganda kerakli amallar
                console.log('Location updated:', location)
              }}
              className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm"
            />
          </div>
        )}
      </header>

      {/* YOUTUBE STYLE STORE HEADER */}
      {mode.kind === 'store' && store && (
        <div className="relative">
          {/* Background Photo (YouTube Style) */}
          <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 overflow-hidden">
            {store.banner_url ? (
              <img
                src={store.banner_url}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl text-white/30">🏪</span>
              </div>
            )}
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>

          {/* Store Identity Block (YouTube Style) */}
          <div className="px-4 pb-4 relative -mt-16 z-10">
            <div className="flex flex-row items-end gap-4">
              {/* Logo - Circular avatar (overlaps banner) */}
              {store.logo_url ? (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white overflow-hidden shadow-xl flex-shrink-0 bg-white">
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl md:text-4xl text-white font-bold">
                    {store.name[0].toUpperCase()}
                  </span>
                </div>
              )}

              {/* Store Info - Logo yonida */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight truncate">
                    {store.name}
                  </h2>
                  {store.is_verified && (
                    <CheckBadgeIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  )}
                </div>
                
                {/* Username - Store nomi ostida */}
                {store.owner?.username && (
                  <p className="text-white/80 text-sm md:text-base">
                    @{store.owner.username}
                  </p>
                )}
              </div>
            </div>

            {/* DESCRIPTION BLOCK */}
            {store.description && (
              <div className="mt-3">
                <p className="text-sm text-white/90 whitespace-pre-line line-clamp-3">
                  {store.description}
                </p>
              </div>
            )}
            
            {/* ✅ Subscribe Button - Premium CTA */}
            {user && user.telegram_user_id !== store.owner_telegram_id && (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className={`mt-4 w-full py-3.5 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                  store.is_subscribed
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                }`}
              >
                {subscribing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Kuting...
                  </span>
                ) : store.is_subscribed ? (
                  <span className="flex items-center justify-center gap-2">
                    <BellIconSolid className="w-5 h-5" />
                    Obuna bo'lingan
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">🔔</span>
                    Obuna bo'lish
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ Store Trust Score & Policy Row (for store mode) */}
      {mode.kind === 'store' && store && (
        <>
          <div className="px-4 mb-4">
            <StoreTrustScore store={store} averageResponseTime={5} />
          </div>
          <div className="px-4 mb-4">
            <StorePolicyRow />
          </div>
        </>
      )}

      {mode.kind === 'service' && service && (
        <div className="px-4 pt-4 pb-2">
          <div className="neumorphic-card p-4">
            <div className="flex items-start gap-3">
              {service.logo_url ? (
                <div className="w-16 h-16 rounded-lg border-2 border-white/30 overflow-hidden flex-shrink-0">
                  <img
                    src={service.logo_url}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛠</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">{service.title}</h2>
                <p className="text-sm text-white/80 line-clamp-2">{service.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pb-24">
        {/* ✅ Store Mode: Full CRO Features */}
        {mode.kind === 'store' && store && (
          <>
            {/* Search within Store */}
            <div className="px-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Do'kon ichidan qidirish..."
                  className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

            {/* Category Filters - Pills Style */}
            {storeCategories.length > 0 && (
              <div className="px-4 mb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCategory === null
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    Barchasi
                  </button>
                  {storeCategories.map((cat) => {
                    const category = CATEGORIES.find(c => c.value === cat)
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{category?.emoji || '📦'}</span>
                        <span>{category?.label || cat}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sort & Filter Bar */}
            <div className="px-4 mb-4">
              <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Saralash:</span>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none"
                >
                  <option value="newest">Yangi</option>
                  <option value="cheapest">Arzon</option>
                  <option value="popular">Mashhur</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {listingsLoading ? (
              <div className="px-4 pb-4">
                <SkeletonLoading type="product" count={6} />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="px-4 pb-4">
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  {searchQuery || selectedCategory ? (
                    <>
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-gray-900 text-lg font-semibold mb-2">Hech narsa topilmadi</p>
                      <p className="text-gray-500 text-sm mb-4">Boshqa qidiruv yoki kategoriya tanlang</p>
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory(null)
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Filtrlarni tozalash
                      </button>
                      {listings.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Mana shularni tavsiya qilamiz</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {listings.slice(0, 6).map((listing) => (
                              <PremiumProductCard 
                                key={listing.listing_id} 
                                listing={listing}
                                onAddToCart={() => handleAddToCart(listing.listing_id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">😕</div>
                      <p className="text-gray-900 text-lg font-semibold mb-2">Bu do'konda hozircha mahsulot yo'q</p>
                      <p className="text-gray-500 text-sm">Tez orada yangi mahsulotlar qo'shiladi</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  {filteredListings.map((listing) => (
                    <PremiumProductCard 
                      key={listing.listing_id} 
                      listing={listing}
                      onAddToCart={() => handleAddToCart(listing.listing_id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cross-Sell Section */}
            {filteredListings.length > 0 && (
              <div className="px-4 pb-4">
                <CrossSellSection 
                  listings={listings} 
                  title="Bu do'konda ko'p sotiladiganlar"
                  maxItems={4}
                  currentCategory={selectedCategory || undefined}
                  storeId={mode.storeId}
                  userId={user?.telegram_user_id}
                />
              </div>
            )}

            {/* Sticky Floating Cart */}
            <StickyFloatingCart storeId={mode.storeId} />
          </>
        )}

        {/* Service Mode or other content */}
        {mode.kind !== 'store' && children}
      </div>

      {/* Scoped Navigation - Neumorphic */}
      <nav className="fixed bottom-0 left-0 right-0 neumorphic-nav z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-4">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all"
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="text-xs text-white font-medium">Katalog</span>
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all"
          >
            <span className="text-2xl mb-1">🛒</span>
            <span className="text-xs text-white font-medium">Buyurtma</span>
          </button>
          <button
            onClick={() => {
              if (mode.kind === 'store') {
                navigate(`/store/${mode.storeId}`)
              } else if (mode.kind === 'service') {
                navigate(`/service/${mode.serviceId}`)
              }
            }}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all"
          >
            <span className="text-2xl mb-1">ℹ️</span>
            <span className="text-xs text-white font-medium">Ma'lumot</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

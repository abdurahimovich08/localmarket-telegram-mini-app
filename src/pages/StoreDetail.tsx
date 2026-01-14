import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { 
  getStore, 
  subscribeToStore, 
  unsubscribeFromStore, 
  getStoreListings, 
  getStorePosts, 
  getStorePromotions,
  getPromotionListings
} from '../lib/supabase'
import { trackListingInteraction } from '../lib/unifiedListingFeedback'
import type { Store, Listing, StorePost, StorePromotion } from '../types'
import { CATEGORIES } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import PremiumProductCard from '../components/PremiumProductCard'
import { 
  BellIcon, 
  CheckBadgeIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShareIcon,
  FireIcon,
  SparklesIcon,
  UsersIcon,
  ShoppingBagIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { 
  BellIcon as BellIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid'
import LocationDisplay from '../components/LocationDisplay'

type TabType = 'listings' | 'promotions' | 'posts'
type SortType = 'newest' | 'cheapest' | 'popular'

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [store, setStore] = useState<Store | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [promotions, setPromotions] = useState<StorePromotion[]>([])
  const [posts, setPosts] = useState<StorePost[]>([])
  const [promotionListings, setPromotionListings] = useState<{ [key: string]: Listing[] }>({})
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('listings')
  const [sortType, setSortType] = useState<SortType>('newest')
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Reset description state when store changes
  useEffect(() => {
    setShowFullDescription(false)
  }, [id])

  // Load liked posts from localStorage
  useEffect(() => {
    if (id && user) {
      const storageKey = `store_likes_${id}_${user.telegram_user_id}`
      const savedLikes = localStorage.getItem(storageKey)
      if (savedLikes) {
        try {
          const likesArray = JSON.parse(savedLikes)
          setLikedPosts(new Set(likesArray))
        } catch (e) {
          console.error('Error loading liked posts:', e)
        }
      }
    }
  }, [id, user])

  // Save liked posts to localStorage
  useEffect(() => {
    if (id && user && likedPosts.size > 0) {
      const storageKey = `store_likes_${id}_${user.telegram_user_id}`
      localStorage.setItem(storageKey, JSON.stringify(Array.from(likedPosts)))
    }
  }, [likedPosts, id, user])

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }

    loadStoreData()
  }, [id, user])

  const loadStoreData = async () => {
    if (!id) return

    setLoading(true)
    try {
      // Load store
      const storeData = await getStore(id, user?.telegram_user_id)
      if (!storeData) {
        navigate('/')
        return
      }
      setStore(storeData)

      // Load listings
      const storeListings = await getStoreListings(id)
      setListings(storeListings)

      // Load promotions
      const storePromotions = await getStorePromotions(id)
      setPromotions(storePromotions)

      // Load promotion listings
      const promotionListingMap: { [key: string]: Listing[] } = {}
      for (const promo of storePromotions) {
        const promoListings = await getPromotionListings(promo.promotion_id)
        promotionListingMap[promo.promotion_id] = promoListings
      }
      setPromotionListings(promotionListingMap)

      // Load posts
      const storePosts = await getStorePosts(id)
      setPosts(storePosts)
    } catch (error) {
      console.error('Error loading store data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user || !store) return

    // Optimistic UI update
    const previousState = {
      is_subscribed: store.is_subscribed,
      subscriber_count: store.subscriber_count
    }

    setSubscribing(true)
    
    // Immediately update UI (optimistic)
    if (store.is_subscribed) {
      setStore({ 
        ...store, 
        is_subscribed: false, 
        subscriber_count: Math.max(0, store.subscriber_count - 1) 
      })
    } else {
      setStore({ 
        ...store, 
        is_subscribed: true, 
        subscriber_count: store.subscriber_count + 1 
      })
    }

    try {
      if (previousState.is_subscribed) {
        await unsubscribeFromStore(user.telegram_user_id, store.store_id)
      } else {
        await subscribeToStore(user.telegram_user_id, store.store_id)
      }
    } catch (error) {
      console.error('Error toggling subscription:', error)
      // Rollback on error
      setStore({ 
        ...store, 
        is_subscribed: previousState.is_subscribed,
        subscriber_count: previousState.subscriber_count
      })
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setSubscribing(false)
    }
  }

  const togglePostLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const getSortedListings = () => {
    const sorted = [...listings]
    switch (sortType) {
      case 'cheapest':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'popular':
        return sorted.sort((a, b) => b.favorite_count - a.favorite_count)
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Tugadi'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} kun qoldi`
    if (hours > 0) return `${hours} soat qoldi`
    return 'Tez orada tugaydi'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!store) {
    return null
  }

  const isOwner = user && user.telegram_user_id === store.owner_telegram_id
  const storeUsername = store.owner?.username || `store_${store.store_id.slice(0, 8)}`
  const storeRating = store.owner?.rating_average || 0
  const sortedListings = getSortedListings()
  
  // Get unique categories from listings
  const storeCategories = Array.from(new Set(listings.map(l => l.category))).filter(Boolean)
  const filteredListings = selectedCategory 
    ? sortedListings.filter(l => l.category === selectedCategory)
    : sortedListings

  const handleShare = () => {
    const webApp = (window as any).Telegram?.WebApp
    if (webApp) {
      const shareText = `🏪 ${store.name}\n\n${store.description || 'Do\'konni ko\'ring'}\n\n${window.location.origin}/store/${store.store_id}`
      webApp.sendData(JSON.stringify({
        type: 'share',
        text: shareText
      }))
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/store/${store.store_id}`
      navigator.clipboard.writeText(url)
      alert('Link nusxalandi!')
    }
  }

  // Calculate store stats for social proof
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0)
  const totalFavorites = listings.reduce((sum, l) => sum + (l.favorite_count || 0), 0)
  const activePromotions = promotions.filter(p => new Date(p.end_date) > new Date()).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-bold text-gray-900 text-lg truncate px-2">
            {store.name}
          </h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="Ulashish"
          >
            <ShareIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        
        {/* Location Display */}
        <div className="px-4 pb-3">
          <LocationDisplay 
            onLocationChange={(location) => {
              console.log('Location updated:', location)
            }}
            className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200"
          />
        </div>
      </header>

      {/* Premium Hero Section */}
      <div className="relative">
        {/* Banner with Parallax Effect */}
        <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
          {store.banner_url ? (
            <img
              src={store.banner_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl text-white/20">🏪</span>
            </div>
          )}
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </div>

        {/* Store Identity - Premium Design */}
        <div className="px-4 pb-6 relative -mt-20 z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
            <div className="flex items-start gap-4 mb-4">
              {/* Premium Logo */}
              {store.logo_url ? (
                <div className="w-28 h-28 rounded-2xl border-4 border-white overflow-hidden shadow-xl flex-shrink-0 bg-white ring-4 ring-indigo-100">
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-4 ring-indigo-100">
                  <span className="text-4xl text-white font-bold">
                    {store.name[0].toUpperCase()}
                  </span>
                </div>
              )}

              {/* Store Info */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight truncate">
                    {store.name}
                  </h2>
                  {store.is_verified && (
                    <div className="flex-shrink-0">
                      <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                </div>
                
                {/* Username */}
                {store.owner?.username && (
                  <p className="text-gray-600 text-sm mb-3">
                    @{store.owner.username}
                  </p>
                )}

                {/* Premium Stats - Social Proof */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <ShoppingBagIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{listings.length}</span>
                    <span className="text-xs text-gray-500">mahsulot</span>
                  </div>
                  {store.subscriber_count > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <UsersIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{store.subscriber_count}</span>
                      <span className="text-xs text-gray-500">obunachi</span>
                    </div>
                  )}
                  {totalViews > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <EyeIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{totalViews}</span>
                      <span className="text-xs text-gray-500">ko'rish</span>
                    </div>
                  )}
                  {activePromotions > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <FireIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{activePromotions}</span>
                      <span className="text-xs text-gray-500">aksiya</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {store.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {store.description}
                </p>
              </div>
            )}

            {/* Subscribe Button - Premium CTA */}
            {!isOwner && (
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
                    <BellIcon className="w-5 h-5" />
                    Obuna bo'lish
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Premium Category Filters */}
      {storeCategories.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Kategoriyalar</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FunnelIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
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
                  className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
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
      <div className="px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredListings.length} ta mahsulot
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Yangi</option>
            <option value="cheapest">Arzon</option>
            <option value="popular">Mashhur</option>
          </select>
        </div>
      </div>

      {/* Premium Products Grid */}
      {activeTab === 'listings' && (
        <div className="px-4 pb-4">
          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-4">😕</div>
              <p className="text-gray-900 text-lg font-semibold mb-2">Bu do'konda hozircha mahsulot yo'q</p>
              <p className="text-gray-500 text-sm">Tez orada yangi mahsulotlar qo'shiladi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <PremiumProductCard 
                  key={listing.listing_id} 
                  listing={listing}
                  onAddToCart={() => {
                    // Add to cart logic
                    console.log('Add to cart:', listing.listing_id)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation - Premium Design */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50 safe-area-bottom shadow-lg">
        <div className="flex justify-around items-center h-16 px-4">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              activeTab === 'listings' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <ShoppingBagIcon className={`w-6 h-6 mb-1 ${activeTab === 'listings' ? 'scale-110' : ''} transition-transform`} />
            <span className="text-xs font-medium">Katalog</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
              activeTab === 'promotions' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            {activePromotions > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activePromotions}
              </span>
            )}
            <FireIcon className={`w-6 h-6 mb-1 ${activeTab === 'promotions' ? 'scale-110' : ''} transition-transform`} />
            <span className="text-xs font-medium">Aksiyalar</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              activeTab === 'posts' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <ChatBubbleLeftIcon className={`w-6 h-6 mb-1 ${activeTab === 'posts' ? 'scale-110' : ''} transition-transform`} />
            <span className="text-xs font-medium">Postlar</span>
          </button>
        </div>
      </nav>

      {/* Tabs Content */}
      <div className="p-4 pb-24">
        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            {promotions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <div className="text-6xl mb-4">🔥</div>
                <p className="text-gray-900 text-lg font-semibold mb-2">Hozircha aksiyalar yo'q</p>
                <p className="text-gray-500 text-sm">Tez orada yangi chegirmalar bo'ladi</p>
              </div>
            ) : (
              promotions.map((promo) => (
                <div key={promo.promotion_id} className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 rounded-2xl p-5 text-white shadow-xl overflow-hidden relative">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-3xl font-black mb-2">
                          {promo.discount_percent ? `${promo.discount_percent}% CHEGIRMA` : 'AKSIYA'}
                        </div>
                        {promo.title && (
                          <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
                        )}
                        {promo.description && (
                          <p className="text-sm opacity-95 mb-3">{promo.description}</p>
                        )}
                      </div>
                      <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                        <div className="text-xs opacity-90 mb-1">Tugash sanasi</div>
                        <div className="text-sm font-bold">{formatTimeRemaining(promo.end_date)}</div>
                      </div>
                    </div>
                    
                    {promotionListings[promo.promotion_id] && promotionListings[promo.promotion_id].length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {promotionListings[promo.promotion_id].slice(0, 4).map((listing) => (
                          <div 
                            key={listing.listing_id}
                            onClick={() => navigate(`/listing/${listing.listing_id}`)}
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 cursor-pointer hover:bg-white/30 transition-all transform hover:scale-105"
                          >
                            {listing.photos && listing.photos.length > 0 && (
                              <img
                                src={listing.photos[0]}
                                alt={listing.title}
                                className="w-full aspect-square object-cover rounded-lg mb-2"
                              />
                            )}
                            <p className="text-white text-sm font-bold truncate mb-1">{listing.title}</p>
                            <p className="text-white text-xs opacity-90">
                              {listing.price ? `${listing.price.toLocaleString()} so'm` : 'Bepul'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-900 text-lg font-semibold mb-2">Hozircha postlar yo'q</p>
                <p className="text-gray-500 text-sm">Do'kon yangiliklari va e'lonlari shu yerda paydo bo'ladi</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.post_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-gray-100">
                        <span className="text-xl text-white font-bold">
                          {store.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{store.name}</span>
                        {store.is_verified && (
                          <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={`mb-4 grid gap-3 ${
                      post.images.length === 1 ? 'grid-cols-1' : 
                      post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          className="w-full rounded-xl object-cover"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => togglePostLike(post.post_id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      {likedPosts.has(post.post_id) ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium">Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
                      <ArrowUpTrayIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

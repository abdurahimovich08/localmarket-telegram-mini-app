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
import ListingCard from '../components/ListingCard'
import StoreProductCard from '../components/StoreProductCard'
import { 
  BellIcon, 
  CheckBadgeIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShareIcon
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

  return (
    <div className="min-h-screen gradient-purple-blue pb-24">
      {/* Sticky Header - Do'kon nomi va Share tugmasi */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-purple-600/90 border-b border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-bold text-white text-lg truncate px-2">
            {store.name}
          </h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            title="Ulashish"
          >
            <ShareIcon className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Location Display - Sticky header ostida */}
        <div className="px-4 pb-3">
          <LocationDisplay 
            onLocationChange={(location) => {
              // Location o'zgarganda kerakli amallar
              console.log('Location updated:', location)
            }}
            className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm"
          />
        </div>
      </header>

      {/* Category Filters - Neumorphic */}
      {storeCategories.length > 0 && (
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
              const category = CATEGORIES.find(c => c.value === cat)
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`neumorphic-category px-4 py-2 whitespace-nowrap flex items-center gap-2 ${
                    selectedCategory === cat ? 'neumorphic-category-active' : ''
                  }`}
                >
                  <span className="text-white text-lg">{category?.emoji || '📦'}</span>
                  <span className="text-white text-sm">{category?.label || cat}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* YOUTUBE STYLE STORE HEADER */}
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

          {/* Store Stats */}
          <div className="mt-3 flex items-center gap-4 text-white/90">
            <span className="text-sm">
              {listings.length} mahsulot
            </span>
            {store.subscriber_count > 0 && (
              <span className="text-sm">
                {store.subscriber_count} obunachi
              </span>
            )}
          </div>

          {/* DESCRIPTION BLOCK */}
          {store.description && (
            <div className="mt-3">
              <p className="text-sm text-white/90 whitespace-pre-line line-clamp-3">
                {store.description}
              </p>
            </div>
          )}
        </div>
      </div>


      {/* CONTENT AREA - Products Grid (Listings Tab) */}
      {activeTab === 'listings' && (
        <div className="px-4 pb-4">
          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😕</div>
              <p className="text-white text-lg mb-2">Bu do'konda hozircha mahsulot yo'q</p>
              <p className="text-white/70 text-sm">Tez orada yangi mahsulotlar qo'shiladi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <StoreProductCard key={listing.listing_id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation - Neumorphic */}
      <nav className="fixed bottom-0 left-0 right-0 neumorphic-nav z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-4">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              activeTab === 'listings' ? 'neumorphic-nav-active' : ''
            }`}
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="text-xs text-white font-medium">Katalog</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              activeTab === 'promotions' ? 'neumorphic-nav-active' : ''
            }`}
          >
            <span className="text-2xl mb-1">🔥</span>
            <span className="text-xs text-white font-medium">Aksiyalar</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              activeTab === 'posts' ? 'neumorphic-nav-active' : ''
            }`}
          >
            <span className="text-2xl mb-1">📭</span>
            <span className="text-xs text-white font-medium">Postlar</span>
          </button>
        </div>
      </nav>

      {/* CONTENT AREA - Tabs */}
      <div className="p-4 pb-24">
        {/* AKSIYALAR TAB */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            {promotions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔥</div>
                <p className="text-white text-lg mb-2">Hozircha aksiyalar yo'q</p>
                <p className="text-white/70 text-sm">Tez orada yangi chegirmalar bo'ladi</p>
              </div>
            ) : (
              promotions.map((promo) => (
                <div key={promo.promotion_id} className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-2xl font-bold mb-1">
                        {promo.discount_percent ? `${promo.discount_percent}% chegirma` : 'Aksiya'}
                      </div>
                      {promo.title && (
                        <h3 className="text-lg font-semibold mb-1">{promo.title}</h3>
                      )}
                      {promo.description && (
                        <p className="text-sm opacity-90 mb-2">{promo.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-75 mb-1">Tugash sanasi</div>
                      <div className="text-sm font-semibold">{formatTimeRemaining(promo.end_date)}</div>
                    </div>
                  </div>
                  
                  {promotionListings[promo.promotion_id] && promotionListings[promo.promotion_id].length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {promotionListings[promo.promotion_id].slice(0, 4).map((listing) => (
                        <div 
                          key={listing.listing_id}
                          onClick={() => navigate(`/listing/${listing.listing_id}`)}
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-2 cursor-pointer hover:bg-white/30 transition-colors"
                        >
                          {listing.photos && listing.photos.length > 0 && (
                            <img
                              src={listing.photos[0]}
                              alt={listing.title}
                              className="w-full aspect-square object-cover rounded-lg mb-2"
                            />
                          )}
                          <p className="text-white text-sm font-medium truncate">{listing.title}</p>
                          <p className="text-white text-xs opacity-90">
                            {listing.price ? `$${listing.price}` : 'Bepul'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* POSTLAR TAB - Neumorphic style */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-white text-lg mb-2">Hozircha postlar yo'q</p>
                <p className="text-white/70 text-sm">Do'kon yangiliklari va e'lonlari shu yerda paydo bo'ladi</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.post_id} className="neumorphic-product-card p-4">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                        <span className="text-lg text-white font-semibold">
                          {store.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{store.name}</span>
                        {store.is_verified && (
                          <CheckBadgeIcon className="w-4 h-4 text-blue-300" />
                        )}
                      </div>
                      <div className="text-xs text-white/70">
                        {new Date(post.created_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-white/90 mb-3 whitespace-pre-wrap">{post.content}</p>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={`mb-3 grid gap-2 ${
                      post.images.length === 1 ? 'grid-cols-1' : 
                      post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          className="w-full rounded-lg object-cover"
                          style={{ aspectRatio: '1/1' }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Actions - Like, Comment, Share */}
                  <div className="flex items-center gap-6 pt-3 border-t border-white/20">
                    <button
                      onClick={() => togglePostLike(post.post_id)}
                      className="flex items-center gap-2 text-white/80 hover:text-red-300 transition-colors"
                    >
                      {likedPosts.has(post.post_id) ? (
                        <HeartIconSolid className="w-5 h-5 text-red-300" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                      <ArrowUpTrayIcon className="w-5 h-5" />
                      <span className="text-sm">Share</span>
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

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
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import ListingCard from '../components/ListingCard'
import { 
  BellIcon, 
  CheckBadgeIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { 
  BellIcon as BellIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid'

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
  const descriptionLines = store.description?.split('\n') || []
  const shouldShowMoreButton = descriptionLines.length > 3 || (store.description && store.description.length > 150)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900 truncate">{store.name}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* TOP BANNER - YouTube style (reduced height) */}
      {store.banner_url ? (
        <div className="relative w-full h-40 md:h-48 overflow-hidden bg-gray-100">
          <img 
            src={store.banner_url} 
            alt={store.name}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="relative w-full h-40 md:h-48 bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xl md:text-2xl font-bold">{store.name}</span>
          </div>
        </div>
      )}

      {/* STORE IDENTITY BLOCK - YouTube channel header style */}
      <div className="px-4 pb-4 bg-white border-b border-gray-200 relative z-10">
        <div className="flex flex-row items-start">
          {/* Logo - Circular avatar (overlaps banner) */}
          {store.logo_url ? (
            <div className="-mt-12 w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden shadow-lg flex-shrink-0 bg-white">
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="-mt-12 w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl md:text-3xl text-primary font-bold">
                {store.name[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Store Info */}
          <div className="ml-3 mt-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{store.name}</h2>
              {store.is_verified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <p className="text-gray-500 text-sm mt-1">
              @{storeUsername} • {listings.length} mahsulot{store.subscriber_count > 0 && ` • ${store.subscriber_count} obunachi`}
            </p>
          </div>
        </div>

        {/* DESCRIPTION BLOCK - with more/less toggle */}
        {store.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {showFullDescription || !shouldShowMoreButton 
                ? store.description 
                : `${store.description.slice(0, 150)}${store.description.length > 150 ? '...' : ''}`
              }
            </p>
            {shouldShowMoreButton && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-1 text-sm text-primary hover:text-primary-dark flex items-center gap-1"
              >
                {showFullDescription ? (
                  <>
                    Kamroq <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Ko'proq <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* PRIMARY ACTION BUTTON - Subscribe/Subscribed */}
        {!isOwner && user && (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className={`mt-4 w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              store.is_subscribed
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {store.is_subscribed ? (
              <>
                <BellIconSolid className="w-5 h-5" />
                Obuna bo'lingan 🔔
              </>
            ) : (
              <>
                <BellIcon className="w-5 h-5" />
                Obuna bo'lish
              </>
            )}
          </button>
        )}

        {isOwner && (
          <button
            onClick={() => navigate(`/store/${store.store_id}/edit`)}
            className="mt-4 w-full py-3 px-4 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Do'konni tahrirlash
          </button>
        )}
      </div>

      {/* NAVIGATION TABS - Horizontal scroll */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'listings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mahsulotlar ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'promotions'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Aksiyalar ({promotions.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Postlar ({posts.length})
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4">
        {/* MAHSULOTLAR TAB */}
        {activeTab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">😕</div>
                <p className="text-gray-600 text-lg mb-2">Bu do'konda hozircha mahsulot yo'q</p>
                <p className="text-gray-500 text-sm">Tez orada yangi mahsulotlar qo'shiladi</p>
              </div>
            ) : (
              <>
                {/* Sort Options */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Jami: {listings.length} mahsulot</span>
                  <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value as SortType)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="newest">Eng yangi</option>
                    <option value="cheapest">Eng arzon</option>
                    <option value="popular">Eng ko'p sotilgan</option>
                  </select>
                </div>

                {/* Listings Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {sortedListings.map((listing) => (
                    <ListingCard key={listing.listing_id} listing={listing} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* AKSIYALAR TAB */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            {promotions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔥</div>
                <p className="text-gray-600 text-lg mb-2">Hozircha aksiyalar yo'q</p>
                <p className="text-gray-500 text-sm">Tez orada yangi chegirmalar bo'ladi</p>
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

        {/* POSTLAR TAB - YouTube Community style */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg mb-2">Hozircha postlar yo'q</p>
                <p className="text-gray-500 text-sm">Do'kon yangiliklari va e'lonlari shu yerda paydo bo'ladi</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.post_id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg text-primary font-semibold">
                          {store.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{store.name}</span>
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
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>

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
                  <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => togglePostLike(post.post_id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      {likedPosts.has(post.post_id) ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
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

      <BottomNav />
    </div>
  )
}

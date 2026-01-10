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
import type { Store, Listing, StorePost, StorePromotion } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import ListingCard from '../components/ListingCard'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'

type TabType = 'listings' | 'promotions' | 'posts'

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

    setSubscribing(true)
    try {
      if (store.is_subscribed) {
        await unsubscribeFromStore(user.telegram_user_id, store.store_id)
        setStore({ ...store, is_subscribed: false, subscriber_count: Math.max(0, store.subscriber_count - 1) })
      } else {
        await subscribeToStore(user.telegram_user_id, store.store_id)
        setStore({ ...store, is_subscribed: true, subscriber_count: store.subscriber_count + 1 })
      }
    } catch (error) {
      console.error('Error toggling subscription:', error)
    } finally {
      setSubscribing(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900 truncate">{store.name}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Banner */}
      {store.banner_url && (
        <div className="relative w-full h-32 md:h-48 overflow-hidden">
          <img 
            src={store.banner_url} 
            alt={store.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Store Info */}
      <div className="bg-white border-b border-gray-200 px-4 pb-4">
        <div className="flex items-start gap-4 -mt-8">
          {/* Logo */}
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl text-primary font-semibold">
                {store.name[0].toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 pt-2">
            <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
            {store.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{store.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">
                {store.subscriber_count} obunachi
              </span>
              {store.is_verified && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                  ✓ Tekshirilgan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        {!isOwner && user && (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              store.is_subscribed
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {store.is_subscribed ? (
              <>
                <BellSlashIcon className="w-5 h-5" />
                Obuna bo'lingan
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
            className="mt-4 w-full py-2 px-4 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Do'konni tahrirlash
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'listings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            E'lonlar ({listings.length})
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

      {/* Content */}
      <div className="p-4">
        {activeTab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Hozircha e'lonlar yo'q</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.listing_id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="space-y-4">
            {promotions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Hozircha aksiyalar yo'q</p>
              </div>
            ) : (
              promotions.map((promo) => (
                <div key={promo.promotion_id} className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-4 text-white">
                  <h3 className="text-lg font-bold mb-1">{promo.title}</h3>
                  {promo.description && (
                    <p className="text-sm mb-2 opacity-90">{promo.description}</p>
                  )}
                  {promo.discount_percent && (
                    <div className="text-2xl font-bold mb-2">
                      {promo.discount_percent}% chegirma
                    </div>
                  )}
                  <div className="text-xs opacity-75">
                    {new Date(promo.end_date).toLocaleDateString('uz-UZ')} gacha
                  </div>
                  
                  {promotionListings[promo.promotion_id] && promotionListings[promo.promotion_id].length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {promotionListings[promo.promotion_id].slice(0, 4).map((listing) => (
                        <ListingCard key={listing.listing_id} listing={listing} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Hozircha postlar yo'q</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.post_id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg text-primary font-semibold">
                          {store.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          className="w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
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

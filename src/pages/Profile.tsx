import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getUser, getListings, getReviews, getUserStores, getUserStore, getUserServices } from '../lib/supabase'
import type { User, Listing, Review, Store, Service } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import ListingCard from '../components/ListingCard'
import PersonalLinks from '../components/PersonalLinks'
import { StarIcon, PlusIcon, BuildingStorefrontIcon, EyeIcon } from '@heroicons/react/24/solid'
import { ChartBarIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function Profile() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [userStore, setUserStore] = useState<Store | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'stores' | 'services'>('listings')

  const isOwnProfile = !id || (currentUser && parseInt(id) === currentUser.telegram_user_id)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const userId = id ? parseInt(id) : currentUser?.telegram_user_id
        if (!userId) {
          navigate('/')
          return
        }

        const userData = await getUser(userId)
        if (!userData) {
          navigate('/')
          return
        }

        setUser(userData)

        // Load user's listings
        const allListings = await getListings()
        const userListings = allListings.filter((l) => l.seller_telegram_id === userId)
        setListings(userListings)

        // Load reviews
        const userReviews = await getReviews(userId)
        setReviews(userReviews)

        // Load user stores (only for own profile)
        if (isOwnProfile) {
          const userStores = await getUserStores(userId)
          setStores(userStores)
          
          // Load single user store (one user = one store)
          const singleStore = await getUserStore(userId)
          setUserStore(singleStore)
          
          // Load user services
          const userServices = await getUserServices(userId)
          setServices(userServices)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [id, currentUser, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center font-semibold text-gray-900">Profile</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          {user.profile_photo_url ? (
            <img
              src={user.profile_photo_url}
              alt={user.first_name}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl text-primary font-semibold">
                {user.first_name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            {user.username && (
              <p className="text-gray-600">@{user.username}</p>
            )}
            {user.rating_average > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold">{user.rating_average.toFixed(1)}</span>
                <span className="text-sm text-gray-600">
                  ({user.total_reviews} {user.total_reviews === 1 ? 'sharh' : 'sharh'})
                </span>
              </div>
            )}
          </div>
        </div>

        {user.bio && (
          <p className="text-gray-700 mb-4">{user.bio}</p>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            <p className="text-sm text-gray-600">E'lonlar</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{user.items_sold_count}</p>
            <p className="text-sm text-gray-600">Sotilgan</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {user.rating_average > 0 ? user.rating_average.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-gray-600">Reyting</p>
          </div>
        </div>

        {user.neighborhood && (
          <p className="text-sm text-gray-600 mt-4">📍 {user.neighborhood}</p>
        )}

        {/* Personal Links Section (Own Profile Only) - Show even if no store/service yet */}
        {isOwnProfile && (
          <PersonalLinks 
            stores={stores}
            services={services}
            hasListings={listings.length > 0}
            botUsername={import.meta.env.VITE_BOT_USERNAME || 'your_bot'}
          />
        )}

        {/* Create Store / View Store Button (Own Profile Only) */}
        {isOwnProfile && (
          userStore ? (
            <button
              onClick={() => navigate(`/store/${userStore.store_id}`)}
              className="mt-4 w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <EyeIcon className="w-5 h-5" />
              Do'konni Ko'rish
            </button>
          ) : (
            <button
              onClick={() => navigate('/create-store')}
              className="mt-4 w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Do'kon Yaratish
            </button>
          )
        )}

        {/* Dashboard Button (Own Profile Only + Has Listings/Stores/Services) */}
        {isOwnProfile && (listings.length > 0 || stores.length > 0 || services.length > 0) && (
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            Dashboard
          </button>
        )}

        {/* SOQQANI Tahrirlash Button (Own Profile Only) - Yellow, below dashboard button */}
        {isOwnProfile && (
          services.length > 0 ? (
            <button
              onClick={() => navigate(`/service/${services[0].service_id}/edit`)}
              className="mt-3 w-full py-3 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
            >
              <EyeIcon className="w-5 h-5" />
              SOQQANI Tahrirlash
            </button>
          ) : (
            <button
              onClick={() => navigate('/create-service')}
              className="mt-3 w-full py-3 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              SOQQANI Tahrirlash
            </button>
          )
        )}

        {/* User Stores (Own Profile Only) */}
        {isOwnProfile && stores.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BuildingStorefrontIcon className="w-5 h-5 text-primary" />
                Mening do'konlarim ({stores.length})
              </h3>
            </div>
            <div className="space-y-2">
              {stores.slice(0, 3).map((store) => (
                <div
                  key={store.store_id}
                  onClick={() => navigate(`/store/${store.store_id}`)}
                  className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg text-primary font-semibold">
                          {store.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{store.name}</h4>
                      <p className="text-xs text-gray-500">
                        {store.subscriber_count} obunachi
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {stores.length > 3 && (
                <button
                  onClick={() => setActiveTab('stores')}
                  className="text-sm text-primary hover:underline w-full text-center py-2"
                >
                  Barcha do'konlarni ko'rish ({stores.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-3 text-center font-medium transition-colors whitespace-nowrap ${
              activeTab === 'listings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            E'lonlar ({listings.length})
          </button>
          {isOwnProfile && (
            <>
              <button
                onClick={() => setActiveTab('stores')}
                className={`flex-1 py-3 text-center font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'stores'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Do'konlar ({stores.length})
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-3 text-center font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Xizmatlar ({services.length})
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-center font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sharhlar ({reviews.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'stores' && isOwnProfile ? (
          stores.length === 0 ? (
            <div className="text-center py-12">
              <BuildingStorefrontIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Hali do'konlaringiz yo'q</p>
              <button
                onClick={() => navigate('/create-store')}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Birinchi do'koningizni yarating
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <div
                  key={store.store_id}
                  onClick={() => navigate(`/store/${store.store_id}`)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  {store.banner_url && (
                    <div className="relative w-full h-32 overflow-hidden">
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 relative">
                    <div className="flex items-start gap-4">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className={`w-16 h-16 rounded-full border-4 border-white ${store.banner_url ? '-mt-12 bg-white' : ''}`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full border-4 border-white bg-primary/20 flex items-center justify-center ${store.banner_url ? '-mt-12 bg-white' : ''}`}>
                          <span className="text-xl text-primary font-semibold">
                            {store.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-gray-900 truncate">{store.name}</h3>
                        {store.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{store.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">
                            {store.subscriber_count} obunachi
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'services' && isOwnProfile ? (
          services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Hali xizmatlaringiz yo'q</p>
              <button
                onClick={() => navigate('/create-service')}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Birinchi xizmatingizni yarating
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.service_id}
                  onClick={() => navigate(`/service/${service.service_id}`)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="p-4 flex items-start gap-4">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {service.title[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{service.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-semibold text-primary">{service.price || 'Kelishiladi'}</span>
                        <span className="text-xs text-gray-500">{service.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/service/${service.service_id}/edit`)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'listings' ? (
          listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Hali e'lonlar yo'q</p>
              {isOwnProfile && (
                <Link
                  to="/create"
                  className="inline-block mt-4 text-primary hover:underline"
                >
                  Birinchi e'loningizni yarating
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.listing_id} listing={listing} />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Hali sharhlar yo'q</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    {review.reviewer?.profile_photo_url ? (
                      <img
                        src={review.reviewer.profile_photo_url}
                        alt={review.reviewer.first_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {review.reviewer?.first_name[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {review.reviewer?.first_name} {review.reviewer?.last_name}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700 mb-2">{review.review_text}</p>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isOwnProfile && <BottomNav />}
    </div>
  )
}

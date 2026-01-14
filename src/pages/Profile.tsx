import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getUser, getListings, getReviews, getUserStores, getUserStore, getUserServices } from '../lib/supabase'
import { getBotUsername } from '../lib/telegram'
import type { User, Listing, Review, Store, Service } from '../types'
import BackButton from '../components/BackButton'
import BottomNav from '../components/BottomNav'
import ListingCard from '../components/ListingCard'
import PersonalLinks from '../components/PersonalLinks'
import { 
  StarIcon, 
  PlusIcon, 
  BuildingStorefrontIcon, 
  EyeIcon,
  ChartBarIcon,
  PencilIcon,
  SparklesIcon,
  ShoppingBagIcon,
  HeartIcon
} from '@heroicons/react/24/solid'
import { 
  StarIcon as StarIconOutline,
  WrenchScrewdriverIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

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
  }, [id, currentUser, navigate, isOwnProfile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Minimal Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center px-4 py-3">
          <BackButton />
          <h1 className="flex-1 text-center text-base font-semibold text-gray-900">Profil</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Profile Header - Apple Style */}
      <div className="bg-white">
        {/* User Info Card */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            {user.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt={user.first_name}
                className="w-20 h-20 rounded-full border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-100">
                <span className="text-2xl text-white font-semibold">
                  {user.first_name[0].toUpperCase()}
                </span>
              </div>
            )}
            
            {/* User Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                {user.first_name} {user.last_name}
              </h2>
              {user.username && (
                <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
              )}
              
              {/* Rating */}
              {user.rating_average > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {user.rating_average.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({user.total_reviews} {user.total_reviews === 1 ? 'sharh' : 'sharh'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">{user.bio}</p>
          )}

          {/* Location */}
          {user.neighborhood && (
            <p className="text-xs text-gray-500 mb-4">📍 {user.neighborhood}</p>
          )}

          {/* Stats - Minimal Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">E'lonlar</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{user.items_sold_count}</p>
              <p className="text-xs text-gray-500 mt-0.5">Sotilgan</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {user.rating_average > 0 ? user.rating_average.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Reyting</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Own Profile Only */}
        {isOwnProfile && (
          <div className="px-4 pb-4 space-y-2">
            {/* Personal Links - Already minimal */}
            <PersonalLinks 
              stores={stores}
              services={services}
              hasListings={listings.length > 0}
              botUsername={getBotUsername()}
            />

            {/* Action Buttons - Minimal */}
            <div className="space-y-2 pt-2">
              {userStore ? (
                <>
                  <button
                    onClick={() => navigate(`/store/${userStore.store_id}/manage`)}
                    className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <BuildingStorefrontIcon className="w-5 h-5" />
                    <span>Do'konni Boshqarish</span>
                  </button>
                  <button
                    onClick={() => navigate(`/store/${userStore.store_id}`)}
                    className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-900 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span>Do'konni Ko'rish</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/create-store')}
                  className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Do'kon Yaratish</span>
                </button>
              )}

              {/* Dashboard */}
              {(listings.length > 0 || stores.length > 0 || services.length > 0) && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
              )}

              {/* Service Edit/Create */}
              {services.length > 0 ? (
                <button
                  onClick={() => navigate(`/service/${services[0].service_id}/edit`)}
                  className="w-full py-3 px-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <WrenchScrewdriverIcon className="w-5 h-5" />
                  <span>Xizmatni Tahrirlash</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/create-service')}
                  className="w-full py-3 px-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Xizmat Yaratish</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Minimal Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-40">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'listings'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            E'lonlar
            {listings.length > 0 && (
              <span className={`ml-1.5 ${activeTab === 'listings' ? 'text-gray-900' : 'text-gray-400'}`}>
                ({listings.length})
              </span>
            )}
          </button>
          {isOwnProfile && (
            <>
              <button
                onClick={() => setActiveTab('stores')}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'stores'
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Do'konlar
                {stores.length > 0 && (
                  <span className={`ml-1.5 ${activeTab === 'stores' ? 'text-gray-900' : 'text-gray-400'}`}>
                    ({stores.length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'services'
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Xizmatlar
                {services.length > 0 && (
                  <span className={`ml-1.5 ${activeTab === 'services' ? 'text-gray-900' : 'text-gray-400'}`}>
                    ({services.length})
                  </span>
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'reviews'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Sharhlar
            {reviews.length > 0 && (
              <span className={`ml-1.5 ${activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-400'}`}>
                ({reviews.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content - Apple Style Cards */}
      <div className="p-4 space-y-4">
        {activeTab === 'stores' && isOwnProfile ? (
          stores.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BuildingStorefrontIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2 font-medium">Hali do'konlaringiz yo'q</p>
              <p className="text-sm text-gray-500 mb-6">Birinchi do'koningizni yarating va mijozlaringizga ulashing</p>
              <button
                onClick={() => navigate('/create-store')}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                Do'kon Yaratish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stores.map((store) => (
                <div
                  key={store.store_id}
                  onClick={() => navigate(`/store/${store.store_id}`)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
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
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className={`w-14 h-14 rounded-xl border-2 border-white ${store.banner_url ? '-mt-10 bg-white shadow-md' : ''}`}
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-xl border-2 border-white bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ${store.banner_url ? '-mt-10 bg-white shadow-md' : ''}`}>
                          <span className="text-lg text-white font-bold">
                            {store.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-gray-900 truncate mb-1">{store.name}</h3>
                        {store.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{store.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {store.subscriber_count} obunachi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'services' && isOwnProfile ? (
          services.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2 font-medium">Hali xizmatlaringiz yo'q</p>
              <p className="text-sm text-gray-500 mb-6">Xizmatlaringizni yarating va mijozlarga taklif qiling</p>
              <button
                onClick={() => navigate('/create-service')}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                Xizmat Yaratish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.service_id}
                  onClick={() => navigate(`/service/${service.service_id}`)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
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
                      <h3 className="font-bold text-gray-900 truncate mb-1">{service.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{service.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{service.price || 'Kelishiladi'}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{service.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/service/${service.service_id}/edit`)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
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
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <CubeIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2 font-medium">Hali e'lonlar yo'q</p>
              {isOwnProfile && (
                <>
                  <p className="text-sm text-gray-500 mb-6">Birinchi e'loningizni yarating va sotishni boshlang</p>
                  <Link
                    to="/create"
                    className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors active:scale-[0.98]"
                  >
                    E'lon Yaratish
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => (
                <ListingCard key={listing.listing_id} listing={listing} />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <StarIconOutline className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2 font-medium">Hali sharhlar yo'q</p>
                <p className="text-sm text-gray-500">Foydalanuvchilar sharh qo'shganda bu yerda ko'rinadi</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    {review.reviewer?.profile_photo_url ? (
                      <img
                        src={review.reviewer.profile_photo_url}
                        alt={review.reviewer.first_name}
                        className="w-10 h-10 rounded-full border border-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border border-gray-100">
                        <span className="text-sm text-white font-semibold">
                          {review.reviewer?.first_name[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {review.reviewer?.first_name} {review.reviewer?.last_name}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('uz-UZ', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{review.review_text}</p>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {review.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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

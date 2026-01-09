import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getUser, getListings, getReviews } from '../lib/supabase'
import type { User, Listing, Review } from '../types'
import BottomNav from '../components/BottomNav'
import ListingCard from '../components/ListingCard'
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/24/solid'

export default function Profile() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')

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
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
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
                  ({user.total_reviews} {user.total_reviews === 1 ? 'review' : 'reviews'})
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
            <p className="text-sm text-gray-600">Listings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{user.items_sold_count}</p>
            <p className="text-sm text-gray-600">Sold</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {user.rating_average > 0 ? user.rating_average.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-gray-600">Rating</p>
          </div>
        </div>

        {user.neighborhood && (
          <p className="text-sm text-gray-600 mt-4">📍 {user.neighborhood}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'listings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'listings' ? (
          listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No listings yet</p>
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

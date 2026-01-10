import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite } from '../lib/supabase'
import { openTelegramChat, shareListing, formatDistance } from '../lib/telegram'
import { trackListingView, trackUserInteraction } from '../lib/tracking'
import type { Listing } from '../types'
import { CATEGORIES, CONDITIONS } from '../types'
import { HeartIcon, ShareIcon, FlagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import AddToCartButton from '../components/AddToCartButton'
import BottomNav from '../components/BottomNav'

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    const loadListing = async () => {
      if (!id) return

      setLoading(true)
      try {
        const data = await getListing(id)
        if (data) {
          setListing(data)
          // Increment view count
          await incrementViewCount(id)
          // Track view
          if (user?.telegram_user_id) {
            trackListingView(user.telegram_user_id, id)
          }
          // Check if favorited
          if (user) {
            const isFav = await isFavorite(user.telegram_user_id, id)
            setFavorited(isFav)
          }
        }
      } catch (error) {
        console.error('Error loading listing:', error)
      } finally {
        setLoading(false)
      }
    }

    loadListing()
  }, [id, user])

  const handleToggleFavorite = async () => {
    if (!user || !listing) return
    
    // Track interaction
    if (user.telegram_user_id) {
      trackUserInteraction(user.telegram_user_id, listing.listing_id, 'favorite')
    }

    try {
      if (favorited) {
        await removeFavorite(user.telegram_user_id, listing.listing_id)
        setFavorited(false)
      } else {
        await addFavorite(user.telegram_user_id, listing.listing_id)
        setFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleMessageSeller = () => {
    if (!listing?.seller?.username) return

    const message = `Hi! I'm interested in your "${listing.title}" listed for ${listing.is_free ? 'free' : `$${listing.price}`}. Is it still available?`
    openTelegramChat(listing.seller.username, message)
  }

  const handleShare = () => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Listing not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    )
  }

  const category = CATEGORIES.find(c => c.value === listing.category)
  const condition = CONDITIONS.find(c => c.value === listing.condition)
  const priceText = listing.is_free ? 'Bepul' : `${listing.price?.toLocaleString()} so'm`

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900">E'lon Tafsilotlari</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Photo Gallery */}
      {listing.photos && listing.photos.length > 0 && (
        <div className="relative aspect-square bg-gray-100">
          <img
            src={listing.photos[currentPhotoIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          {listing.photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentPhotoIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 disabled:opacity-50"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => Math.min(listing.photos.length - 1, prev + 1))}
                disabled={currentPhotoIndex === listing.photos.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 disabled:opacity-50"
              >
                →
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {listing.photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title and Price */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-primary">{priceText}</span>
            {category && (
              <span className="text-sm text-gray-600">
                {category.emoji} {category.label}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Tavsif</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          {condition && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Holati</p>
              <p className="font-medium">{condition.label}</p>
            </div>
          )}
          {listing.neighborhood && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Joylashuv</p>
              <p className="font-medium">{listing.neighborhood}</p>
            </div>
          )}
          {listing.distance !== undefined && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Masofa</p>
              <p className="font-medium">{formatDistance(listing.distance)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Qo'shilgan</p>
            <p className="font-medium">
              {new Date(listing.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Seller Card */}
        {listing.seller && (
          <Link
            to={`/profile/${listing.seller.telegram_user_id}`}
            className="block p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              {listing.seller.profile_photo_url ? (
                <img
                  src={listing.seller.profile_photo_url}
                  alt={listing.seller.first_name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {listing.seller.first_name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {listing.seller.first_name} {listing.seller.last_name}
                </p>
                {listing.seller.rating_average > 0 && (
                  <p className="text-sm text-gray-600">
                    ⭐ {listing.seller.rating_average.toFixed(1)} ({listing.seller.total_reviews} sharh)
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleToggleFavorite}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
              favorited
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {favorited ? (
              <HeartIconSolid className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span className="font-medium">{favorited ? 'Saqlangan' : 'Saqlash'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
          >
            <ShareIcon className="w-5 h-5" />
            <span className="font-medium">Ulashish</span>
          </button>
          <button className="p-3 rounded-lg border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
            <FlagIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Add to Cart and Message Seller Buttons */}
        {listing.seller && listing.seller.telegram_user_id !== user?.telegram_user_id && (
          <div className="space-y-3 pt-4">
            <AddToCartButton
              listingId={listing.listing_id}
              className="w-full py-3"
            />
            <button
              onClick={handleMessageSeller}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              💬 Sotuvchiga Yozish
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

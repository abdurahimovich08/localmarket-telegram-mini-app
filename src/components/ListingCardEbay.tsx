// eBay-style listing card component
import { Link } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import type { Listing } from '../types'
import { CATEGORIES, CONDITIONS } from '../types'
import { formatDistance } from '../lib/telegram'

interface ListingCardEbayProps {
  listing: Listing
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export default function ListingCardEbay({ listing, isFavorite = false, onToggleFavorite }: ListingCardEbayProps) {
  const category = CATEGORIES.find(c => c.value === listing.category)
  const condition = CONDITIONS.find(c => c.value === listing.condition)
  const priceText = listing.is_free ? 'Bepul' : `${listing.price?.toLocaleString()} so'm`
  const sellerName = listing.seller?.first_name || 'Sotuvchi'

  return (
    <Link
      to={`/listing/${listing.listing_id}`}
      className="block bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <div className="flex gap-4 p-4">
        {/* Image Section - Left */}
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded">
          {listing.photos && listing.photos.length > 0 ? (
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              Rasm yo'q
            </div>
          )}
          {listing.is_boosted && (
            <div className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded">
              Targ'ib
            </div>
          )}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite()
              }}
              className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
            >
              {isFavorite ? (
                <HeartIconSolid className="w-4 h-4 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* Content Section - Right */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
            {listing.title}
          </h3>

          {/* Condition and Brand */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            {condition && (
              <span>{condition.label}</span>
            )}
            {category && (
              <>
                <span>•</span>
                <span>{category.label}</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="mb-2">
            <span className="text-lg font-bold text-gray-900">
              {priceText}
            </span>
            {listing.is_free && (
              <span className="ml-2 text-xs text-green-600 font-medium">
                Bepul yetkazib berish
              </span>
            )}
          </div>

          {/* Location */}
          {listing.neighborhood && (
            <p className="text-xs text-gray-500 mb-1">
              📍 {listing.neighborhood}
            </p>
          )}
          {listing.distance !== undefined && (
            <p className="text-xs text-gray-500">
              📍 {formatDistance(listing.distance)}
            </p>
          )}

          {/* Seller info */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {sellerName}
            </span>
            {listing.view_count > 0 && (
              <span className="text-xs text-gray-400">
                {listing.view_count} ko'rish
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

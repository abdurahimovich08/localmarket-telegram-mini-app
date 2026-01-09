import { Link } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import type { Listing } from '../types'
import { CATEGORIES } from '../types'
import { formatDistance } from '../lib/telegram'

interface ListingCardProps {
  listing: Listing
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export default function ListingCard({ listing, isFavorite = false, onToggleFavorite }: ListingCardProps) {
  const category = CATEGORIES.find(c => c.value === listing.category)
  const priceText = listing.is_free ? 'Free' : `$${listing.price?.toLocaleString()}`

  return (
    <Link
      to={`/listing/${listing.listing_id}`}
      className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-gray-100">
        {listing.photos && listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No photo</span>
          </div>
        )}
        {listing.is_boosted && (
          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
            🚀 Boosted
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            {isFavorite ? (
              <HeartIconSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <span className="text-lg font-bold text-primary ml-2 whitespace-nowrap">
            {priceText}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {category && (
            <span className="flex items-center gap-1">
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </span>
          )}
          {listing.distance !== undefined && (
            <>
              <span>•</span>
              <span>{formatDistance(listing.distance)}</span>
            </>
          )}
        </div>
        {listing.neighborhood && (
          <p className="text-xs text-gray-400 mt-1">{listing.neighborhood}</p>
        )}
      </div>
    </Link>
  )
}

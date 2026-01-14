import { Link } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import type { Listing } from '../types'

interface StoreProductCardProps {
  listing: Listing
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export default function StoreProductCard({ listing, isFavorite = false, onToggleFavorite }: StoreProductCardProps) {
  const priceText = listing.is_free ? 'Bepul' : `$${listing.price?.toLocaleString()}`

  return (
    <Link
      to={`/listing/${listing.listing_id}`}
      className="block neumorphic-product-card overflow-hidden"
    >
      <div className="relative aspect-square bg-gradient-to-br from-purple-400 to-pink-500">
        {listing.photos && listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/80">
            <span className="text-sm">Rasm yo'q</span>
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            {isFavorite ? (
              <HeartIconSolid className="w-5 h-5 text-blue-400" />
            ) : (
              <HeartIcon className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-white/70 text-xs mb-1 uppercase tracking-wide">
          {listing.category || 'Product'}
        </p>
        <h3 className="font-bold text-white text-base mb-2 line-clamp-2">
          {listing.title}
        </h3>
        <p className="text-white text-lg font-bold">
          {priceText}
        </p>
      </div>
    </Link>
  )
}

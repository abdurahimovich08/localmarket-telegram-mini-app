import { Link } from 'react-router-dom'
import { HeartIcon, EyeIcon, ShoppingCartIcon, FireIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import type { Listing } from '../types'
import { CATEGORIES } from '../types'

interface PremiumProductCardProps {
  listing: Listing
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onAddToCart?: () => void
}

export default function PremiumProductCard({ 
  listing, 
  isFavorite = false, 
  onToggleFavorite,
  onAddToCart 
}: PremiumProductCardProps) {
  const category = CATEGORIES.find(c => c.value === listing.category)
  const priceText = listing.is_free ? 'Bepul' : `${listing.price?.toLocaleString()} so'm`
  const hasDiscount = listing.old_price && listing.price && listing.old_price > listing.price
  const discountPercent = hasDiscount 
    ? Math.round((1 - listing.price / listing.old_price) * 100)
    : 0
  
  // Scarcity indicators
  const isLowStock = listing.stock_qty !== null && listing.stock_qty !== undefined && listing.stock_qty < 5 && listing.stock_qty > 0
  const isOutOfStock = listing.stock_qty === 0
  
  // Social proof
  const isPopular = listing.favorite_count > 10 || listing.view_count > 50
  const isNew = new Date(listing.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <Link to={`/listing/${listing.listing_id}`} className="block">
        {/* Image Container with Badges */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {listing.photos && listing.photos.length > 0 ? (
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-sm">Rasm yo'q</span>
            </div>
          )}
          
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Badges - Left Side */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {isNew && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                ✨ Yangi
              </span>
            )}
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                -{discountPercent}%
              </span>
            )}
            {isPopular && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <FireIcon className="w-3 h-3" />
                Trend
              </span>
            )}
          </div>
          
          {/* Top Badges - Right Side */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className="p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                {isFavorite ? (
                  <HeartIconSolid className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-700" />
                )}
              </button>
            )}
          </div>
          
          {/* Stock Indicator - Bottom */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3 bg-amber-500/95 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg text-center">
              ⚠️ Faqat {listing.stock_qty} dona qoldi!
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3 bg-red-500/95 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg text-center">
              ❌ Tugagan
            </div>
          )}
          
          {/* Quick Add to Cart - Appears on Hover */}
          {onAddToCart && !isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAddToCart()
                }}
                className="bg-white text-gray-900 font-bold px-6 py-3 rounded-full shadow-2xl transform hover:scale-105 transition-transform flex items-center gap-2"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span>Savatga</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {category && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg">{category.emoji}</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {category.label}
              </span>
            </div>
          )}
          
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          
          {/* Social Proof - Views & Favorites */}
          <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
            {listing.view_count > 0 && (
              <div className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                <span>{listing.view_count}</span>
              </div>
            )}
            {listing.favorite_count > 0 && (
              <div className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4" />
                <span>{listing.favorite_count}</span>
              </div>
            )}
          </div>
          
          {/* Price */}
          <div className="flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  {listing.price?.toLocaleString()} so'm
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {listing.old_price?.toLocaleString()} so'm
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {priceText}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

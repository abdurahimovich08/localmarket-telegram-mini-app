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

  // ✅ SMART BADGE PRIORITY SYSTEM (Apple style - minimal badges)
  // Priority: Low Stock > Discount > New > Popular
  const getPrimaryBadge = () => {
    if (isLowStock && !isOutOfStock) return { type: 'lowStock', text: `⚠️ ${listing.stock_qty} dona`, bgClass: 'bg-amber-500' }
    if (hasDiscount && discountPercent >= 30) return { type: 'discount', text: `-${discountPercent}%`, bgClass: 'bg-red-500' }
    if (isNew) return { type: 'new', text: '✨ Yangi', bgClass: 'bg-emerald-500' }
    if (isPopular) return { type: 'trend', text: '🔥 Trend', bgClass: 'bg-orange-500' }
    if (hasDiscount) return { type: 'discount', text: `-${discountPercent}%`, bgClass: 'bg-red-500' }
    return null
  }

  const primaryBadge = getPrimaryBadge()

  // Haptic feedback for mobile
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    const webApp = (window as any).Telegram?.WebApp
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(style)
    }
  }

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
          
          {/* Top Badges - Left Side (Smart Priority - Only Primary Badge) */}
          <div className="absolute top-3 left-3 z-10">
            {primaryBadge && (
              <span className={`${primaryBadge.bgClass} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg ${
                primaryBadge.type === 'new' ? 'animate-pulse' : ''
              } flex items-center gap-1`}>
                {primaryBadge.type === 'trend' && <FireIcon className="w-3 h-3" />}
                {primaryBadge.text}
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
          
          {/* Stock Indicator - Bottom (Only if not shown as primary badge) */}
          {isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3 bg-red-500/95 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg text-center z-10">
              ❌ Tugagan
            </div>
          )}
          
          {/* ✅ MOBILE-FIRST: Always Visible Add to Cart Button (Not Hover) */}
          {onAddToCart && !isOutOfStock && (
            <div className="absolute bottom-3 right-3 z-20">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  triggerHaptic('medium')
                  onAddToCart()
                }}
                className="p-3 bg-white/95 backdrop-blur-sm rounded-full shadow-xl hover:bg-white transition-all active:scale-95 flex items-center justify-center"
                title="Savatga qo'shish"
              >
                <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
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

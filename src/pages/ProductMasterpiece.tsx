/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🎨 PRODUCT MASTERPIECE - Immersive Full-Screen Experience
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Inspired by modern fashion apps - full screen immersive design
 * - Full screen product image
 * - Seller info at top
 * - Circular image gallery at bottom
 * - Category/collection badges
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite, addToCart } from '../lib/supabase'
import { openTelegramChat, shareListing } from '../lib/telegram'
import type { Listing } from '../types'
import { 
  ChevronLeftIcon,
  HeartIcon,
  ShareIcon,
  XMarkIcon,
  PlusIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon, FireIcon } from '@heroicons/react/24/solid'
import { getListingReviews, type Review } from '../lib/reviews'

export default function ProductMasterpiece() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  
  // State
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [favAnimating, setFavAnimating] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  
  // Touch handling for image swipe
  const touchStartX = useRef(0)
  
  // Photos
  const photos = useMemo(() => {
    const byColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
    if (selectedColor && byColor?.[selectedColor]?.length) {
      return byColor[selectedColor]
    }
    return listing?.photos || []
  }, [listing, selectedColor])
  
  // Variants
  const variants = useMemo(() => {
    const colors = new Set<string>()
    const sizes = new Set<string>()
    const stock: Record<string, number> = {}
    let total = 0
    
    if (listing?.attributes?.stock_by_size_color) {
      Object.entries(listing.attributes.stock_by_size_color).forEach(([key, qty]) => {
        const [size, color] = key.split('_')
        if (size) sizes.add(size)
        if (color) colors.add(color)
        stock[`${size}/${color}`] = qty as number
        total += qty as number
      })
    } else {
      listing?.attributes?.sizes?.forEach((s: string) => sizes.add(s))
      listing?.attributes?.colors?.forEach((c: string) => colors.add(c))
      total = listing?.stock_qty || 0
    }
    
    return { 
      colors: Array.from(colors), 
      sizes: Array.from(sizes), 
      stock, 
      total: total || listing?.stock_qty || 0 
    }
  }, [listing])
  
  // Discount
  const discount = useMemo(() => {
    if (listing?.attributes?.discount_percent && listing?.attributes?.discount_original_price) {
      return {
        percent: listing.attributes.discount_percent,
        original: listing.attributes.discount_original_price,
        savings: listing.attributes.discount_original_price - (listing.price || 0),
      }
    }
    return null
  }, [listing])
  
  // Review stats
  const reviewStats = useMemo(() => {
    if (!reviews.length) return { count: 0, average: 0 }
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    return { count: reviews.length, average: avg }
  }, [reviews])
  
  const isOwnListing = listing?.seller?.telegram_user_id === user?.telegram_user_id
  
  // Load data
  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getListing(id)
        if (data) {
          setListing(data)
          setFavoritesCount(data.favorites_count || 0)
          incrementViewCount(id)
          if (user?.telegram_user_id) {
            const fav = await isFavorite(user.telegram_user_id, id)
            setFavorited(fav)
          }
          const fetchedReviews = await getListingReviews(id)
          setReviews(fetchedReviews)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])
  
  // Handlers
  const toggleFavorite = useCallback(async () => {
    if (!user || !listing) return
    setFavAnimating(true)
    setTimeout(() => setFavAnimating(false), 600)
    
    if (favorited) {
      setFavoritesCount(prev => Math.max(0, prev - 1))
      setFavorited(false)
      await removeFavorite(user.telegram_user_id, listing.listing_id)
    } else {
      setFavoritesCount(prev => prev + 1)
      setFavorited(true)
      await addFavorite(user.telegram_user_id, listing.listing_id)
    }
  }, [user, listing, favorited])
  
  const handleShare = useCallback(() => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title)
  }, [listing])
  
  const messageSeller = useCallback(() => {
    if (!listing?.seller?.username) return
    openTelegramChat(listing.seller.username, `Salom! "${listing.title}" haqida so'ramoqchiman.`)
  }, [listing])
  
  // Image swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPhoto < photos.length - 1) {
        setCurrentPhoto(p => p + 1)
      } else if (diff < 0 && currentPhoto > 0) {
        setCurrentPhoto(p => p - 1)
      }
    }
  }
  
  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }
  
  // Not found
  if (!listing) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <div className="text-center p-8">
          <div className="text-6xl mb-4 opacity-50">📦</div>
          <p className="text-xl mb-4">Mahsulot topilmadi</p>
          <button onClick={() => navigate('/')} className="text-blue-400">
            ← Orqaga
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-black">
      
      {/* ═══════════════════════════════════════════════════════════════════
          🖼️ FULL SCREEN IMAGE BACKGROUND
      ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {photos.length > 0 ? (
          <img
            key={currentPhoto}
            src={photos[currentPhoto]}
            alt={listing.title}
            className="w-full h-full object-cover animate-fadeIn"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-8xl opacity-30">📷</span>
          </div>
        )}
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          📌 TOP BAR - Seller & Actions
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12">
        <div className="flex items-center justify-between">
          
          {/* Seller Info - Left */}
          <Link 
            to={`/profile/${listing.seller?.telegram_user_id}`}
            className="flex items-center gap-3 bg-white/20 backdrop-blur-xl rounded-full pl-1 pr-4 py-1"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/30 ring-2 ring-white/50">
              {listing.seller?.profile_photo_url ? (
                <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {listing.seller?.first_name?.[0]}
                </div>
              )}
            </div>
            <span className="text-white font-medium text-sm">
              {listing.seller?.first_name}
            </span>
          </Link>
          
          {/* Collection/Category Badge - Right */}
          {listing.subcategory && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl rounded-full px-4 py-2">
              <span className="text-white text-sm font-medium">
                {listing.subcategory.name || 'collection'}
              </span>
              <XMarkIcon className="w-4 h-4 text-white/70" />
            </div>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          ❤️ LIKE BUTTON - Right Side
      ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={toggleFavorite}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 ${
          favAnimating ? 'animate-heartbeat' : ''
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl ${
          favorited ? 'bg-red-500' : 'bg-white/20'
        }`}>
          {favorited ? (
            <HeartSolid className="w-6 h-6 text-white" />
          ) : (
            <HeartIcon className="w-6 h-6 text-white" />
          )}
        </div>
        <span className="text-white text-xs font-medium">
          {formatCount(favoritesCount)}
        </span>
      </button>
      
      {/* ═══════════════════════════════════════════════════════════════════
          ➕ ADD BUTTON - Right Side (below like)
      ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setShowDetails(true)}
        className="absolute right-4 top-[60%] z-20 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-lg"
      >
        <PlusIcon className="w-6 h-6 text-gray-800" />
      </button>
      
      {/* ═══════════════════════════════════════════════════════════════════
          📝 PRODUCT TITLE - Bottom
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-36 left-0 right-16 z-20 px-6">
        <h1 className="text-4xl font-light text-white leading-tight tracking-wide">
          {listing.title}
        </h1>
        
        {/* Price & Rating Row */}
        <div className="flex items-center gap-4 mt-3">
          <span className="text-2xl font-bold text-white">
            {listing.price?.toLocaleString()} <span className="text-lg font-normal opacity-70">so'm</span>
          </span>
          
          {reviewStats.count > 0 && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1">
              <StarIcon className="w-4 h-4 text-amber-400" />
              <span className="text-white text-sm font-medium">{reviewStats.average.toFixed(1)}</span>
              <span className="text-white/60 text-sm">({reviewStats.count})</span>
            </div>
          )}
          
          {discount && (
            <div className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              -{discount.percent}%
            </div>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          🔘 CIRCULAR IMAGE GALLERY - Bottom
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 left-0 right-0 z-20">
        <div className="flex items-end justify-center gap-3 px-4 overflow-x-auto pb-2">
          
          {/* Other photos - small circles */}
          {photos.map((photo, index) => {
            const isSelected = index === currentPhoto
            
            return (
              <button
                key={index}
                onClick={() => setCurrentPhoto(index)}
                className={`relative flex-shrink-0 transition-all duration-300 ${
                  isSelected ? 'scale-110' : 'scale-100'
                }`}
              >
                <div className={`rounded-full overflow-hidden transition-all duration-300 ${
                  isSelected 
                    ? 'w-20 h-20 ring-4 ring-white shadow-2xl' 
                    : 'w-14 h-14 ring-2 ring-white/50 opacity-80'
                }`}>
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </div>
                
                {/* Fire badge for selected/hot */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <FireIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            )
          })}
          
        </div>
        
        {/* Collection label below gallery */}
        {listing.subcategory && (
          <div className="flex justify-center mt-2">
            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-xl rounded-full px-4 py-1.5">
              <span className="text-white text-sm">
                {listing.subcategory.name || 'collection'}
              </span>
              <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                <span className="text-xs">🏷️</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          🛒 DETAILS BOTTOM SHEET
      ═══════════════════════════════════════════════════════════════════ */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowDetails(false)}>
          <div className="absolute inset-0 bg-black/60" />
          
          <div 
            className="relative w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center rounded-t-3xl">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            <div className="px-6 pb-8">
              {/* Title & Price */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{listing.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {listing.price?.toLocaleString()} so'm
                  </span>
                  {discount && (
                    <span className="text-lg text-gray-400 line-through">
                      {discount.original?.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Delivery badge */}
                {listing.attributes?.delivery_available && (
                  <div className="flex items-center gap-2 text-emerald-600 mt-3">
                    <span className="text-sm font-medium">🚚 Yetkazib berish mavjud</span>
                  </div>
                )}
              </div>
              
              {/* Color Selection */}
              {variants.colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Rang</h3>
                  <div className="flex flex-wrap gap-2">
                    {variants.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => { setSelectedColor(selectedColor === color ? null : color); setCurrentPhoto(0) }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                          selectedColor === color 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Size Selection */}
              {variants.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">O'lcham</h3>
                  <div className="flex flex-wrap gap-2">
                    {variants.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${
                          selectedSize === size 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              {listing.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Tavsif</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{listing.description}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              {!isOwnListing && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={messageSeller}
                    className="flex-1 h-14 rounded-2xl bg-gray-100 text-gray-800 font-semibold flex items-center justify-center gap-2"
                  >
                    💬 Yozish
                  </button>
                  <button
                    className="flex-1 h-14 rounded-2xl bg-gray-900 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                    Savatga
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════
          🔙 BACK BUTTON - Top Left Corner
      ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-12 left-4 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center"
      >
        <ChevronLeftIcon className="w-6 h-6 text-white" />
      </button>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1); }
          75% { transform: scale(1.2); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out;
        }
      `}</style>
    </div>
  )
}

// Helper function
function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return count.toString()
}

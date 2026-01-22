/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🏆 PRODUCT MASTERPIECE - Premium E-Commerce Experience
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
  TruckIcon,
  ShieldCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  StarIcon as StarOutline,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  SparklesIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon, FireIcon } from '@heroicons/react/24/solid'
import SimilarListings from '../components/SimilarListings'
import ReviewsSection from '../components/reviews/ReviewsSection'
import WriteReviewModal from '../components/reviews/WriteReviewModal'
import PurchaseClaimButton from '../components/reviews/PurchaseClaimButton'
import { 
  getListingReviews, 
  canWriteReview, 
  createReview, 
  voteReviewHelpful,
  type Review 
} from '../lib/reviews'

export default function ProductMasterpiece() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  
  // State
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [favAnimating, setFavAnimating] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [canUserReview, setCanUserReview] = useState(false)
  const [hasVerifiedPurchase, setHasVerifiedPurchase] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  const [variantError, setVariantError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<{ details: boolean; delivery: boolean; qa: boolean }>({
    details: true,
    delivery: true,
    qa: false,
  })
  
  // Refs
  const heroRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  
  // Photos
  const photos = useMemo(() => {
    const byColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
    if (selectedColor && byColor?.[selectedColor]?.length) {
      return byColor[selectedColor]
    }
    return listing?.photos || []
  }, [listing, selectedColor])
  
  const parseVariantKey = useCallback((key: string): { size?: string; color?: string } => {
    // Common formats in this repo: "S_red" (wizard), sometimes "S/red" (older code)
    if (key.includes('_')) {
      const [size, color] = key.split('_')
      return { size: size || undefined, color: color || undefined }
    }
    if (key.includes('/')) {
      const [size, color] = key.split('/')
      return { size: size || undefined, color: color || undefined }
    }
    return { size: key || undefined, color: undefined }
  }, [])

  const getStockForVariant = useCallback((size?: string | null, color?: string | null): number => {
    const stockMap = listing?.attributes?.stock_by_size_color as Record<string, number> | undefined
    if (!stockMap) return listing?.stock_qty || 0
    if (!size && !color) {
      return Object.values(stockMap).reduce((sum, v) => sum + (Number(v) || 0), 0)
    }
    if (size && color) {
      // Try both formats
      return Number(stockMap[`${size}_${color}`] ?? stockMap[`${size}/${color}`] ?? 0) || 0
    }
    // If only one dimension chosen, sum all matching
    const entries = Object.entries(stockMap)
    if (size && !color) {
      return entries.reduce((sum, [k, v]) => {
        const parsed = parseVariantKey(k)
        return parsed.size === size ? sum + (Number(v) || 0) : sum
      }, 0)
    }
    if (!size && color) {
      return entries.reduce((sum, [k, v]) => {
        const parsed = parseVariantKey(k)
        return parsed.color === color ? sum + (Number(v) || 0) : sum
      }, 0)
    }
    return 0
  }, [listing, parseVariantKey])

  // Variants
  const variants = useMemo(() => {
    const colors = new Set<string>()
    const sizes = new Set<string>()
    const stock: Record<string, number> = {}
    let total = 0
    
    if (listing?.attributes?.stock_by_size_color) {
      Object.entries(listing.attributes.stock_by_size_color).forEach(([key, qty]) => {
        const { size, color } = parseVariantKey(key)
        if (size) sizes.add(size)
        if (color) colors.add(color)
        // Keep both for easy lookup later
        if (size && color) {
          stock[`${size}_${color}`] = Number(qty) || 0
          stock[`${size}/${color}`] = Number(qty) || 0
        }
        total += Number(qty) || 0
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
  }, [listing, parseVariantKey])
  
  // Discount
  const discount = useMemo(() => {
    if (listing?.attributes?.discount_percent && listing?.attributes?.discount_original_price) {
      const savings = listing.attributes.discount_original_price - (listing.price || 0)
      return {
        percent: listing.attributes.discount_percent,
        original: listing.attributes.discount_original_price,
        savings,
      }
    }
    return null
  }, [listing])
  
  // Review stats
  const reviewStats = useMemo(() => {
    if (!reviews.length) return { count: 0, average: 0, distribution: [0,0,0,0,0] }
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    const dist = [0, 0, 0, 0, 0]
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++ })
    return { count: reviews.length, average: avg, distribution: dist }
  }, [reviews])
  
  // Seller trust level
  const sellerTrust = useMemo(() => {
    if (!listing?.seller) return null
    const { total_sales = 0, rating_average = 0, total_reviews = 0 } = listing.seller
    let level: 'new' | 'active' | 'trusted' | 'top' = 'new'
    if (total_sales >= 100 && rating_average >= 4.8) level = 'top'
    else if (total_sales >= 30 && rating_average >= 4.5) level = 'trusted'
    else if (total_sales >= 5) level = 'active'
    return { level, sales: total_sales, rating: rating_average, reviews: total_reviews }
  }, [listing?.seller])
  
  const isOwnListing = listing?.seller?.telegram_user_id === user?.telegram_user_id
  
  // Stock status
  const stockStatus = useMemo(() => {
    if (variants.total === 0) return { status: 'out', message: 'Tugagan', color: 'text-red-500' }
    if (variants.total <= 3) return { status: 'low', message: `Faqat ${variants.total} ta qoldi!`, color: 'text-orange-500' }
    if (variants.total <= 10) return { status: 'limited', message: `${variants.total} ta mavjud`, color: 'text-amber-600' }
    return { status: 'available', message: 'Mavjud', color: 'text-green-600' }
  }, [variants.total])

  // Condition label (must be above early returns to keep hooks order stable)
  const conditionLabel = useMemo(() => {
    const cond = listing?.condition
    if (!cond) return null
    if (cond === 'new') return 'Yangi'
    if (cond === 'like_new') return 'Like new'
    if (cond === 'good') return 'Yaxshi'
    if (cond === 'fair') return 'Qoniqarli'
    if (cond === 'poor') return 'Yomon'
    return null
  }, [listing?.condition])

  const selectedVariantStock = useMemo(() => {
    return getStockForVariant(selectedSize, selectedColor)
  }, [getStockForVariant, selectedSize, selectedColor])
  
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

          if (user?.telegram_user_id) {
            const { canWrite, claim } = await canWriteReview(id, user.telegram_user_id)
            setCanUserReview(canWrite)
            setHasVerifiedPurchase(!!claim)
          } else {
            setCanUserReview(false)
            setHasVerifiedPurchase(false)
          }
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
  
  const validateVariants = useCallback((): boolean => {
    if (!listing) return false
    if (variants.colors.length > 0 && !selectedColor) {
      setVariantError('Rang tanlang')
      return false
    }
    if (variants.sizes.length > 0 && !selectedSize) {
      setVariantError("O'lcham tanlang")
      return false
    }
    setVariantError(null)
    return true
  }, [listing, variants.colors.length, variants.sizes.length, selectedColor, selectedSize])

  const handleAddToCart = useCallback(async () => {
    if (!user || !listing || stockStatus.status === 'out') return
    if (!validateVariants()) return
    setAddingToCart(true)
    try {
      await addToCart(user.telegram_user_id, listing.listing_id, quantity)
      setCartSuccess(true)
      setTimeout(() => setCartSuccess(false), 2500)
    } finally {
      setAddingToCart(false)
    }
  }, [user, listing, quantity, stockStatus, validateVariants])
  
  const messageSeller = useCallback(() => {
    if (!listing?.seller?.username) return
    openTelegramChat(listing.seller.username, `Salom! "${listing.title}" haqida so'ramoqchiman.`)
  }, [listing])
  
  const handleShare = useCallback(() => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }, [listing])

  // Reviews handlers
  const handleSubmitReview = useCallback(async (reviewData: {
    rating: number
    text: string
    photos: string[]
    purchasedSize?: string
    purchasedColor?: string
  }) => {
    if (!id || !user?.telegram_user_id) return
    const newReview = await createReview(
      id,
      user.telegram_user_id,
      reviewData.rating,
      reviewData.text,
      reviewData.photos,
      reviewData.purchasedSize,
      reviewData.purchasedColor
    )

    if (newReview) {
      setReviews(prev => [newReview, ...prev])
      setCanUserReview(false)
    }
  }, [id, user?.telegram_user_id])

  const handleHelpfulVote = useCallback(async (reviewId: string, isHelpful: boolean) => {
    if (!user?.telegram_user_id) return
    await voteReviewHelpful(reviewId, user.telegram_user_id, isHelpful)
    setReviews(prev => prev.map(r => {
      if (r.review_id !== reviewId) return r
      return {
        ...r,
        helpful_count: isHelpful ? (r.helpful_count || 0) + 1 : r.helpful_count,
        not_helpful_count: !isHelpful ? (r.not_helpful_count || 0) + 1 : r.not_helpful_count,
      }
    }))
  }, [user?.telegram_user_id])
  
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }
  
  // Not found
  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 opacity-50">📦</div>
          <p className="text-xl mb-4">Mahsulot topilmadi</p>
          <button onClick={() => navigate('/')} className="text-blue-400">← Orqaga</button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-40">
      
      {/* ═══════════════════════════════════════════════════════════════════
          🖼️ IMMERSIVE HERO - Almost Full Screen (95vh)
          - Rasm deyarli butun ekranni egallaydi
          - Pastda faqat kichik hint ko'rinadi
      ═══════════════════════════════════════════════════════════════════ */}
      <section 
        ref={heroRef} 
        className="relative bg-black overflow-hidden"
        style={{ height: 'calc(100vh - 60px)' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Image */}
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
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          
          {/* Seller quick chip */}
          <Link 
            to={`/profile/${listing.seller?.telegram_user_id}`}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/20 transition-colors backdrop-blur-xl rounded-full pl-1 pr-4 py-1"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/30 ring-2 ring-white/40">
              {listing.seller?.profile_photo_url ? (
                <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                  {listing.seller?.first_name?.[0]}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">{listing.seller?.first_name}</span>
              {sellerTrust?.level === 'top' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/20">TOP</span>
              )}
              {sellerTrust?.level === 'trusted' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-300/20">Trusted</span>
              )}
            </div>
          </Link>
          
          {/* Category Badge */}
          {listing.subcategory && (
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-xl rounded-full px-3 py-1.5">
              <span className="text-white text-xs font-medium">{listing.subcategory.name}</span>
              <XMarkIcon className="w-3 h-3 text-white/70" />
            </div>
          )}
        </div>
        
        {/* Right Side Actions */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
          {/* Like Button */}
          <button
            onClick={toggleFavorite}
            className={`flex flex-col items-center gap-1 ${favAnimating ? 'animate-heartbeat' : ''}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl ${
              favorited ? 'bg-red-500' : 'bg-white/20'
            }`}>
              {favorited ? <HeartSolid className="w-6 h-6 text-white" /> : <HeartIcon className="w-6 h-6 text-white" />}
            </div>
            <span className="text-white text-xs font-medium">{formatCount(favoritesCount)}</span>
          </button>
          
          {/* Share Button */}
          <button onClick={handleShare} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
            <ShareIcon className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Bottom: Caption + Circular Gallery */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          {/* Micro copy */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            {conditionLabel && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                {conditionLabel}
              </span>
            )}
            {stockStatus.status !== 'available' && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 ${stockStatus.color}`}>
                {stockStatus.message}
              </span>
            )}
            {discount && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-200 border border-amber-300/20">
                -{discount.percent}% • Tejaysiz {discount.savings?.toLocaleString()} so'm
              </span>
            )}
          </div>
          
          {/* Color Variant Gallery - Mini Thumbnails */}
          {variants.colors.length > 0 ? (
            <div className="flex items-end justify-center gap-3 overflow-x-auto pb-2 px-2">
              {variants.colors.map((color) => {
                const byColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
                const colorPhotos = byColor?.[color] || listing?.photos || []
                const firstPhoto = colorPhotos[0] || listing?.photos?.[0] || ''
                const isSelected = selectedColor === color
                
                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color)
                      setCurrentPhoto(0)
                    }}
                    className={`relative flex-shrink-0 transition-all duration-300 ${isSelected ? 'scale-105' : ''}`}
                  >
                    <div className={`rounded-xl overflow-hidden transition-all duration-300 ${
                      isSelected 
                        ? 'w-20 h-20 ring-3 ring-orange-500 shadow-xl' 
                        : 'w-16 h-16 ring-2 ring-white/40 opacity-80 hover:opacity-100'
                    }`}>
                      <img src={firstPhoto} alt={color} className="w-full h-full object-cover" />
                    </div>
                    {isSelected && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-orange-500 rounded-full">
                        <span className="text-[10px] font-semibold text-white capitalize">{color}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            /* Fallback: Original Circular Gallery if no color variants */
            <div className="flex items-end justify-center gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => {
                const isSelected = index === currentPhoto
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPhoto(index)}
                    className={`relative flex-shrink-0 transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
                  >
                    <div className={`rounded-full overflow-hidden transition-all duration-300 ${
                      isSelected 
                        ? 'w-16 h-16 ring-3 ring-white shadow-xl' 
                        : 'w-12 h-12 ring-2 ring-white/40 opacity-70'
                    }`}>
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <FireIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          
          {/* Collection Label */}
          {listing.subcategory && (
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-2 bg-white/25 backdrop-blur-xl rounded-full px-4 py-1.5">
                <span className="text-white text-sm">{listing.subcategory.name}</span>
                <span>🏷️</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          📦 CONTENT SHEET - Scrolls over image
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 bg-[#FAFAF8] rounded-t-[28px] -mt-7" style={{ boxShadow: '0 -8px 30px rgba(0,0,0,0.1)' }}>
        {/* Pull Indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>
        
      {/* ═══════════════════════════════════════════════════════════════════
          💰 DECISION ZONE - Core shopping info (clothing-style)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-2 bg-white rounded-3xl shadow-sm overflow-hidden relative">
        {/* Discount Ribbon */}
        {discount && (
          <div className="absolute top-0 right-0 z-20 w-24 h-24 overflow-hidden">
            <div className="absolute top-4 -right-8 w-32 bg-amber-500 text-white text-sm font-bold py-1.5 text-center shadow-lg" style={{ transform: 'rotate(45deg)' }}>
              -{discount.percent}%
            </div>
          </div>
        )}
        
        <div className="p-5">
          {/* Brand Tag */}
          {listing.attributes?.brand && (
            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              <TagIcon className="w-3 h-3" />
              {listing.attributes.brand}
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight mb-2 pr-16 tracking-tight">
            {listing.title}
          </h1>
          
          {/* Rating & Reviews Row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {reviewStats.count > 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                  <StarIcon className="w-4 h-4 text-amber-500" />
                  <span className="ml-1 font-bold text-amber-700">{reviewStats.average.toFixed(1)}</span>
                </div>
                <span className="text-gray-400 text-sm">({reviewStats.count} sharh)</span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <StarOutline className="w-4 h-4" />
                Yangi mahsulot
              </span>
            )}
            {conditionLabel && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                {conditionLabel}
              </span>
            )}
          </div>
          
          {/* Price Section */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-[38px] font-black text-gray-900 tracking-tight leading-none">
              {listing.price?.toLocaleString()}
              <span className="text-lg font-medium text-gray-500 ml-1">so'm</span>
            </span>
            {discount && (
              <span className="text-xl text-gray-400 line-through mb-1">
                {discount.original?.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Delivery Badge */}
          {listing.attributes?.delivery_available && (
            <div className="flex items-center gap-2 text-emerald-600 mb-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <TruckIcon className="w-3 h-3" />
              </div>
              <span className="text-sm font-medium">Yetkazib berish mavjud</span>
            </div>
          )}
          
          {/* Stock Status */}
          {stockStatus.status !== 'available' && stockStatus.status !== 'out' && (
            <div className={`inline-flex items-center gap-2 ${stockStatus.color} text-sm font-semibold bg-orange-50 px-3 py-1.5 rounded-full`}>
              <SparklesIcon className="w-4 h-4" />
              {stockStatus.message}
            </div>
          )}

          {/* Variant-required hint */}
          {variantError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              <span className="font-semibold">⚠️</span>
              <span>{variantError}</span>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          🎨 VARIANT SELECTION (Only Sizes - Colors moved to image gallery)
      ═══════════════════════════════════════════════════════════════════ */}
      {variants.sizes.length > 0 && (
        <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Sizes */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">O'lcham tanlang</h3>
              {selectedSize && <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedSize}</span>}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {variants.sizes.map(size => {
                const isSelected = selectedSize === size
                const inStock = getStockForVariant(size, selectedColor) > 0
                
                return (
                  <button
                    key={size}
                    onClick={() => inStock && setSelectedSize(isSelected ? null : size)}
                    disabled={!inStock}
                    className={`relative h-12 rounded-xl font-semibold transition-all ${
                      isSelected ? 'bg-black text-white' : inStock ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            {/* Selected stock info */}
            {(selectedSize || selectedColor) && (
              <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
                <span>Tanlangan variant mavjudligi</span>
                <span className={`font-semibold ${selectedVariantStock > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {selectedVariantStock > 0 ? `${selectedVariantStock} ta` : 'Tugagan'}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          🛡️ TRUST ZONE - Seller
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
        {listing.seller && (
          <Link to={`/profile/${listing.seller.telegram_user_id}`} className="block p-5 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {listing.seller.profile_photo_url ? (
                    <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {listing.seller.first_name?.[0]}
                    </div>
                  )}
                </div>
                {sellerTrust?.level === 'top' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs">👑</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{listing.seller.first_name}</p>
                {sellerTrust && sellerTrust.reviews > 0 ? (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <StarIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{sellerTrust.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span>{sellerTrust.sales} sotuv</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Yangi sotuvchi</p>
                )}
              </div>
              
              {!isOwnListing && (
                <button onClick={(e) => { e.preventDefault(); messageSeller() }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700">
                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                  Yozish
                </button>
              )}
            </div>
          </Link>
        )}
        
        {/* Trust Badges */}
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="p-4 text-center">
            <TruckIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">{listing.attributes?.delivery_available ? 'Yetkaziladi' : 'Olib ketish'}</p>
          </div>
          <div className="p-4 text-center">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Xavfsiz</p>
          </div>
          <div className="p-4 text-center">
            <ClockIcon className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Tez javob</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          📋 DETAILS - Accordion blocks (premium clarity)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* Details */}
        <button
          onClick={() => setExpanded(e => ({ ...e, details: !e.details }))}
          className="w-full px-5 py-4 flex items-center justify-between"
        >
          <span className="font-bold text-gray-900">Mahsulot haqida</span>
          <span className="text-gray-400">{expanded.details ? '−' : '+'}</span>
        </button>
        {expanded.details && (
          <div className="px-5 pb-5 border-b border-gray-100">
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {listing.description || 'Tavsif mavjud emas'}
            </p>

            {listing.neighborhood && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Joylashuv</p>
                  <p className="text-sm text-gray-500">{listing.neighborhood}</p>
                </div>
              </div>
            )}

            {/* Specs (optional) */}
            {listing.attributes && Object.keys(listing.attributes).length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-900">Xususiyatlar</p>
                  <button
                    onClick={() => setShowAllSpecs(s => !s)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showAllSpecs ? 'Yopish' : "Ko'proq"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(listing.attributes)
                    .filter(([k]) => !['stock_by_size_color', 'photos_by_color'].includes(k))
                    .slice(0, showAllSpecs ? 12 : 6)
                    .map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-gray-500 truncate">{k}</p>
                        <p className="text-sm text-gray-900 truncate">{String(v)}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delivery & returns */}
        <button
          onClick={() => setExpanded(e => ({ ...e, delivery: !e.delivery }))}
          className="w-full px-5 py-4 flex items-center justify-between"
        >
          <span className="font-bold text-gray-900">Yetkazish & olish</span>
          <span className="text-gray-400">{expanded.delivery ? '−' : '+'}</span>
        </button>
        {expanded.delivery && (
          <div className="px-5 pb-5 border-b border-gray-100">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {listing.attributes?.delivery_available ? 'Yetkazib berish mavjud' : 'Olib ketish (lokatsiya bo‘yicha)'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {listing.attributes?.delivery_available
                      ? 'Sotuvchi bilan yozishib yetkazish narxi va vaqtini kelishing.'
                      : 'Mahsulotni joyida ko‘rib, tekshirib olishingiz mumkin.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ishonch</p>
                  <p className="text-sm text-gray-500">Sharhlar va tasdiqlangan xaridlar sotuvchi reputatsiyasini ko‘rsatadi.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Q/A */}
        <button
          onClick={() => setExpanded(e => ({ ...e, qa: !e.qa }))}
          className="w-full px-5 py-4 flex items-center justify-between"
        >
          <span className="font-bold text-gray-900">Savollar</span>
          <span className="text-gray-400">{expanded.qa ? '−' : '+'}</span>
        </button>
        {expanded.qa && (
          <div className="px-5 pb-5">
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Qanday olish mumkin?</p>
                <p className="text-sm text-gray-600">Pastdagi “Savatga qo‘shish” yoki “Yozish” orqali sotuvchiga chiqasiz.</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Rang/o‘lcham tugab qolgan bo‘lsa?</p>
                <p className="text-sm text-gray-600">Boshqa rang/o‘lchamni tanlab ko‘ring yoki sotuvchidan so‘rang.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ⭐ REVIEWS - full section + verified gating
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-5 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Sharhlar</h2>
            <span className="text-white/50 text-sm">{reviewStats.count} ta</span>
          </div>

          {/* Purchase claim gating (buyer only) */}
          {user?.telegram_user_id && !isOwnListing && (
            <div className="mb-4">
              <PurchaseClaimButton
                listingId={listing.listing_id}
                buyerTelegramId={user.telegram_user_id}
                selectedSize={selectedSize || undefined}
                selectedColor={selectedColor || undefined}
                onClaimApproved={() => {
                  setHasVerifiedPurchase(true)
                  if (id && user?.telegram_user_id) {
                    canWriteReview(id, user.telegram_user_id).then(({ canWrite }) => setCanUserReview(canWrite))
                  }
                }}
                onWriteReview={() => setShowReviewModal(true)}
              />
            </div>
          )}

          <ReviewsSection
            reviews={reviews as any}
            averageRating={reviewStats.average}
            totalReviews={reviewStats.count}
            canWriteReview={canUserReview}
            hasVerifiedPurchase={hasVerifiedPurchase}
            onWriteReview={() => setShowReviewModal(true)}
            onHelpful={(reviewId, isHelpful) => handleHelpfulVote(reviewId, isHelpful)}
            currentUserTelegramId={user?.telegram_user_id}
          />
        </div>
      </section>

      {/* Similar listings */}
      <div className="mt-4">
        <SimilarListings listing={listing} />
      </div>

      <div className="h-8" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          🛒 FLOATING ACTION BAR
      ═══════════════════════════════════════════════════════════════════ */}
      {!isOwnListing && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="h-6 bg-gradient-to-t from-white to-transparent" />
          <div className="bg-white border-t border-gray-100 px-4 pb-6 pt-3">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Narx</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-gray-900">{listing.price?.toLocaleString()}</span>
                    <span className="text-gray-500">so'm</span>
                  </div>
                  {(variants.colors.length > 0 || variants.sizes.length > 0) && (
                    <p className="text-xs text-gray-500 truncate">
                      Variant: {selectedColor || '—'} / {selectedSize || '—'}
                    </p>
                  )}
                </div>

                <div className="flex items-center bg-gray-100 rounded-full">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center">
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center">
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {variantError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {variantError}
                </div>
              )}
              
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || stockStatus.status === 'out'}
                className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  cartSuccess ? 'bg-green-500 text-white' : stockStatus.status === 'out' ? 'bg-gray-200 text-gray-400' : 'bg-black text-white'
                }`}
              >
                {addingToCart ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : cartSuccess ? (
                  <><CheckIcon className="w-6 h-6" /> Qo'shildi!</>
                ) : (
                  "Savatga qo'shish"
                )}
              </button>

              {!isOwnListing && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    onClick={messageSeller}
                    className="h-12 rounded-2xl bg-gray-100 text-gray-800 font-semibold flex items-center justify-center gap-2"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                    Yozish
                  </button>
                  <button
                    onClick={handleShare}
                    className="h-12 rounded-2xl bg-gray-100 text-gray-800 font-semibold flex items-center justify-center gap-2"
                  >
                    <ShareIcon className="w-5 h-5" />
                    Ulashish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        listingTitle={listing.title}
        listingPhoto={photos[0]}
        purchasedSize={selectedSize || undefined}
        purchasedColor={selectedColor || undefined}
      />

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.3); } 50% { transform: scale(1); } 75% { transform: scale(1.2); } }
        .animate-heartbeat { animation: heartbeat 0.6s ease-in-out; }
      `}</style>
    </div>
  )
}

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return count.toString()
}

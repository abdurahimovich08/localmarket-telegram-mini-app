/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🏆 PRODUCT MASTERPIECE - Premium E-Commerce Experience
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY:
 * 
 * 👁️ SOTIB OLUVCHI UCHUN:
 *    - Ishonch: Xavfsiz sotib olish hissi
 *    - Aniqlik: Nima olayotganini tezda tushunish
 *    - Shoshilinchlik: Hoziroq harakatga undash
 *    - Ijtimoiy Dalil: Boshqalar ham olgan va yoqtirgan
 *    - Qiymat: Yaxshi narxga olayotganini his qilish
 * 
 * 💼 SOTUVCHI UCHUN:
 *    - Professional ko'rinish
 *    - Barcha xususiyatlar namoyish
 *    - Ishonchli profil
 *    - Oson aloqa
 * 
 * 🎨 VISUAL HIERARCHY:
 *    1. HERO ZONE - Katta, go'zal rasmlar
 *    2. DECISION ZONE - Narx, variantlar, CTA
 *    3. TRUST ZONE - Sotuvchi, kafolatlar
 *    4. INFO ZONE - Tafsilotlar, xususiyatlar
 *    5. SOCIAL ZONE - Sharhlar, reytinglar
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
  ArrowRightIcon,
  CheckBadgeIcon,
  CubeIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid'
import { getListingReviews, type Review } from '../lib/reviews'

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN TOKENS - Consistent visual language
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  // Base
  background: '#FAFAF8',      // Warm white - feels premium
  surface: '#FFFFFF',         // Pure white cards
  surfaceHover: '#F5F5F3',    // Subtle hover
  
  // Text
  textPrimary: '#1A1A1A',     // Near black - confident
  textSecondary: '#666666',   // Soft gray
  textMuted: '#999999',       // Very subtle
  
  // Brand
  primary: '#000000',         // Bold black - action
  primaryHover: '#333333',    // Softer on hover
  
  // Semantic
  success: '#10B981',         // Trust green
  warning: '#F59E0B',         // Attention amber
  danger: '#EF4444',          // Urgency red
  discount: '#DC2626',        // Sale red
  
  // Accents
  gold: '#D4AF37',            // Premium gold
  blue: '#3B82F6',            // Link blue
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔢 SPACING SYSTEM - 8px base unit
// ═══════════════════════════════════════════════════════════════════════════
// 0: 0px, 1: 4px, 2: 8px, 3: 12px, 4: 16px, 5: 20px, 6: 24px, 8: 32px, 10: 40px

// ═══════════════════════════════════════════════════════════════════════════
// 📱 COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ProductMasterpiece() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
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
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  
  // Refs
  const heroRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  
  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────────
  
  // Photos - show color-specific if selected
  const photos = useMemo(() => {
    const byColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
    if (selectedColor && byColor?.[selectedColor]?.length) {
      return byColor[selectedColor]
    }
    return listing?.photos || []
  }, [listing, selectedColor])
  
  // Variants extraction
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
  
  // Discount calculation
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
  
  // Check if current user is the seller
  const isOwnListing = listing?.seller?.telegram_user_id === user?.telegram_user_id
  
  // Stock status
  const stockStatus = useMemo(() => {
    if (variants.total === 0) return { status: 'out', message: 'Tugagan', color: 'text-red-500' }
    if (variants.total <= 3) return { status: 'low', message: `Faqat ${variants.total} ta qoldi!`, color: 'text-orange-500' }
    if (variants.total <= 10) return { status: 'limited', message: `${variants.total} ta mavjud`, color: 'text-amber-600' }
    return { status: 'available', message: 'Mavjud', color: 'text-green-600' }
  }, [variants.total])
  
  // ─────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────
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
  
  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  
  const toggleFavorite = useCallback(async () => {
    if (!user || !listing) return
    setFavAnimating(true)
    setTimeout(() => setFavAnimating(false), 600)
    
    // Optimistic update
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
  
  const handleAddToCart = useCallback(async () => {
    if (!user || !listing || stockStatus.status === 'out') return
    setAddingToCart(true)
    try {
      await addToCart(user.telegram_user_id, listing.listing_id, quantity)
      setCartSuccess(true)
      // Haptic feedback simulation via animation
      setTimeout(() => setCartSuccess(false), 2500)
    } finally {
      setAddingToCart(false)
    }
  }, [user, listing, quantity, stockStatus])
  
  const messageSeller = useCallback(() => {
    if (!listing?.seller?.username) return
    const message = `Salom! "${listing.title}" haqida so'ramoqchiman.`
    openTelegramChat(listing.seller.username, message)
  }, [listing])
  
  const handleShare = useCallback(() => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title)
  }, [listing])
  
  // Image swipe handling
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
  
  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: COLORS.background }}>
        {/* Skeleton Header */}
        <div className="h-14 bg-white border-b border-gray-100" />
        
        {/* Skeleton Hero */}
        <div className="bg-white">
          <div className="aspect-[4/5] bg-gradient-to-b from-gray-100 to-gray-50 animate-pulse" />
        </div>
        
        {/* Skeleton Content */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
            <div className="h-6 bg-gray-100 rounded w-4/5 animate-pulse" />
            <div className="h-8 bg-gray-100 rounded w-2/5 animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl p-5 h-24 animate-pulse" />
        </div>
      </div>
    )
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // NOT FOUND STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: COLORS.background }}>
        <div className="text-center">
          <div className="text-8xl mb-6 grayscale opacity-30">📦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mahsulot topilmadi</h2>
          <p className="text-gray-500 mb-6">Bu mahsulot o'chirilgan yoki mavjud emas</p>
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Bosh sahifa
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-32" style={{ background: COLORS.background }}>
      
      {/* ═══════════════════════════════════════════════════════════════════
          📌 HEADER - Minimal, elegant, always accessible
          
          PSYCHOLOGY:
          - Back button = safety (can always escape)
          - Actions grouped = clean visual
          - Transparent feel = immersive
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all"
          >
            <ShareIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          🖼️ HERO ZONE - Visual Impact
          
          PSYCHOLOGY:
          - Large image = premium feel
          - Swipeable = engagement
          - Discount badge = attention grab
          - Photo count = set expectations
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="bg-white">
        <div 
          className="relative aspect-[4/5] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {photos.length > 0 ? (
            <>
              <img
                key={currentPhoto}
                src={photos[currentPhoto]}
                alt={listing.title}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-contain bg-gradient-to-b from-gray-50 to-white transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Loading shimmer */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer" />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <CubeIcon className="w-24 h-24 text-gray-200" />
            </div>
          )}
          
          {/* 🛒 In Carts Badge - Top Left */}
          {(listing.in_carts_count || 0) > 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
              <span className="uppercase tracking-wide">
                {formatLikeCount(listing.in_carts_count || 0)} ta savatda
              </span>
            </div>
          )}
          
          {/* 🏷️ Discount Badge - Below Cart Badge */}
          {discount && (
            <div className={`absolute ${(listing.in_carts_count || 0) > 0 ? 'top-16' : 'top-4'} left-4 flex items-center gap-2`}>
              <div className="bg-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                -{discount.percent}%
              </div>
              <div className="bg-white/90 backdrop-blur text-emerald-600 text-xs font-medium px-2 py-1 rounded-full shadow">
                {discount.savings?.toLocaleString()} so'm tejang!
              </div>
            </div>
          )}
          
          {/* ❤️ Like Counter Badge - Bottom Right */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite() }}
            className={`absolute bottom-20 right-4 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              favorited 
                ? 'bg-white text-gray-900' 
                : 'bg-white/90 text-gray-700 hover:bg-white'
            } ${favAnimating ? 'animate-heartbeat' : ''}`}
          >
            <span className="font-semibold text-lg">
              {formatLikeCount(favoritesCount)}
            </span>
            {favorited ? (
              <HeartSolid className="w-6 h-6 text-red-500" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
          </button>
          
          {/* Photo Navigation Dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentPhoto 
                      ? 'w-6 h-2 bg-black' 
                      : 'w-2 h-2 bg-black/30 hover:bg-black/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* 📸 Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPhoto(i); setImageLoaded(false) }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${
                  i === currentPhoto 
                    ? 'ring-2 ring-black ring-offset-2' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          💰 DECISION ZONE - Price & Core Info
          
          PSYCHOLOGY:
          - Price prominent = transparency builds trust
          - Original price strikethrough = perceived value
          - Scarcity message = urgency
          - Rating = social proof
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5">
          {/* Brand Tag */}
          {listing.attributes?.brand && (
            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              <TagIcon className="w-3 h-3" />
              {listing.attributes.brand}
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            {listing.title}
          </h1>
          
          {/* Rating & Reviews Row */}
          <div className="flex items-center gap-3 mb-4">
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
            
            {/* Views */}
            {(listing.views || 0) > 10 && (
              <span className="text-gray-400 text-sm">
                👁 {listing.views} ko'rildi
              </span>
            )}
          </div>
          
          {/* Price Section */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-black text-gray-900 tracking-tight">
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
          
          {/* Stock Status Alert */}
          {stockStatus.status !== 'available' && stockStatus.status !== 'out' && (
            <div className={`inline-flex items-center gap-2 ${stockStatus.color} text-sm font-semibold bg-orange-50 px-3 py-1.5 rounded-full`}>
              <SparklesIcon className="w-4 h-4" />
              {stockStatus.message}
            </div>
          )}
          {stockStatus.status === 'out' && (
            <div className="inline-flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 px-3 py-1.5 rounded-full">
              Hozircha tugagan
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          🎨 VARIANT SELECTION - Color & Size
          
          PSYCHOLOGY:
          - Visual color circles = intuitive
          - Size grid = easy scanning
          - Stock feedback = informed decision
          - Selected state = clear feedback
      ═══════════════════════════════════════════════════════════════════ */}
      {(variants.colors.length > 0 || variants.sizes.length > 0) && (
        <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
          
          {/* Color Selection */}
          {variants.colors.length > 0 && (
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Rang tanlang</h3>
                {selectedColor && (
                  <span className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded">
                    {selectedColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {variants.colors.map(color => {
                  const isSelected = selectedColor === color
                  const colorHex = getColorHex(color)
                  return (
                    <button
                      key={color}
                      onClick={() => { 
                        setSelectedColor(isSelected ? null : color)
                        setCurrentPhoto(0)
                        setImageLoaded(false)
                      }}
                      className={`group relative transition-all duration-200 ${
                        isSelected ? 'scale-110' : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      <div 
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          isSelected 
                            ? 'border-black ring-2 ring-black/20 ring-offset-2' 
                            : 'border-gray-200 group-hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: colorHex }}
                      />
                      {isSelected && (
                        <CheckIcon className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Size Selection */}
          {variants.sizes.length > 0 && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">O'lcham tanlang</h3>
                {selectedSize && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {selectedSize}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {variants.sizes.map(size => {
                  const isSelected = selectedSize === size
                  const stockKey = selectedColor ? `${size}/${selectedColor}` : size
                  const inStock = !selectedColor || (variants.stock[stockKey] || 0) > 0
                  const stockCount = variants.stock[stockKey] || 0
                  
                  return (
                    <button
                      key={size}
                      onClick={() => inStock && setSelectedSize(isSelected ? null : size)}
                      disabled={!inStock}
                      className={`relative h-12 rounded-xl font-semibold transition-all duration-200 ${
                        isSelected 
                          ? 'bg-black text-white scale-105' 
                          : inStock
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {!inStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-px bg-gray-300 rotate-45 absolute" />
                        </div>
                      )}
                      {size}
                      {inStock && stockCount > 0 && stockCount <= 3 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center">
                          {stockCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          🛡️ TRUST ZONE - Seller & Guarantees
          
          PSYCHOLOGY:
          - Seller face = human connection
          - Badges = authority signals
          - Stats = track record proof
          - Quick actions = convenience
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
        
        {/* Seller Card */}
        {listing.seller && (
          <Link to={`/profile/${listing.seller.telegram_user_id}`} className="block p-5 border-b border-gray-100 active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              {/* Avatar with Trust Badge */}
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
                {/* Trust Level Badge */}
                {sellerTrust?.level === 'top' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs">👑</span>
                  </div>
                )}
                {sellerTrust?.level === 'trusted' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckBadgeIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              {/* Seller Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{listing.seller.first_name}</p>
                  {sellerTrust?.level === 'top' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">TOP</span>
                  )}
                </div>
                {sellerTrust && sellerTrust.reviews > 0 ? (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <StarIcon className="w-3.5 h-3.5 text-amber-400" />
                      {sellerTrust.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{sellerTrust.sales} sotuv</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Yangi sotuvchi</p>
                )}
              </div>
              
              {/* Message Button */}
              {!isOwnListing && (
                <button 
                  onClick={(e) => { e.preventDefault(); messageSeller() }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
                >
                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                  Yozish
                </button>
              )}
            </div>
          </Link>
        )}
        
        {/* Trust Badges Row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="p-4 text-center">
            <TruckIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">
              {listing.attributes?.delivery_available ? 'Yetkaziladi' : 'Olib ketish'}
            </p>
          </div>
          <div className="p-4 text-center">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Xavfsiz to'lov</p>
          </div>
          <div className="p-4 text-center">
            <ClockIcon className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Tez javob</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          📋 INFO ZONE - Product Details
          
          PSYCHOLOGY:
          - Scannable format = easy digestion
          - Expandable = not overwhelming
          - Specs grid = professional feel
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Mahsulot haqida</h2>
          
          {/* Description */}
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {listing.description || 'Tavsif mavjud emas'}
          </p>
          
          {/* Specs Grid */}
          {(listing.attributes?.brand || listing.attributes?.material || listing.attributes?.country_of_origin || listing.condition) && (
            <div className={`mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-4 ${!showAllSpecs && 'max-h-32 overflow-hidden relative'}`}>
              {listing.attributes?.brand && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Brend</p>
                  <p className="text-sm font-medium text-gray-900">{listing.attributes.brand}</p>
                </div>
              )}
              {listing.attributes?.material && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Material</p>
                  <p className="text-sm font-medium text-gray-900">{listing.attributes.material}</p>
                </div>
              )}
              {listing.condition && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Holati</p>
                  <p className="text-sm font-medium text-gray-900">{getConditionLabel(listing.condition)}</p>
                </div>
              )}
              {listing.attributes?.country_of_origin && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ishlab chiqarilgan</p>
                  <p className="text-sm font-medium text-gray-900">{listing.attributes.country_of_origin}</p>
                </div>
              )}
              {!showAllSpecs && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
          )}
          
          {/* Show More Button */}
          {(listing.attributes?.brand || listing.attributes?.material) && (
            <button 
              onClick={() => setShowAllSpecs(!showAllSpecs)}
              className="mt-4 text-sm font-medium text-blue-600 flex items-center gap-1"
            >
              {showAllSpecs ? 'Yopish' : "Batafsil ko'rish"}
              <ArrowRightIcon className={`w-3 h-3 transition-transform ${showAllSpecs ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        
        {/* Location */}
        {listing.neighborhood && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Joylashuv</p>
              <p className="text-sm text-gray-500">{listing.neighborhood}</p>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ⭐ SOCIAL ZONE - Reviews & Ratings
          
          PSYCHOLOGY:
          - Star distribution = at-a-glance quality
          - Recent reviews = freshness
          - Photo reviews = authenticity
          - Verified badge = trust
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-4 mt-3 bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900">Sharhlar</h2>
            {reviewStats.count > 0 && (
              <span className="text-sm text-gray-500">{reviewStats.count} ta</span>
            )}
          </div>
          
          {reviewStats.count > 0 ? (
            <>
              {/* Rating Overview */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
                {/* Big Average */}
                <div className="text-center">
                  <div className="text-5xl font-black text-gray-900">{reviewStats.average.toFixed(1)}</div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <StarIcon 
                        key={i} 
                        className={`w-4 h-4 ${i <= reviewStats.average ? 'text-amber-400' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                {/* Distribution Bars */}
                <div className="flex-1 space-y-1">
                  {[5,4,3,2,1].map(star => {
                    const count = reviewStats.distribution[star - 1]
                    const percent = reviewStats.count ? (count / reviewStats.count) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-3">{star}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Recent Reviews */}
              <div className="space-y-4">
                {reviews.slice(0, 3).map(review => (
                  <div key={review.review_id} className="pb-4 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                          {review.reviewer?.first_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {review.reviewer?.first_name || 'Foydalanuvchi'}
                          </p>
                          <div className="flex items-center">
                            {[1,2,3,4,5].map(i => (
                              <StarIcon 
                                key={i} 
                                className={`w-3 h-3 ${i <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.verified_purchase && (
                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          ✓ Sotib olgan
                        </span>
                      )}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-600 line-clamp-3">{review.review_text}</p>
                    )}
                    {/* Review photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.photos.slice(0, 3).map((photo, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden">
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* View All Button */}
              {reviews.length > 3 && (
                <button className="w-full mt-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  Barcha {reviews.length} ta sharhni ko'rish
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <StarOutline className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400">Hali sharhlar yo'q</p>
              <p className="text-sm text-gray-300 mt-1">Birinchi sharh qoldiring!</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Spacer for Fixed CTA */}
      <div className="h-8" />

      {/* ═══════════════════════════════════════════════════════════════════
          🛒 FLOATING ACTION BAR - The Close
          
          PSYCHOLOGY:
          - Always visible = no friction
          - Quantity selector = control feeling
          - Big CTA button = clear next step
          - Price reminder = value reinforcement
          - Success state = positive feedback
      ═══════════════════════════════════════════════════════════════════ */}
      {!isOwnListing && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Gradient fade */}
          <div className="h-6 bg-gradient-to-t from-white to-transparent" />
          
          {/* Action Bar */}
          <div className="bg-white border-t border-gray-100 px-4 pb-6 pt-3">
            <div className="max-w-lg mx-auto">
              {/* Price reminder row */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    {listing.price?.toLocaleString()}
                  </span>
                  <span className="text-gray-500 ml-1">so'm</span>
                  {discount && (
                    <span className="ml-2 text-sm text-gray-400 line-through">
                      {discount.original?.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Quantity Selector */}
                <div className="flex items-center bg-gray-100 rounded-full">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:text-gray-300 active:scale-95 transition-transform"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(variants.total || 99, q + 1))}
                    disabled={quantity >= (variants.total || 99)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:text-gray-300 active:scale-95 transition-transform"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Main CTA Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || stockStatus.status === 'out'}
                className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  cartSuccess 
                    ? 'bg-green-500 text-white' 
                    : stockStatus.status === 'out'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {addingToCart ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : cartSuccess ? (
                  <>
                    <CheckIcon className="w-6 h-6" />
                    Savatga qo'shildi!
                  </>
                ) : stockStatus.status === 'out' ? (
                  'Hozircha tugagan'
                ) : (
                  "Savatga qo'shish"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1); }
          75% { transform: scale(1.2); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    'qora': '#1A1A1A',
    'oq': '#FFFFFF',
    'qizil': '#DC2626',
    'ko\'k': '#2563EB',
    'kok': '#2563EB',
    'yashil': '#16A34A',
    'sariq': '#EAB308',
    'pushti': '#EC4899',
    'kulrang': '#6B7280',
    'jigarrang': '#92400E',
    'ko\'k rang': '#1E40AF',
    'och ko\'k': '#60A5FA',
    'to\'q ko\'k': '#1E3A8A',
    'binafsha': '#7C3AED',
    'oltin': '#D97706',
    'kumush': '#9CA3AF',
    'moviy': '#0EA5E9',
    'qoramtir': '#374151',
    'shaftoli': '#FB923C',
    'bej': '#D4B896',
  }
  return colors[colorName.toLowerCase()] || '#9CA3AF'
}

function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    'new_with_tags': 'Yangi (teglar bilan)',
    'new_without_tags': 'Yangi (teglarsiz)',
    'like_new': 'Yangiday',
    'good': 'Yaxshi',
    'fair': "O'rtacha",
  }
  return labels[condition] || condition
}

function formatLikeCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return count.toString()
}

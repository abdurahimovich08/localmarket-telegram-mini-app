/**
 * 🎨 MASTERPIECE V2 - Immersive Product Experience
 * 
 * Design Philosophy:
 * - Cinematic storytelling for products
 * - Every pixel has purpose
 * - Micro-interactions create magic
 * - Emotions drive purchases
 * 
 * Inspired by: Apple, Nike SNKRS, Gucci, Zara, Supreme
 */

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite } from '../lib/supabase'
import { openTelegramChat, shareListing } from '../lib/telegram'
import { trackListingView, trackUserInteraction } from '../lib/tracking'
import { trackListingInteraction } from '../lib/unifiedListingFeedback'
import type { Listing } from '../types'
import { CONDITIONS } from '../types'
import { 
  HeartIcon, 
  ShareIcon, 
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  TruckIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid, PlayIcon } from '@heroicons/react/24/solid'
import AddToCartButton from '../components/AddToCartButton'
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

// Haptic feedback simulation
const haptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (navigator.vibrate) {
    const patterns = { light: 10, medium: 20, heavy: 40 }
    navigator.vibrate(patterns[type])
  }
}

// Format price with animation-ready structure
const formatPrice = (price: number) => {
  return price.toLocaleString('uz-UZ').split('').map((char, i) => (
    <span key={i} className="inline-block animate-countUp" style={{ animationDelay: `${i * 30}ms` }}>
      {char}
    </span>
  ))
}

export default function ListingDetailMasterpiece() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  
  // Core state
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  
  // UI state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [canUserReview, setCanUserReview] = useState(false)
  const [hasVerifiedPurchase, setHasVerifiedPurchase] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  
  // Refs
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Photos by color
  const displayPhotos = useMemo(() => {
    const photosByColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
    if (selectedColor && photosByColor && photosByColor[selectedColor]?.length > 0) {
      return photosByColor[selectedColor]
    }
    return listing?.photos || []
  }, [listing, selectedColor])

  // Scroll tracking with throttle
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load listing
  useEffect(() => {
    const loadListing = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getListing(id)
        if (data) {
          setListing(data)
          await incrementViewCount(id)
          if (user?.telegram_user_id) {
            trackListingView(user.telegram_user_id, id, data.subcategory_id)
          }
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

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!id || !listing) return
      try {
        const reviewsData = await getListingReviews(id)
        setReviews(reviewsData)
        if (user?.telegram_user_id) {
          const { canWrite, claim } = await canWriteReview(id, user.telegram_user_id)
          setCanUserReview(canWrite)
          setHasVerifiedPurchase(!!claim)
        }
      } catch (error) {
        console.error('Error loading reviews:', error)
      }
    }
    if (!loading && listing) loadReviews()
  }, [id, user, loading, listing])

  // Extract variants
  const { availableColors, availableSizes, stockByVariant, totalStock } = useMemo(() => {
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
      if (listing?.attributes?.sizes) listing.attributes.sizes.forEach((s: string) => sizes.add(s))
      if (listing?.attributes?.colors) listing.attributes.colors.forEach((c: string) => colors.add(c))
    }
    
    return { 
      availableColors: Array.from(colors), 
      availableSizes: Array.from(sizes), 
      stockByVariant: stock, 
      totalStock: total || listing?.stock_qty || 0 
    }
  }, [listing])

  // Discount calculation
  const discount = useMemo(() => {
    if (listing?.attributes?.discount_available && listing?.attributes?.discount_percent) {
      return {
        percent: listing.attributes.discount_percent,
        originalPrice: listing.attributes.discount_original_price,
        savings: listing.attributes.discount_original_price && listing.price 
          ? listing.attributes.discount_original_price - listing.price : 0
      }
    }
    return null
  }, [listing])

  // Review stats
  const reviewStats = useMemo(() => {
    const total = reviews.length
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0
    return { total, avgRating }
  }, [reviews])

  // Seller trust level
  const sellerTrust = useMemo(() => {
    if (!listing?.seller) return null
    const rating = listing.seller.rating_average || 0
    const reviewCount = listing.seller.total_reviews || 0
    const sales = listing.seller.total_sales || 0
    
    let level: 'new' | 'active' | 'trusted' | 'top' = 'new'
    if (sales >= 50 && rating >= 4.5) level = 'top'
    else if (sales >= 15 && rating >= 4.0) level = 'trusted'
    else if (sales >= 3) level = 'active'
    
    return { rating, reviews: reviewCount, sales, level }
  }, [listing])

  // Handlers
  const handleToggleFavorite = async () => {
    if (!user || !listing) return
    haptic('medium')
    
    if (user.telegram_user_id) {
      trackListingInteraction(listing.listing_id, 'product', user.telegram_user_id, 'click', [], undefined)
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
      console.error('Error:', error)
    }
  }

  const handleMessageSeller = () => {
    if (!listing?.seller?.username) return
    haptic('light')
    openTelegramChat(listing.seller.username, `Salom! "${listing.title}" hali mavjudmi?`)
  }

  const handleShare = () => {
    if (!listing) return
    haptic('light')
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }

  const handlePhotoChange = (index: number) => {
    haptic('light')
    setCurrentPhotoIndex(index)
  }

  const handleColorSelect = (color: string) => {
    haptic('light')
    setSelectedColor(selectedColor === color ? null : color)
    setCurrentPhotoIndex(0)
  }

  const handleSizeSelect = (size: string) => {
    haptic('light')
    setSelectedSize(selectedSize === size ? null : size)
  }

  const handleAddToCart = () => {
    haptic('heavy')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleSubmitReview = async (reviewData: {
    rating: number
    text: string
    photos: string[]
  }) => {
    if (!id || !user?.telegram_user_id) return
    const newReview = await createReview(
      id, user.telegram_user_id, reviewData.rating, reviewData.text, reviewData.photos,
      selectedSize || undefined, selectedColor || undefined
    )
    if (newReview) {
      setReviews(prev => [newReview, ...prev])
      setCanUserReview(false)
    }
  }

  // Calculate dynamic values
  const heroOpacity = Math.max(0, 1 - scrollY / 400)
  const headerBg = scrollY > 100 ? 'bg-black/80 backdrop-blur-xl' : 'bg-transparent'
  const condition = CONDITIONS.find(c => c.value === listing?.condition)
  const isOwnListing = listing?.seller?.telegram_user_id === user?.telegram_user_id

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE - Skeleton with shimmer
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Skeleton Hero */}
        <div className="relative h-[100vh]">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
            <div className="absolute inset-0 shimmer" />
          </div>
          
          {/* Skeleton Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
            <div className="h-8 w-3/4 bg-white/10 rounded-lg shimmer" />
            <div className="h-6 w-1/2 bg-white/10 rounded-lg shimmer" />
            <div className="h-12 w-1/3 bg-white/10 rounded-lg shimmer" />
          </div>
        </div>
        
        <style>{`
          .shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // NOT FOUND STATE
  // ═══════════════════════════════════════════════════════════
  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="text-6xl">🔍</span>
            </div>
          </div>
          <h2 className="text-3xl font-thin text-white mb-4 tracking-wide">Topilmadi</h2>
          <p className="text-white/40 mb-8">Bu mahsulot mavjud emas yoki o'chirilgan</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all"
          >
            Bosh sahifaga
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════════════════════
          IMMERSIVE HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section 
        ref={heroRef}
        className="relative h-[100vh] overflow-hidden"
        style={{ opacity: heroOpacity }}
      >
        {/* Dynamic Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black z-10" />
        
        {/* Photo with Parallax & Ken Burns Effect */}
        {displayPhotos.length > 0 && (
          <div 
            className="absolute inset-0 transition-transform duration-700 ease-out"
            style={{ 
              transform: `scale(${1.1 + scrollY * 0.0003}) translateY(${scrollY * 0.3}px)`,
            }}
          >
            <img
              src={displayPhotos[currentPhotoIndex]}
              alt={listing.title}
              className={`w-full h-full object-cover transition-all duration-1000 ${
                isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              onLoad={() => setIsImageLoaded(true)}
            />
            {/* Cinematic Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)] opacity-60" />
          </div>
        )}

        {/* Floating Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerBg}`}>
          <div className="flex items-center justify-between p-4 safe-area-top">
            <button
              onClick={() => { haptic('light'); navigate(-1) }}
              className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/50 transition-all active:scale-95"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/50 transition-all active:scale-95"
              >
                <ShareIcon className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-95 ${
                  favorited 
                    ? 'bg-rose-500/30 border-rose-500/50' 
                    : 'bg-black/30 border-white/10 hover:bg-black/50'
                }`}
              >
                {favorited ? (
                  <HeartIconSolid className="w-5 h-5 text-rose-400 animate-heartBeat" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Discount Badge - Floating with Glow */}
        {discount && (
          <div className="absolute top-28 left-6 z-20 animate-floatIn">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-orange-500 blur-xl opacity-70 animate-pulse" />
              <div className="relative px-5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full">
                <span className="text-white font-bold text-lg">-{discount.percent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alert Badge */}
        {totalStock > 0 && totalStock <= 5 && (
          <div className="absolute top-28 right-6 z-20 animate-floatIn" style={{ animationDelay: '0.2s' }}>
            <div className="px-4 py-2 bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 rounded-full">
              <span className="text-amber-400 font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                Faqat {totalStock} dona!
              </span>
            </div>
          </div>
        )}

        {/* Photo Navigation Dots */}
        {displayPhotos.length > 1 && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {displayPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => handlePhotoChange(i)}
                className={`transition-all duration-500 rounded-full ${
                  i === currentPhotoIndex 
                    ? 'w-8 h-2 bg-white' 
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Swipe Arrows */}
        {displayPhotos.length > 1 && (
          <>
            <button
              onClick={() => handlePhotoChange(Math.max(0, currentPhotoIndex - 1))}
              disabled={currentPhotoIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center border border-white/10 disabled:opacity-30 hover:bg-black/50 transition-all"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => handlePhotoChange(Math.min(displayPhotos.length - 1, currentPhotoIndex + 1))}
              disabled={currentPhotoIndex === displayPhotos.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center border border-white/10 disabled:opacity-30 hover:bg-black/50 transition-all"
            >
              <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Hero Bottom Content - Title & Price */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-32">
          {/* Category Badge */}
          {listing.attributes?.taxonomy?.labelUz && (
            <div className="inline-block mb-4 animate-slideUp">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-white/80 text-sm border border-white/10">
                {listing.attributes.taxonomy.labelUz}
              </span>
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight animate-slideUp" style={{ animationDelay: '0.1s' }}>
            {listing.title}
          </h1>
          
          {/* Price */}
          <div className="flex items-end gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <div className="text-4xl font-bold text-white">
              {listing.price?.toLocaleString()}
              <span className="text-lg font-normal text-white/60 ml-2">so'm</span>
            </div>
            {discount && (
              <div className="text-xl text-white/40 line-through mb-1">
                {discount.originalPrice?.toLocaleString()} so'm
              </div>
            )}
          </div>
          
          {/* Rating Preview */}
          {reviewStats.total > 0 && (
            <div className="flex items-center gap-2 mt-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIconSolid 
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(reviewStats.avgRating) ? 'text-amber-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
              <span className="text-white/60 text-sm">{reviewStats.avgRating.toFixed(1)} ({reviewStats.total})</span>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <ChevronDownIcon className="w-8 h-8 text-white/50" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTENT SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section ref={contentRef} className="relative bg-black">
        {/* Curved Top Edge */}
        <div className="absolute -top-10 left-0 right-0 h-12 bg-black rounded-t-[3rem]" />
        
        <div className="relative px-6 pt-8 pb-48 space-y-8">
          
          {/* ═══ VARIANT SELECTION ═══ */}
          {(availableColors.length > 0 || availableSizes.length > 0) && (
            <div className="space-y-6 animate-fadeInUp">
              {/* Colors */}
              {availableColors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/50 text-sm tracking-widest uppercase">Rang</h3>
                    {selectedColor && (
                      <span className="text-white font-medium animate-fadeIn">{selectedColor}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map(color => {
                      const hasStock = selectedSize 
                        ? (stockByVariant[`${selectedSize}/${color}`] || 0) > 0 
                        : true
                      const isSelected = selectedColor === color
                      const hasPhotos = listing?.attributes?.photos_by_color?.[color]?.length > 0
                      
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          disabled={!hasStock}
                          className={`group relative px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                            isSelected
                              ? 'bg-white text-black scale-105'
                              : hasStock
                                ? 'bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-600'
                                : 'bg-zinc-900/50 text-zinc-600 border border-zinc-900'
                          }`}
                        >
                          <span className="capitalize">{color}</span>
                          {hasPhotos && !isSelected && (
                            <span className="ml-2 text-violet-400">📷</span>
                          )}
                          {isSelected && (
                            <CheckIcon className="inline-block w-4 h-4 ml-2" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/50 text-sm tracking-widest uppercase">O'lcham</h3>
                    {selectedSize && (
                      <span className="text-white font-medium animate-fadeIn">{selectedSize}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map(size => {
                      const hasStock = selectedColor 
                        ? (stockByVariant[`${size}/${selectedColor}`] || 0) > 0 
                        : true
                      const isSelected = selectedSize === size
                      
                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          disabled={!hasStock}
                          className={`relative min-w-[60px] h-14 px-4 rounded-2xl font-medium transition-all duration-300 ${
                            isSelected
                              ? 'bg-white text-black scale-105'
                              : hasStock
                                ? 'bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-600'
                                : 'bg-zinc-900/50 text-zinc-600 border border-zinc-900 line-through'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ DESCRIPTION CARD ═══ */}
          <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-white/50 text-sm tracking-widest uppercase mb-4">Tavsif</h3>
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
            
            {/* Specs Grid */}
            {(listing.attributes?.brand || listing.attributes?.material) && (
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-800">
                {listing.attributes?.brand && (
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Brend</p>
                    <p className="text-white font-medium">{listing.attributes.brand}</p>
                  </div>
                )}
                {listing.attributes?.material && (
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Material</p>
                    <p className="text-white font-medium">{listing.attributes.material}</p>
                  </div>
                )}
                {condition && (
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Holati</p>
                    <p className="text-white font-medium">{condition.label}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ DELIVERY CARD ═══ */}
          <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {listing.attributes?.delivery_available ? (
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <TruckIcon className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">Yetkazib beramiz</h3>
                  {listing.attributes.delivery_days && (
                    <p className="text-white/50 mt-1">{listing.attributes.delivery_days} kun ichida</p>
                  )}
                  <p className="text-emerald-400 text-sm mt-2">✓ Bepul yetkazib berish</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <MapPinIcon className="w-7 h-7 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">O'zi olib ketish</h3>
                  {listing.neighborhood && (
                    <p className="text-white/50 mt-1">📍 {listing.neighborhood}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ SELLER CARD ═══ */}
          {listing.seller && (
            <Link
              to={`/profile/${listing.seller.telegram_user_id}`}
              className="block bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all animate-fadeInUp"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar with Trust Badge */}
                <div className="relative">
                  {listing.seller.profile_photo_url ? (
                    <img
                      src={listing.seller.profile_photo_url}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {listing.seller.first_name?.[0]}
                      </span>
                    </div>
                  )}
                  {sellerTrust?.level === 'top' && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
                      <span className="text-sm">👑</span>
                    </div>
                  )}
                  {sellerTrust?.level === 'trusted' && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                      <ShieldCheckIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-lg truncate">
                    {listing.seller.first_name} {listing.seller.last_name}
                  </p>
                  
                  {sellerTrust && sellerTrust.reviews > 0 ? (
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <StarIconSolid className="w-4 h-4 text-amber-400" />
                        <span className="text-white text-sm">{sellerTrust.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400 text-sm">{sellerTrust.reviews} sharx</span>
                      {sellerTrust.sales > 0 && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400 text-sm">{sellerTrust.sales} sotuv</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1 text-amber-500/80">
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-sm">Yangi sotuvchi</span>
                    </div>
                  )}
                </div>
                
                <ChevronRightIcon className="w-5 h-5 text-zinc-600" />
              </div>
              
              {/* New Seller Warning */}
              {sellerTrust?.level === 'new' && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-400/80 text-sm">
                    ⚠️ Yangi sotuvchi. Yuzma-yuz uchrashishni tavsiya etamiz.
                  </p>
                </div>
              )}
            </Link>
          )}

          {/* ═══ PURCHASE CLAIM ═══ */}
          {!isOwnListing && user && (
            <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <PurchaseClaimButton
                listingId={listing.listing_id}
                buyerTelegramId={user.telegram_user_id}
                selectedSize={selectedSize || undefined}
                selectedColor={selectedColor || undefined}
                onClaimApproved={() => setHasVerifiedPurchase(true)}
                onWriteReview={() => setShowReviewModal(true)}
              />
            </div>
          )}

          {/* ═══ REVIEWS SECTION ═══ */}
          <div className="animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <ReviewsSection
              reviews={reviews}
              averageRating={reviewStats.avgRating}
              totalReviews={reviewStats.total}
              canWriteReview={canUserReview}
              hasVerifiedPurchase={hasVerifiedPurchase}
              onWriteReview={() => setShowReviewModal(true)}
              onHelpful={(reviewId, isHelpful) => voteReviewHelpful(reviewId, user?.telegram_user_id || 0, isHelpful)}
              currentUserTelegramId={user?.telegram_user_id}
            />
          </div>

          {/* ═══ SIMILAR PRODUCTS ═══ */}
          <div className="animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <SimilarListings listing={listing} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FLOATING ACTION BAR
      ═══════════════════════════════════════════════════════════ */}
      {!isOwnListing && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-3xl p-3 border border-zinc-800 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3">
                {/* Favorite Button */}
                <button
                  onClick={handleToggleFavorite}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                    favorited 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}
                >
                  {favorited ? (
                    <HeartIconSolid className="w-6 h-6" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                </button>
                
                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    addedToCart
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Qo'shildi!
                    </>
                  ) : (
                    <>
                      <ShoppingBagIcon className="w-5 h-5" />
                      Savatga
                    </>
                  )}
                </button>
                
                {/* Message Seller - Primary CTA */}
                <button
                  onClick={handleMessageSeller}
                  className="h-14 px-6 rounded-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-500/30"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  Yozish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════ */}
      
      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        listingTitle={listing.title}
        listingPhoto={listing.photos?.[0]}
        purchasedSize={selectedSize || undefined}
        purchasedColor={selectedColor || undefined}
      />

      {/* ═══════════════════════════════════════════════════════════
          CUSTOM STYLES & ANIMATIONS
      ═══════════════════════════════════════════════════════════ */}
      <style>{`
        /* Animations */
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @keyframes floatIn {
          from { transform: translateY(-10px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-floatIn {
          animation: floatIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }
        .animate-heartBeat {
          animation: heartBeat 0.6s ease-out;
        }
        
        @keyframes countUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-countUp {
          animation: countUp 0.4s ease-out forwards;
          opacity: 0;
        }
        
        /* Safe area for notched devices */
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Remove tap highlight on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  )
}

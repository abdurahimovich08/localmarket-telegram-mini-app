/**
 * 🛍️ Clean Product Detail Page
 * 
 * Inspired by: Dribbble clean e-commerce design
 * - Light, minimal, professional
 * - Logical module placement
 * - User-friendly interactions
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite, addToCart } from '../lib/supabase'
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
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
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

// Color presets with actual colors
const COLOR_MAP: Record<string, string> = {
  'qora': '#000000',
  'oq': '#FFFFFF',
  'qizil': '#EF4444',
  'ko\'k': '#3B82F6',
  'yashil': '#22C55E',
  'sariq': '#EAB308',
  'pushti': '#EC4899',
  'kulrang': '#6B7280',
  'jigarrang': '#92400E',
  'binafsha': '#8B5CF6',
  'to\'q ko\'k': '#1E3A8A',
  'och ko\'k': '#93C5FD',
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#EF4444',
  'blue': '#3B82F6',
  'green': '#22C55E',
  'yellow': '#EAB308',
  'pink': '#EC4899',
  'gray': '#6B7280',
  'brown': '#92400E',
  'purple': '#8B5CF6',
  'beige': '#D4A574',
  'navy': '#1E3A8A',
}

export default function ListingDetailClean() {
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
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [canUserReview, setCanUserReview] = useState(false)
  const [hasVerifiedPurchase, setHasVerifiedPurchase] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  
  // Photos by color
  const displayPhotos = useMemo(() => {
    const photosByColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
    if (selectedColor && photosByColor && photosByColor[selectedColor]?.length > 0) {
      return photosByColor[selectedColor]
    }
    return listing?.photos || []
  }, [listing, selectedColor])

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

  // Seller info
  const sellerTrust = useMemo(() => {
    if (!listing?.seller) return null
    const rating = listing.seller.rating_average || 0
    const reviewCount = listing.seller.total_reviews || 0
    const sales = listing.seller.total_sales || 0
    return { rating, reviews: reviewCount, sales }
  }, [listing])

  // Handlers
  const handleToggleFavorite = async () => {
    if (!user || !listing) return
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

  const handleAddToCart = async () => {
    if (!user || !listing) return
    setAddingToCart(true)
    try {
      await addToCart(user.telegram_user_id, listing.listing_id, quantity)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleMessageSeller = () => {
    if (!listing?.seller?.username) return
    openTelegramChat(listing.seller.username, `Salom! "${listing.title}" hali mavjudmi?`)
  }

  const handleShare = () => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }

  const handleSubmitReview = async (reviewData: { rating: number; text: string; photos: string[] }) => {
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

  const condition = CONDITIONS.find(c => c.value === listing?.condition)
  const isOwnListing = listing?.seller?.telegram_user_id === user?.telegram_user_id

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-80" />
          <div className="p-4 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // NOT FOUND STATE
  // ═══════════════════════════════════════════════════════════
  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Topilmadi</h2>
          <p className="text-gray-500 mb-6">Bu mahsulot mavjud emas</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2 bg-rose-500 text-white rounded-full font-medium"
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
    <div className="min-h-screen bg-gray-50 pb-32">
      
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ShareIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                favorited ? 'bg-rose-100' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {favorited ? (
                <HeartIconSolid className="w-5 h-5 text-rose-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ PRODUCT IMAGE ═══ */}
      <div className="bg-white">
        <div className="relative aspect-square">
          {displayPhotos.length > 0 ? (
            <img
              src={displayPhotos[currentPhotoIndex]}
              alt={listing.title}
              className="w-full h-full object-contain p-8"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-6xl">📷</span>
            </div>
          )}
          
          {/* Navigation Arrows */}
          {displayPhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex(i => Math.max(0, i - 1))}
                disabled={currentPhotoIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center disabled:opacity-30"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPhotoIndex(i => Math.min(displayPhotos.length - 1, i + 1))}
                disabled={currentPhotoIndex === displayPhotos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center disabled:opacity-30"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        
        {/* Photo Dots */}
        {displayPhotos.length > 1 && (
          <div className="flex justify-center gap-2 pb-4">
            {displayPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhotoIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentPhotoIndex ? 'bg-gray-800 w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ PRODUCT INFO CARD ═══ */}
      <div className="bg-white mt-2 rounded-t-3xl -mt-4 relative z-10 px-5 pt-6 pb-4">
        
        {/* Brand */}
        {listing.attributes?.brand && (
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">
            {listing.attributes.brand}
          </p>
        )}
        
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {listing.title}
        </h1>
        
        {/* Rating & Reviews */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <StarIconSolid className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-gray-900">
              {reviewStats.avgRating > 0 ? reviewStats.avgRating.toFixed(1) : '—'}
            </span>
            <span className="text-gray-400 text-sm">
              • {reviewStats.total > 0 ? `${reviewStats.total} sharx` : 'Sharx yo\'q'}
            </span>
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-gray-900">
            {listing.price?.toLocaleString()} so'm
          </span>
          {discount && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {discount.originalPrice?.toLocaleString()} so'm
              </span>
              <span className="px-2 py-1 bg-rose-100 text-rose-600 text-sm font-semibold rounded-lg">
                -{discount.percent}%
              </span>
            </>
          )}
        </div>
        
        {/* ═══ COLOR SELECTION ═══ */}
        {availableColors.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">Rang:</span>
              {selectedColor && (
                <span className="text-gray-500 capitalize">{selectedColor}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {availableColors.slice(0, 4).map(color => {
                const colorHex = COLOR_MAP[color.toLowerCase()] || '#888888'
                const isSelected = selectedColor === color
                const hasPhotos = listing?.attributes?.photos_by_color?.[color]?.length > 0
                
                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(isSelected ? null : color)
                      setCurrentPhotoIndex(0)
                    }}
                    className={`relative w-10 h-10 rounded-full transition-all ${
                      isSelected 
                        ? 'ring-2 ring-offset-2 ring-rose-500' 
                        : 'ring-1 ring-gray-200 hover:ring-gray-300'
                    }`}
                    style={{ backgroundColor: colorHex }}
                  >
                    {isSelected && colorHex !== '#FFFFFF' && (
                      <CheckIcon className="absolute inset-0 m-auto w-5 h-5 text-white" />
                    )}
                    {isSelected && colorHex === '#FFFFFF' && (
                      <CheckIcon className="absolute inset-0 m-auto w-5 h-5 text-gray-800" />
                    )}
                    {hasPhotos && !isSelected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full" />
                    )}
                  </button>
                )
              })}
              {availableColors.length > 4 && (
                <span className="text-gray-400 text-sm ml-1">+{availableColors.length - 4}</span>
              )}
            </div>
          </div>
        )}
        
        {/* ═══ SIZE SELECTION ═══ */}
        {availableSizes.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">O'lcham:</span>
              {selectedSize && (
                <span className="text-gray-500">{selectedSize}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {availableSizes.slice(0, 4).map(size => {
                const hasStock = selectedColor 
                  ? (stockByVariant[`${size}/${selectedColor}`] || 0) > 0 
                  : true
                const isSelected = selectedSize === size
                
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(isSelected ? null : size)}
                    disabled={!hasStock}
                    className={`min-w-[44px] h-11 px-3 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : hasStock
                          ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                          : 'bg-gray-100 text-gray-300 line-through'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
              {availableSizes.length > 4 && (
                <span className="text-gray-400 text-sm ml-1">+{availableSizes.length - 4}</span>
              )}
            </div>
          </div>
        )}
        
        {/* ═══ TABS ═══ */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Tavsif
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sharxlar ({reviewStats.total})
            </button>
          </div>
        </div>
        
        {/* ═══ TAB CONTENT ═══ */}
        {activeTab === 'description' ? (
          <div>
            <p className={`text-gray-600 leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
              {listing.description}
            </p>
            {listing.description && listing.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-rose-500 text-sm font-medium mt-2 flex items-center gap-1"
              >
                {showFullDescription ? 'Yopish' : 'Ko\'proq o\'qish'}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
              </button>
            )}
            
            {/* Specs */}
            {(listing.attributes?.material || condition) && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                {listing.attributes?.material && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Material</p>
                    <p className="text-gray-700 font-medium">{listing.attributes.material}</p>
                  </div>
                )}
                {condition && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Holati</p>
                    <p className="text-gray-700 font-medium">{condition.label}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Delivery */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {listing.attributes?.delivery_available ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TruckIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Yetkazib beramiz</p>
                    <p className="text-gray-500 text-sm">
                      {listing.attributes.delivery_days ? `${listing.attributes.delivery_days} kun ichida` : 'Bepul'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">O'zi olib ketish</p>
                    {listing.neighborhood && (
                      <p className="text-gray-500 text-sm">{listing.neighborhood}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Seller */}
            {listing.seller && (
              <Link
                to={`/profile/${listing.seller.telegram_user_id}`}
                className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                  {listing.seller.profile_photo_url ? (
                    <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{listing.seller.first_name?.[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{listing.seller.first_name}</p>
                  {sellerTrust && sellerTrust.reviews > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <StarIconSolid className="w-3 h-3 text-amber-400" />
                      <span>{sellerTrust.rating.toFixed(1)}</span>
                      <span>• {sellerTrust.sales} sotuv</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleMessageSeller() }}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Yozish
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div>
            {/* Purchase Claim Button */}
            {!isOwnListing && user && (
              <div className="mb-4">
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
        )}
      </div>

      {/* ═══ SIMILAR PRODUCTS ═══ */}
      <div className="bg-white mt-2 px-5 py-6">
        <SimilarListings listing={listing} />
      </div>

      {/* ═══ BOTTOM ACTION BAR ═══ */}
      {!isOwnListing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            {/* Quantity Selector */}
            <div className="flex items-center bg-gray-100 rounded-full">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(totalStock || 99, q + 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${
                addedToCart
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98]'
              }`}
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : addedToCart ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Qo'shildi!
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-5 h-5" />
                  Savatga qo'shish
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
}

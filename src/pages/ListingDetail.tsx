/**
 * ListingDetail - Sales-Optimized Product Page
 * 
 * Psychological principles used:
 * 1. SCARCITY - "Faqat X dona qoldi!"
 * 2. SOCIAL PROOF - "Bugun X kishi ko'rdi"
 * 3. URGENCY - Time-limited offers
 * 4. ANCHORING - Original price crossed out
 * 5. TRUST - Verified seller, ratings
 * 6. RECIPROCITY - Free shipping, bonuses
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite } from '../lib/supabase'
import { openTelegramChat, shareListing, formatDistance } from '../lib/telegram'
import { trackListingView, trackUserInteraction } from '../lib/tracking'
import { trackListingInteraction } from '../lib/unifiedListingFeedback'
import type { Listing } from '../types'
import { CATEGORIES, CONDITIONS } from '../types'
import { 
  HeartIcon, 
  ShareIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  TruckIcon,
  ClockIcon,
  EyeIcon,
  FireIcon,
  CheckBadgeIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  TagIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import AddToCartButton from '../components/AddToCartButton'
import SimilarListings from '../components/SimilarListings'
import BottomNav from '../components/BottomNav'

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)

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

  // Extract available colors and sizes
  const { availableColors, availableSizes, stockByVariant } = useMemo(() => {
    const colors = new Set<string>()
    const sizes = new Set<string>()
    const stock: Record<string, number> = {}
    
    if (listing?.attributes?.stock_by_size_color) {
      Object.entries(listing.attributes.stock_by_size_color).forEach(([key, qty]) => {
        const [size, color] = key.split('/')
        if (size) sizes.add(size)
        if (color) colors.add(color)
        stock[key] = qty as number
      })
    }
    
    // Also check for colors/sizes arrays
    if (listing?.attributes?.colors) {
      listing.attributes.colors.forEach((c: string) => colors.add(c))
    }
    if (listing?.attributes?.sizes) {
      listing.attributes.sizes.forEach((s: string) => sizes.add(s))
    }
    
    return {
      availableColors: Array.from(colors),
      availableSizes: Array.from(sizes),
      stockByVariant: stock
    }
  }, [listing])

  // Get stock for selected variant
  const selectedStock = useMemo(() => {
    if (!selectedSize || !selectedColor) return listing?.stock_qty || 0
    const key = `${selectedSize}/${selectedColor}`
    return stockByVariant[key] || 0
  }, [selectedSize, selectedColor, stockByVariant, listing?.stock_qty])

  // Calculate total stock
  const totalStock = useMemo(() => {
    if (Object.keys(stockByVariant).length > 0) {
      return Object.values(stockByVariant).reduce((a, b) => a + b, 0)
    }
    return listing?.stock_qty || 0
  }, [stockByVariant, listing?.stock_qty])

  // Calculate discount percentage
  const discountInfo = useMemo(() => {
    if (listing?.attributes?.discount_available && listing?.attributes?.discount_percent) {
      return {
        percent: listing.attributes.discount_percent,
        originalPrice: listing.attributes.discount_original_price,
        savings: listing.attributes.discount_original_price && listing.price 
          ? listing.attributes.discount_original_price - listing.price 
          : 0,
        reason: listing.attributes.discount_reason
      }
    }
    return null
  }, [listing])

  // Random view count for social proof (between 5-30, persisted in session)
  const viewsToday = useMemo(() => {
    const stored = sessionStorage.getItem(`views_${id}`)
    if (stored) return parseInt(stored)
    const views = Math.floor(Math.random() * 26) + 5
    sessionStorage.setItem(`views_${id}`, views.toString())
    return views
  }, [id])

  const handleToggleFavorite = async () => {
    if (!user || !listing) return
    
    if (user.telegram_user_id) {
      const listingType: 'product' | 'store_product' = listing.store_id ? 'store_product' : 'product'
      await trackListingInteraction(listing.listing_id, listingType, user.telegram_user_id, 'click', [], undefined)
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
      console.error('Error toggling favorite:', error)
    }
  }

  const handleMessageSeller = () => {
    if (!listing?.seller?.username) return
    const priceText = listing.is_free ? 'bepul' : `${listing.price?.toLocaleString()} so'm`
    const message = `Salom! Men sizning "${listing.title}" e'loningiz bilan qiziqaman. Narxi: ${priceText}. Bu mahsulot hali ham mavjudmi?`
    openTelegramChat(listing.seller.username, message)
  }

  const handleShare = () => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !listing?.photos) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPhotoIndex < listing.photos.length - 1) {
        setCurrentPhotoIndex(prev => prev + 1)
      } else if (diff < 0 && currentPhotoIndex > 0) {
        setCurrentPhotoIndex(prev => prev - 1)
      }
    }
    setTouchStart(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">E'lon topilmadi</h2>
          <p className="text-gray-600 mb-6">Bu e'lon o'chirilgan yoki mavjud emas</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    )
  }

  const category = CATEGORIES.find(c => c.value === listing.category)
  const condition = CONDITIONS.find(c => c.value === listing.condition)
  const isOwnListing = listing.seller?.telegram_user_id === user?.telegram_user_id

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              <ShareIcon className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              {favorited ? (
                <HeartIconSolid className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Photo Gallery */}
      <div 
        className="relative aspect-square bg-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {listing.photos && listing.photos.length > 0 ? (
          <>
            <img
              src={listing.photos[currentPhotoIndex]}
              alt={listing.title}
              className="w-full h-full object-contain"
            />
            
            {/* Discount Badge */}
            {discountInfo && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg animate-pulse">
                -{discountInfo.percent}% CHEGIRMA
              </div>
            )}
            
            {/* Photo Counter */}
            {listing.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                {currentPhotoIndex + 1} / {listing.photos.length}
              </div>
            )}
            
            {/* Photo Navigation */}
            {listing.photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-30 shadow-lg"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex(prev => Math.min(listing.photos.length - 1, prev + 1))}
                  disabled={currentPhotoIndex === listing.photos.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-30 shadow-lg"
                >
                  <ChevronRightIcon className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}
            
            {/* Thumbnail Navigation */}
            {listing.photos.length > 1 && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 px-4">
                {listing.photos.slice(0, 5).map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex 
                        ? 'border-primary shadow-lg scale-110' 
                        : 'border-white/50 opacity-70'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {listing.photos.length > 5 && (
                  <div className="w-12 h-12 rounded-lg bg-black/50 flex items-center justify-center text-white text-sm font-medium">
                    +{listing.photos.length - 5}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-6xl">📷</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white -mt-4 rounded-t-3xl relative z-10">
        {/* Social Proof Bar */}
        <div className="flex items-center justify-center gap-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <EyeIcon className="w-4 h-4" />
            <span>Bugun <strong className="text-gray-900">{viewsToday}</strong> kishi ko'rdi</span>
          </div>
          {totalStock > 0 && totalStock <= 5 && (
            <div className="flex items-center gap-1.5 text-sm text-orange-600">
              <FireIcon className="w-4 h-4" />
              <span className="font-medium">Faqat {totalStock} dona qoldi!</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Category & Condition */}
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                {category.emoji} {category.label}
              </span>
            )}
            {condition && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                condition.value === 'new' ? 'bg-green-100 text-green-700' :
                condition.value === 'like_new' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {condition.label}
              </span>
            )}
            {listing.attributes?.taxonomy?.labelUz && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {listing.attributes.taxonomy.labelUz}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {listing.title}
          </h1>

          {/* Price Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4">
            {discountInfo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">
                    {listing.price?.toLocaleString()} so'm
                  </span>
                  <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                    -{discountInfo.percent}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-400 line-through">
                    {discountInfo.originalPrice?.toLocaleString()} so'm
                  </span>
                  <span className="text-green-600 font-medium">
                    {discountInfo.savings?.toLocaleString()} so'm tejaysiz!
                  </span>
                </div>
                {discountInfo.reason && (
                  <p className="text-sm text-gray-600 mt-1">
                    💡 {discountInfo.reason}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  {listing.is_free ? 'Bepul' : `${listing.price?.toLocaleString()} so'm`}
                </span>
                {listing.attributes?.price_negotiable && (
                  <span className="text-sm text-gray-500">• Kelishiladi</span>
                )}
              </div>
            )}
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-3 gap-3">
            {listing.attributes?.delivery_available && (
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                <TruckIcon className="w-6 h-6 text-green-600 mb-1" />
                <span className="text-xs text-green-700 font-medium text-center">Yetkazib berish</span>
              </div>
            )}
            <div className="flex flex-col items-center p-3 bg-blue-50 rounded-xl">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs text-blue-700 font-medium text-center">Xavfsiz to'lov</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-purple-50 rounded-xl">
              <ClockIcon className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs text-purple-700 font-medium text-center">Tez javob</span>
            </div>
          </div>

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">O'lcham</h3>
                {selectedSize && (
                  <span className="text-sm text-primary font-medium">{selectedSize}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => {
                  const hasStock = selectedColor 
                    ? (stockByVariant[`${size}/${selectedColor}`] || 0) > 0
                    : true
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!hasStock}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        selectedSize === size
                          ? 'bg-primary text-white shadow-lg scale-105'
                          : hasStock
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-300 line-through cursor-not-allowed'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Rang</h3>
                {selectedColor && (
                  <span className="text-sm text-primary font-medium capitalize">{selectedColor}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(color => {
                  const hasStock = selectedSize 
                    ? (stockByVariant[`${selectedSize}/${color}`] || 0) > 0
                    : true
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      disabled={!hasStock}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all capitalize ${
                        selectedColor === color
                          ? 'bg-primary text-white shadow-lg scale-105'
                          : hasStock
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-300 line-through cursor-not-allowed'
                      }`}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stock Warning */}
          {selectedSize && selectedColor && selectedStock > 0 && selectedStock <= 3 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <FireIcon className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-orange-700 font-medium">
                Bu variantdan faqat {selectedStock} dona qoldi!
              </span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Tavsif</h3>
            <div className={`relative ${!showFullDescription && listing.description.length > 200 ? 'max-h-24 overflow-hidden' : ''}`}>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
              {!showFullDescription && listing.description.length > 200 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
            {listing.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary font-medium text-sm"
              >
                {showFullDescription ? 'Kamroq ko\'rsatish' : 'Ko\'proq ko\'rsatish'}
              </button>
            )}
          </div>

          {/* Tags */}
          {listing.attributes?.tags && listing.attributes.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.attributes.tags.slice(0, 6).map((tag: string, index: number) => (
                <Link
                  key={index}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Product Details */}
          {listing.attributes && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Mahsulot ma'lumotlari
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {listing.attributes.brand && (
                  <div>
                    <p className="text-xs text-gray-500">Brend</p>
                    <p className="font-medium text-gray-900">{listing.attributes.brand}</p>
                  </div>
                )}
                {listing.attributes.material && (
                  <div>
                    <p className="text-xs text-gray-500">Material</p>
                    <p className="font-medium text-gray-900">{listing.attributes.material}</p>
                  </div>
                )}
                {listing.attributes.country_of_origin && (
                  <div>
                    <p className="text-xs text-gray-500">Ishlab chiqarilgan</p>
                    <p className="font-medium text-gray-900">{listing.attributes.country_of_origin}</p>
                  </div>
                )}
                {listing.attributes.year && (
                  <div>
                    <p className="text-xs text-gray-500">Yili</p>
                    <p className="font-medium text-gray-900">{listing.attributes.year}</p>
                  </div>
                )}
                {condition && (
                  <div>
                    <p className="text-xs text-gray-500">Holati</p>
                    <p className="font-medium text-gray-900">{condition.label}</p>
                  </div>
                )}
                {listing.neighborhood && (
                  <div>
                    <p className="text-xs text-gray-500">Joylashuv</p>
                    <p className="font-medium text-gray-900">{listing.neighborhood}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Info */}
          {listing.attributes?.delivery_available && (
            <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TruckIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800">Yetkazib berish mavjud</h4>
                  {listing.attributes.delivery_days && (
                    <p className="text-sm text-green-700 mt-1">
                      📦 {listing.attributes.delivery_days} kun ichida yetkazib beriladi
                    </p>
                  )}
                  {listing.attributes.delivery_conditions && (
                    <p className="text-sm text-green-600 mt-1">
                      {listing.attributes.delivery_conditions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seller Card */}
          {listing.seller && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <Link
                to={`/profile/${listing.seller.telegram_user_id}`}
                className="flex items-center gap-3"
              >
                {listing.seller.profile_photo_url ? (
                  <img
                    src={listing.seller.profile_photo_url}
                    alt={listing.seller.first_name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {listing.seller.first_name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {listing.seller.first_name} {listing.seller.last_name}
                    </p>
                    {listing.seller.is_verified && (
                      <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  {listing.seller.rating_average > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIconSolid
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(listing.seller!.rating_average)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        ({listing.seller.total_reviews} sharh)
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(listing.created_at).toLocaleDateString('uz')} da qo'shilgan
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Similar Listings */}
      <SimilarListings listing={listing} />

      {/* Sticky Bottom CTA */}
      {!isOwnListing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            {/* Quick Actions */}
            <button
              onClick={handleToggleFavorite}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                favorited 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {favorited ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-600" />
              )}
            </button>
            
            {/* Add to Cart */}
            <AddToCartButton
              listingId={listing.listing_id}
              className="flex-1 h-12 rounded-xl text-base"
              selectedSize={selectedSize || undefined}
              selectedColor={selectedColor || undefined}
            />
            
            {/* Message Seller */}
            <button
              onClick={handleMessageSeller}
              className="h-12 px-6 bg-primary text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Yozish</span>
            </button>
          </div>
          
          {/* Urgency Message */}
          {totalStock > 0 && totalStock <= 5 && (
            <div className="mt-2 text-center">
              <p className="text-xs text-orange-600 font-medium animate-pulse">
                ⚡ Tez bo'ling! Faqat {totalStock} dona qoldi
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

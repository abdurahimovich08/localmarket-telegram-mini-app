/**
 * ListingDetail - Premium Marketplace Design
 * 
 * Trust based on REAL data:
 * - Seller's actual ratings
 * - Real transaction count
 * - Actual response time
 * - Genuine reviews
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite } from '../lib/supabase'
import { openTelegramChat, shareListing } from '../lib/telegram'
import { trackListingView, trackUserInteraction } from '../lib/tracking'
import { trackListingInteraction } from '../lib/unifiedListingFeedback'
import type { Listing } from '../types'
import { CATEGORIES, CONDITIONS } from '../types'
import { 
  HeartIcon, 
  ShareIcon, 
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
  ShoppingBagIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  TruckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import AddToCartButton from '../components/AddToCartButton'
import SimilarListings from '../components/SimilarListings'

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
  const [activeTab, setActiveTab] = useState<'details' | 'delivery' | 'seller'>('details')
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

  // Extract variants
  const { availableColors, availableSizes, stockByVariant, totalStock } = useMemo(() => {
    const colors = new Set<string>()
    const sizes = new Set<string>()
    const stock: Record<string, number> = {}
    let total = 0
    
    if (listing?.attributes?.stock_by_size_color) {
      Object.entries(listing.attributes.stock_by_size_color).forEach(([key, qty]) => {
        const [size, color] = key.split('/')
        if (size) sizes.add(size)
        if (color) colors.add(color)
        stock[key] = qty as number
        total += qty as number
      })
    }
    
    if (listing?.attributes?.colors) {
      listing.attributes.colors.forEach((c: string) => colors.add(c))
    }
    if (listing?.attributes?.sizes) {
      listing.attributes.sizes.forEach((s: string) => sizes.add(s))
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

  // Seller trust metrics (based on REAL data)
  const sellerTrust = useMemo(() => {
    if (!listing?.seller) return null
    
    const rating = listing.seller.rating_average || 0
    const reviews = listing.seller.total_reviews || 0
    const sales = listing.seller.total_sales || 0
    
    // Trust level based on real metrics
    let level: 'new' | 'verified' | 'trusted' | 'top' = 'new'
    if (sales >= 50 && rating >= 4.5 && reviews >= 20) level = 'top'
    else if (sales >= 20 && rating >= 4.0 && reviews >= 10) level = 'trusted'
    else if (sales >= 5 && reviews >= 3) level = 'verified'
    
    return { rating, reviews, sales, level }
  }, [listing])

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
    const message = `Salom! "${listing.title}" - ${priceText}. Mavjudmi?`
    openTelegramChat(listing.seller.username, message)
  }

  const handleShare = () => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !listing?.photos) return
    const diff = touchStart - e.changedTouches[0].clientX
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-xl font-light text-white mb-3">E'lon topilmadi</h2>
          <button onClick={() => navigate('/')} className="text-white/60 hover:text-white transition-colors">
            ← Orqaga
          </button>
        </div>
      </div>
    )
  }

  const condition = CONDITIONS.find(c => c.value === listing.condition)
  const isOwnListing = listing.seller?.telegram_user_id === user?.telegram_user_id

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-11 h-11 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10"
            >
              <ShareIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`w-11 h-11 backdrop-blur-xl rounded-full flex items-center justify-center border transition-all ${
                favorited 
                  ? 'bg-red-500/20 border-red-500/30' 
                  : 'bg-black/40 border-white/10'
              }`}
            >
              {favorited ? (
                <HeartIconSolid className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image Gallery */}
      <div 
        className="relative h-[55vh] bg-[#111]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {listing.photos && listing.photos.length > 0 ? (
          <>
            <img
              src={listing.photos[currentPhotoIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
            
            {/* Discount Tag */}
            {discount && (
              <div className="absolute top-20 left-4">
                <div className="bg-white text-black px-4 py-2 text-sm font-bold tracking-wider">
                  -{discount.percent}%
                </div>
              </div>
            )}
            
            {/* Photo Dots */}
            {listing.photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {listing.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhotoIndex(i)}
                    className={`transition-all duration-300 ${
                      i === currentPhotoIndex 
                        ? 'w-8 h-1.5 bg-white' 
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                    } rounded-full`}
                  />
                ))}
              </div>
            )}
            
            {/* Nav Arrows */}
            {listing.photos.length > 1 && (
              <>
                {currentPhotoIndex > 0 && (
                  <button
                    onClick={() => setCurrentPhotoIndex(prev => prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                  </button>
                )}
                {currentPhotoIndex < listing.photos.length - 1 && (
                  <button
                    onClick={() => setCurrentPhotoIndex(prev => prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-white" />
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-8xl">📷</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative -mt-6 bg-[#0a0a0a] rounded-t-[2rem] min-h-[50vh] pb-36">
        <div className="p-6 space-y-6">
          
          {/* Brand & Category */}
          <div className="flex items-center gap-3">
            {listing.attributes?.brand && (
              <span className="text-white/60 text-sm font-medium tracking-widest uppercase">
                {listing.attributes.brand}
              </span>
            )}
            {listing.attributes?.taxonomy?.labelUz && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-white/40 text-sm">
                  {listing.attributes.taxonomy.labelUz}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-light text-white leading-tight tracking-wide">
            {listing.title}
          </h1>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-light text-white tracking-wide">
                {listing.is_free ? 'Bepul' : `${listing.price?.toLocaleString()}`}
              </span>
              {!listing.is_free && (
                <span className="text-white/40 text-lg">so'm</span>
              )}
            </div>
            {discount && (
              <div className="flex items-center gap-3">
                <span className="text-white/40 line-through text-lg">
                  {discount.originalPrice?.toLocaleString()}
                </span>
                <span className="text-emerald-400 text-sm font-medium">
                  {discount.savings?.toLocaleString()} so'm tejang
                </span>
              </div>
            )}
          </div>

          {/* Variants */}
          {(availableSizes.length > 0 || availableColors.length > 0) && (
            <div className="space-y-5 py-4 border-t border-b border-white/10">
              
              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm tracking-wider uppercase">O'lcham</span>
                    {selectedSize && (
                      <span className="text-white text-sm">{selectedSize}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => {
                      const hasStock = selectedColor 
                        ? (stockByVariant[`${size}/${selectedColor}`] || 0) > 0 : true
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                          disabled={!hasStock}
                          className={`min-w-[3rem] h-12 px-4 rounded-lg font-medium text-sm transition-all ${
                            selectedSize === size
                              ? 'bg-white text-black'
                              : hasStock
                                ? 'bg-white/5 text-white border border-white/20 hover:border-white/40'
                                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Colors */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm tracking-wider uppercase">Rang</span>
                    {selectedColor && (
                      <span className="text-white text-sm capitalize">{selectedColor}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => {
                      const hasStock = selectedSize 
                        ? (stockByVariant[`${selectedSize}/${color}`] || 0) > 0 : true
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                          disabled={!hasStock}
                          className={`h-12 px-5 rounded-lg font-medium text-sm transition-all capitalize ${
                            selectedColor === color
                              ? 'bg-white text-black'
                              : hasStock
                                ? 'bg-white/5 text-white border border-white/20 hover:border-white/40'
                                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                          }`}
                        >
                          {color}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Stock warning */}
              {totalStock > 0 && totalStock <= 5 && (
                <p className="text-amber-400/80 text-sm">
                  ⚡ Faqat {totalStock} dona qoldi
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-white/10">
              {[
                { key: 'details', label: 'Ma\'lumotlar' },
                { key: 'delivery', label: 'Yetkazish' },
                { key: 'seller', label: 'Sotuvchi' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 py-3 text-sm font-medium tracking-wider transition-all border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'text-white border-white'
                      : 'text-white/40 border-transparent hover:text-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Description */}
                  <div className="space-y-2">
                    <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                      {listing.description}
                    </p>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {condition && (
                      <div className="space-y-1">
                        <p className="text-white/40 text-xs tracking-wider uppercase">Holati</p>
                        <p className="text-white">{condition.label}</p>
                      </div>
                    )}
                    {listing.attributes?.material && (
                      <div className="space-y-1">
                        <p className="text-white/40 text-xs tracking-wider uppercase">Material</p>
                        <p className="text-white">{listing.attributes.material}</p>
                      </div>
                    )}
                    {listing.attributes?.country_of_origin && (
                      <div className="space-y-1">
                        <p className="text-white/40 text-xs tracking-wider uppercase">Ishlab chiqarilgan</p>
                        <p className="text-white">{listing.attributes.country_of_origin}</p>
                      </div>
                    )}
                    {listing.attributes?.year && (
                      <div className="space-y-1">
                        <p className="text-white/40 text-xs tracking-wider uppercase">Yili</p>
                        <p className="text-white">{listing.attributes.year}</p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {listing.attributes?.tags && listing.attributes.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {listing.attributes.tags.map((tag: string, i: number) => (
                        <Link
                          key={i}
                          to={`/search?q=${encodeURIComponent(tag)}`}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 text-xs transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Tab */}
              {activeTab === 'delivery' && (
                <div className="space-y-4 animate-fadeIn">
                  {listing.attributes?.delivery_available ? (
                    <div className="flex items-start gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <TruckIcon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-white font-medium">Yetkazib berish mavjud</p>
                        {listing.attributes.delivery_days && (
                          <p className="text-white/60 text-sm">
                            {listing.attributes.delivery_days} kun ichida
                          </p>
                        )}
                        {listing.attributes.delivery_conditions && (
                          <p className="text-white/40 text-sm">
                            {listing.attributes.delivery_conditions}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <MapPinIcon className="w-6 h-6 text-white/40 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-white font-medium">Faqat o'zi olib ketish</p>
                        {listing.neighborhood && (
                          <p className="text-white/60 text-sm">
                            📍 {listing.neighborhood}
                          </p>
                        )}
                        <p className="text-white/40 text-sm">
                          Sotuvchi bilan kelishib oling
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Seller Tab - REAL trust metrics */}
              {activeTab === 'seller' && listing.seller && (
                <div className="space-y-4 animate-fadeIn">
                  <Link
                    to={`/profile/${listing.seller.telegram_user_id}`}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    {listing.seller.profile_photo_url ? (
                      <img
                        src={listing.seller.profile_photo_url}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <span className="text-white text-2xl font-light">
                          {listing.seller.first_name[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {listing.seller.first_name} {listing.seller.last_name}
                        </p>
                        {sellerTrust?.level === 'top' && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            TOP
                          </span>
                        )}
                        {sellerTrust?.level === 'trusted' && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            Ishonchli
                          </span>
                        )}
                      </div>
                      
                      {/* Real ratings */}
                      {sellerTrust && sellerTrust.reviews > 0 ? (
                        <div className="flex items-center gap-1 mt-1">
                          <StarIconSolid className="w-4 h-4 text-amber-400" />
                          <span className="text-white">{sellerTrust.rating.toFixed(1)}</span>
                          <span className="text-white/40 text-sm">
                            ({sellerTrust.reviews} sharh)
                          </span>
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm mt-1">Yangi sotuvchi</p>
                      )}
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-white/40" />
                  </Link>

                  {/* Real trust indicators */}
                  <div className="grid grid-cols-3 gap-3">
                    {sellerTrust && sellerTrust.sales > 0 && (
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-white text-lg font-medium">{sellerTrust.sales}</p>
                        <p className="text-white/40 text-xs">sotuvlar</p>
                      </div>
                    )}
                    {sellerTrust && sellerTrust.rating > 0 && (
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-white text-lg font-medium flex items-center justify-center gap-1">
                          {sellerTrust.rating.toFixed(1)}
                          <StarIconSolid className="w-4 h-4 text-amber-400" />
                        </p>
                        <p className="text-white/40 text-xs">reyting</p>
                      </div>
                    )}
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-white text-lg font-medium">
                        {new Date(listing.seller.created_at || listing.created_at).getFullYear()}
                      </p>
                      <p className="text-white/40 text-xs">dan beri</p>
                    </div>
                  </div>

                  {/* Warning for new sellers */}
                  {sellerTrust?.level === 'new' && (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <ExclamationCircleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm font-medium">Yangi sotuvchi</p>
                        <p className="text-white/60 text-xs mt-1">
                          Oldindan to'lov qilishdan oldin ehtiyot bo'ling. Yuzma-yuz uchrashib ko'ring.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      <div className="bg-[#0a0a0a]">
        <SimilarListings listing={listing} />
      </div>

      {/* Premium Bottom Bar */}
      {!isOwnListing && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-6 px-4">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <button
                onClick={handleToggleFavorite}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  favorited 
                    ? 'bg-red-500/20 border border-red-500/30' 
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                {favorited ? (
                  <HeartIconSolid className="w-6 h-6 text-red-500" />
                ) : (
                  <HeartIcon className="w-6 h-6 text-white" />
                )}
              </button>
              
              <AddToCartButton
                listingId={listing.listing_id}
                selectedSize={selectedSize || undefined}
                selectedColor={selectedColor || undefined}
                className="flex-1 h-14 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-medium"
              />
              
              <button
                onClick={handleMessageSeller}
                className="h-14 px-8 bg-white text-black rounded-2xl font-semibold flex items-center gap-2 hover:bg-white/90 transition-colors"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                Yozish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

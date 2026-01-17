/**
 * 🎨 MASTERPIECE Product Detail Page
 * 
 * A truly immersive, cinematic shopping experience
 * Inspired by: Apple, Nike SNKRS, Gucci, Editorial Design
 */

import { useEffect, useState, useMemo, useRef } from 'react'
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
  ChevronDownIcon
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
  const [showDetails, setShowDetails] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Scroll tracking for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    if (listing?.attributes?.colors) listing.attributes.colors.forEach((c: string) => colors.add(c))
    if (listing?.attributes?.sizes) listing.attributes.sizes.forEach((s: string) => sizes.add(s))
    
    return { availableColors: Array.from(colors), availableSizes: Array.from(sizes), stockByVariant: stock, totalStock: total || listing?.stock_qty || 0 }
  }, [listing])

  // Discount
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

  // Seller trust (REAL data only)
  const sellerTrust = useMemo(() => {
    if (!listing?.seller) return null
    const rating = listing.seller.rating_average || 0
    const reviews = listing.seller.total_reviews || 0
    const sales = listing.seller.total_sales || 0
    
    let level: 'new' | 'active' | 'trusted' | 'top' = 'new'
    if (sales >= 50 && rating >= 4.5) level = 'top'
    else if (sales >= 15 && rating >= 4.0) level = 'trusted'
    else if (sales >= 3) level = 'active'
    
    return { rating, reviews, sales, level }
  }, [listing])

  const handleToggleFavorite = async () => {
    if (!user || !listing) return
    if (user.telegram_user_id) {
      await trackListingInteraction(listing.listing_id, listing.store_id ? 'store_product' : 'product', user.telegram_user_id, 'click', [], undefined)
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
    openTelegramChat(listing.seller.username, `Salom! "${listing.title}" hali mavjudmi?`)
  }

  const handleShare = () => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-t-violet-400 animate-spin" />
        </div>
      </div>
    )
  }

  // Not found
  if (!listing) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-8xl mb-8 animate-bounce">🔍</div>
          <h2 className="text-3xl font-extralight text-white mb-4 tracking-wide">Topilmadi</h2>
          <button onClick={() => navigate('/')} className="text-violet-400 hover:text-violet-300 transition-colors">
            ← Orqaga qaytish
          </button>
        </div>
      </div>
    )
  }

  const condition = CONDITIONS.find(c => c.value === listing.condition)
  const isOwnListing = listing.seller?.telegram_user_id === user?.telegram_user_id

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════════════════════
          CINEMATIC HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* Animated Background Gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-violet-950/50 via-transparent to-slate-950"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        
        {/* Product Image */}
        {listing.photos && listing.photos.length > 0 ? (
          <div 
            className="absolute inset-0"
            style={{ transform: `scale(${1 + scrollY * 0.0005}) translateY(${scrollY * 0.2}px)` }}
          >
            <img
              src={listing.photos[currentPhotoIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <span className="text-9xl opacity-20">📷</span>
          </div>
        )}

        {/* Floating Header */}
        <header className="absolute top-0 left-0 right-0 z-50 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 transition-all duration-300"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 transition-all duration-300"
              >
                <ShareIcon className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`w-12 h-12 backdrop-blur-xl rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                  favorited 
                    ? 'bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/30' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {favorited ? (
                  <HeartIconSolid className="w-5 h-5 text-rose-400" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-24 left-4 animate-pulse">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500 blur-xl opacity-50" />
              <div className="relative bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2.5 rounded-full font-bold tracking-wider shadow-2xl">
                -{discount.percent}% CHEGIRMA
              </div>
            </div>
          </div>
        )}

        {/* Photo Navigation */}
        {listing.photos && listing.photos.length > 1 && (
          <>
            {/* Dots */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {listing.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhotoIndex(i)}
                  className={`transition-all duration-500 rounded-full ${
                    i === currentPhotoIndex 
                      ? 'w-10 h-2 bg-white' 
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            {/* Arrows */}
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex gap-4 z-20">
              <button
                onClick={() => setCurrentPhotoIndex(i => Math.max(0, i - 1))}
                disabled={currentPhotoIndex === 0}
                className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 disabled:opacity-30 transition-all hover:bg-white/10"
              >
                <ChevronLeftIcon className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => setCurrentPhotoIndex(i => Math.min(listing.photos!.length - 1, i + 1))}
                disabled={currentPhotoIndex === listing.photos.length - 1}
                className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 disabled:opacity-30 transition-all hover:bg-white/10"
              >
                <ChevronRightIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        )}

        {/* Hero Text Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {/* Brand */}
          {listing.attributes?.brand && (
            <div className="mb-3 overflow-hidden">
              <p 
                className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase animate-slideUp"
                style={{ animationDelay: '0.1s' }}
              >
                {listing.attributes.brand}
              </p>
            </div>
          )}
          
          {/* Title */}
          <div className="overflow-hidden">
            <h1 
              className="text-4xl md:text-5xl font-extralight text-white leading-tight tracking-wide animate-slideUp"
              style={{ animationDelay: '0.2s' }}
            >
              {listing.title}
            </h1>
          </div>
          
          {/* Price */}
          <div className="mt-4 overflow-hidden">
            <div className="flex items-baseline gap-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <span className="text-5xl font-extralight text-white">
                {listing.is_free ? 'Bepul' : listing.price?.toLocaleString()}
              </span>
              {!listing.is_free && <span className="text-white/40 text-xl">so'm</span>}
            </div>
            {discount && (
              <div className="flex items-center gap-4 mt-2 animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <span className="text-white/30 line-through text-xl">{discount.originalPrice?.toLocaleString()}</span>
                <span className="text-emerald-400 font-medium">{discount.savings?.toLocaleString()} tejaysiz</span>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDownIcon className="w-6 h-6 text-white" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTENT SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section ref={contentRef} className="relative bg-slate-950 px-5 py-10 space-y-8">
        
        {/* Category Tags */}
        <div className="flex flex-wrap gap-2">
          {listing.attributes?.taxonomy?.labelUz && (
            <span className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm">
              {listing.attributes.taxonomy.labelUz}
            </span>
          )}
          {condition && (
            <span className={`px-4 py-2 rounded-full text-sm border ${
              condition.value === 'new' || condition.value === 'yangi'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}>
              {condition.label}
            </span>
          )}
          {totalStock > 0 && totalStock <= 5 && (
            <span className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-sm animate-pulse">
              Faqat {totalStock} dona qoldi
            </span>
          )}
        </div>

        {/* ═══ SIZE SELECTION ═══ */}
        {availableSizes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white/50 text-sm tracking-[0.2em] uppercase">O'lcham tanlang</h3>
              {selectedSize && <span className="text-white font-medium">{selectedSize}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              {availableSizes.map(size => {
                const hasStock = selectedColor ? (stockByVariant[`${size}/${selectedColor}`] || 0) > 0 : true
                const isSelected = selectedSize === size
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(isSelected ? null : size)}
                    disabled={!hasStock}
                    className={`relative min-w-[4rem] h-14 px-5 rounded-2xl font-medium transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? 'text-slate-950'
                        : hasStock
                          ? 'text-white border border-white/20 hover:border-white/40'
                          : 'text-white/20 border border-white/5'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                    )}
                    <span className="relative z-10">{size}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ COLOR SELECTION ═══ */}
        {availableColors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white/50 text-sm tracking-[0.2em] uppercase">Rang</h3>
              {selectedColor && <span className="text-white font-medium capitalize">{selectedColor}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              {availableColors.map(color => {
                const hasStock = selectedSize ? (stockByVariant[`${selectedSize}/${color}`] || 0) > 0 : true
                const isSelected = selectedColor === color
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(isSelected ? null : color)}
                    disabled={!hasStock}
                    className={`relative h-14 px-6 rounded-2xl font-medium transition-all duration-300 capitalize overflow-hidden ${
                      isSelected
                        ? 'text-slate-950'
                        : hasStock
                          ? 'text-white border border-white/20 hover:border-white/40'
                          : 'text-white/20 border border-white/5'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                    )}
                    <span className="relative z-10">{color}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ DESCRIPTION ═══ */}
        <div className="space-y-4">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-4 border-t border-b border-white/10"
          >
            <span className="text-white/50 text-sm tracking-[0.2em] uppercase">Tavsif</span>
            <ChevronDownIcon className={`w-5 h-5 text-white/50 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${showDetails ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-white/60 leading-relaxed whitespace-pre-wrap pb-4">
              {listing.description}
            </p>
            
            {/* Specs */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {listing.attributes?.material && (
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Material</p>
                  <p className="text-white">{listing.attributes.material}</p>
                </div>
              )}
              {listing.attributes?.country_of_origin && (
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Ishlab chiqarilgan</p>
                  <p className="text-white">{listing.attributes.country_of_origin}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ DELIVERY INFO ═══ */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
          {listing.attributes?.delivery_available ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Yetkazib beramiz</p>
                {listing.attributes.delivery_days && (
                  <p className="text-white/50 text-sm mt-1">{listing.attributes.delivery_days} kun ichida</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <MapPinIcon className="w-6 h-6 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">O'zi olib ketish</p>
                {listing.neighborhood && (
                  <p className="text-white/50 text-sm mt-1">📍 {listing.neighborhood}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ SELLER CARD ═══ */}
        {listing.seller && (
          <Link
            to={`/profile/${listing.seller.telegram_user_id}`}
            className="block p-5 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                {listing.seller.profile_photo_url ? (
                  <img
                    src={listing.seller.profile_photo_url}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <span className="text-white text-2xl font-light">
                      {listing.seller.first_name[0]}
                    </span>
                  </div>
                )}
                {/* Trust badge */}
                {sellerTrust?.level === 'top' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-xs">👑</span>
                  </div>
                )}
                {sellerTrust?.level === 'trusted' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {listing.seller.first_name} {listing.seller.last_name}
                </p>
                
                {/* Rating - only if has reviews */}
                {sellerTrust && sellerTrust.reviews > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <StarIconSolid className="w-4 h-4 text-amber-400" />
                      <span className="text-white text-sm">{sellerTrust.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-white/30 text-sm">•</span>
                    <span className="text-white/50 text-sm">{sellerTrust.reviews} sharh</span>
                    {sellerTrust.sales > 0 && (
                      <>
                        <span className="text-white/30 text-sm">•</span>
                        <span className="text-white/50 text-sm">{sellerTrust.sales} sotuv</span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-amber-400/70 text-sm mt-1 flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Yangi sotuvchi
                  </p>
                )}
              </div>
              
              <ChevronRightIcon className="w-5 h-5 text-white/30" />
            </div>
            
            {/* Warning for new sellers */}
            {sellerTrust?.level === 'new' && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-300/80 text-xs">
                  ⚠️ Yangi sotuvchi. Yuzma-yuz uchrashishni tavsiya etamiz.
                </p>
              </div>
            )}
          </Link>
        )}

        {/* Tags */}
        {listing.attributes?.tags && listing.attributes.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {listing.attributes.tags.slice(0, 8).map((tag: string, i: number) => (
              <Link
                key={i}
                to={`/search?q=${encodeURIComponent(tag)}`}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 text-sm transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Similar */}
      <section className="bg-slate-950 pt-8">
        <SimilarListings listing={listing} />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FLOATING ACTION BAR
      ═══════════════════════════════════════════════════════════ */}
      {!isOwnListing && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Gradient fade */}
          <div className="h-20 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
          
          {/* Action bar */}
          <div className="bg-slate-950/80 backdrop-blur-xl border-t border-white/10 px-5 py-4 pb-8">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              {/* Favorite */}
              <button
                onClick={handleToggleFavorite}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  favorited 
                    ? 'bg-rose-500/20 border border-rose-500/30' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {favorited ? (
                  <HeartIconSolid className="w-6 h-6 text-rose-400" />
                ) : (
                  <HeartIcon className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* Cart */}
              <AddToCartButton
                listingId={listing.listing_id}
                selectedSize={selectedSize || undefined}
                selectedColor={selectedColor || undefined}
                className="flex-1 h-14 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl font-medium transition-all"
              />
              
              {/* Message */}
              <button
                onClick={handleMessageSeller}
                className="relative h-14 px-8 rounded-2xl font-semibold flex items-center gap-2 overflow-hidden group"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-[length:200%_100%] animate-gradientMove" />
                <ChatBubbleLeftIcon className="relative z-10 w-5 h-5 text-white" />
                <span className="relative z-10 text-white">Yozish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes gradientMove {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradientMove {
          animation: gradientMove 3s ease infinite;
        }
      `}</style>
    </div>
  )
}

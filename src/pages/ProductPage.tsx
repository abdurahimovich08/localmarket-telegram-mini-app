/**
 * 🛍️ Product Page - Clean, Scannable, Professional
 * 
 * Design Principles:
 * 1. Clear sections - each info group separated
 * 2. Visual hierarchy - important info stands out  
 * 3. Easy scanning - find what you need fast
 * 4. Whitespace - room to breathe
 * 5. Sticky CTA - always accessible
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite, addToCart } from '../lib/supabase'
import { openTelegramChat, shareListing } from '../lib/telegram'
import type { Listing } from '../types'
import { 
  ChevronLeftIcon,
  HeartIcon,
  ShareIcon,
  ChevronRightIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  StarIcon as StarOutline,
  CheckIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid'
import { getListingReviews, type Review } from '../lib/reviews'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  
  // State
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)

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
    if (listing?.attributes?.discount_percent) {
      return {
        percent: listing.attributes.discount_percent,
        original: listing.attributes.discount_original_price,
      }
    }
    return null
  }, [listing])

  // Review stats
  const reviewStats = useMemo(() => ({
    count: reviews.length,
    average: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  }), [reviews])

  // Load data
  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getListing(id)
        if (data) {
          setListing(data)
          incrementViewCount(id)
          if (user) {
            const fav = await isFavorite(user.telegram_user_id, id)
            setFavorited(fav)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  useEffect(() => {
    if (id && listing) {
      getListingReviews(id).then(setReviews)
    }
  }, [id, listing])

  // Handlers
  const toggleFavorite = async () => {
    if (!user || !listing) return
    if (favorited) {
      await removeFavorite(user.telegram_user_id, listing.listing_id)
    } else {
      await addFavorite(user.telegram_user_id, listing.listing_id)
    }
    setFavorited(!favorited)
  }

  const handleAddToCart = async () => {
    if (!user || !listing) return
    setAddingToCart(true)
    try {
      await addToCart(user.telegram_user_id, listing.listing_id, quantity)
      setCartAdded(true)
      setTimeout(() => setCartAdded(false), 2000)
    } finally {
      setAddingToCart(false)
    }
  }

  const messageSeller = () => {
    if (!listing?.seller?.username) return
    openTelegramChat(listing.seller.username, `Salom! "${listing.title}" haqida so'ramoqchiman.`)
  }

  const isOwn = listing?.seller?.telegram_user_id === user?.telegram_user_id

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="animate-pulse">
          <div className="h-12 bg-white" />
          <div className="aspect-square bg-gray-200 m-4 rounded-2xl" />
          <div className="bg-white mx-4 rounded-2xl p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Topilmadi</h2>
          <button onClick={() => navigate('/')} className="text-blue-600 font-medium">
            Bosh sahifaga →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-28">
      
      {/* ══════════════════════════════════════════════════
          HEADER - Minimal, always accessible
      ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1">
            <button onClick={() => shareListing(listing.listing_id, listing.title)} className="p-2 rounded-full hover:bg-gray-100">
              <ShareIcon className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={toggleFavorite} className="p-2 rounded-full hover:bg-gray-100">
              {favorited ? (
                <HeartSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          SECTION 1: PHOTO GALLERY
          - Full width, clean, focusable
      ══════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="relative aspect-square">
          {photos.length > 0 ? (
            <img
              src={photos[currentPhoto]}
              alt={listing.title}
              className="w-full h-full object-contain bg-gray-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <span className="text-6xl">📷</span>
            </div>
          )}
          
          {/* Discount badge - top left */}
          {discount && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              -{discount.percent}%
            </div>
          )}
          
          {/* Photo counter - bottom right */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              {currentPhoto + 1} / {photos.length}
            </div>
          )}
        </div>
        
        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhoto(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentPhoto ? 'border-black' : 'border-transparent'
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2: PRODUCT INFO CARD
          - Title, price, rating - the essentials
      ══════════════════════════════════════════════════ */}
      <section className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
        {/* Brand */}
        {listing.attributes?.brand && (
          <p className="text-blue-600 text-sm font-medium mb-1">
            {listing.attributes.brand}
          </p>
        )}
        
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 leading-tight mb-3">
          {listing.title}
        </h1>
        
        {/* Rating row */}
        <div className="flex items-center gap-4 mb-4">
          {reviewStats.count > 0 ? (
            <div className="flex items-center gap-1">
              <StarIcon className="w-5 h-5 text-amber-400" />
              <span className="font-semibold">{reviewStats.average.toFixed(1)}</span>
              <span className="text-gray-400">({reviewStats.count} sharx)</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Sharxlar yo'q</span>
          )}
          
          {variants.total > 0 && variants.total <= 5 && (
            <span className="text-orange-600 text-sm font-medium">
              ⚡ {variants.total} dona qoldi
            </span>
          )}
        </div>
        
        {/* Price - prominent */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {listing.price?.toLocaleString()} <span className="text-lg font-normal">so'm</span>
          </span>
          {discount && (
            <span className="text-lg text-gray-400 line-through">
              {discount.original?.toLocaleString()}
            </span>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3: VARIANTS
          - Color and size selection
          - Clear, visual, easy to tap
      ══════════════════════════════════════════════════ */}
      {(variants.colors.length > 0 || variants.sizes.length > 0) && (
        <section className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
          {/* Colors */}
          {variants.colors.length > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-900">Rang</span>
                {selectedColor && <span className="text-gray-500 capitalize">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {variants.colors.map(color => {
                  const isSelected = selectedColor === color
                  return (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(isSelected ? null : color); setCurrentPhoto(0) }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                        isSelected 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Sizes */}
          {variants.sizes.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-900">O'lcham</span>
                {selectedSize && <span className="text-gray-500">{selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {variants.sizes.map(size => {
                  const isSelected = selectedSize === size
                  const inStock = !selectedColor || (variants.stock[`${size}/${selectedColor}`] || 0) > 0
                  return (
                    <button
                      key={size}
                      onClick={() => inStock && setSelectedSize(isSelected ? null : size)}
                      disabled={!inStock}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${
                        isSelected 
                          ? 'bg-gray-900 text-white' 
                          : inStock
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          SECTION 4: TABS - Details / Reviews
          - Organized, not cluttered
      ══════════════════════════════════════════════════ */}
      <section className="bg-white mx-4 mt-3 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
              activeTab === 'details' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            Tafsilotlar
            {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
              activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            Sharxlar ({reviewStats.count})
            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
          </button>
        </div>
        
        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'details' ? (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tavsif</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {listing.description || 'Tavsif mavjud emas'}
                </p>
              </div>
              
              {/* Specs grid */}
              {(listing.attributes?.brand || listing.attributes?.material) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {listing.attributes?.brand && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-1">Brend</p>
                      <p className="text-sm font-medium text-gray-900">{listing.attributes.brand}</p>
                    </div>
                  )}
                  {listing.attributes?.material && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-1">Material</p>
                      <p className="text-sm font-medium text-gray-900">{listing.attributes.material}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Delivery info */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {listing.attributes?.delivery_available ? 'Yetkazib berish mavjud' : "O'zi olib ketish"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {listing.neighborhood || 'Joylashuv ko\'rsatilmagan'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map(review => (
                    <div key={review.review_id} className="pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(i => (
                            <StarIcon 
                              key={i} 
                              className={`w-4 h-4 ${i <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-xs">
                          {review.reviewer?.first_name || 'Foydalanuvchi'}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-600 text-sm line-clamp-2">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <button className="text-blue-600 text-sm font-medium">
                      Barcha {reviews.length} ta sharxni ko'rish →
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <StarOutline className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Hali sharxlar yo'q</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 5: SELLER
          - Who you're buying from
      ══════════════════════════════════════════════════ */}
      {listing.seller && (
        <section className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Sotuvchi</h3>
          
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
              {listing.seller.profile_photo_url ? (
                <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold">{listing.seller.first_name?.[0]}</span>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{listing.seller.first_name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {listing.seller.rating_average ? (
                  <>
                    <StarIcon className="w-4 h-4 text-amber-400" />
                    <span>{listing.seller.rating_average.toFixed(1)}</span>
                    <span>·</span>
                  </>
                ) : null}
                <span>{listing.seller.total_sales || 0} sotuv</span>
              </div>
            </div>
            
            {/* Message button */}
            {!isOwn && (
              <button
                onClick={messageSeller}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Yozish
              </button>
            )}
          </div>
          
          {/* Trust badges */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <ShieldCheckIcon className="w-4 h-4" />
              Tekshirilgan
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
              Tez javob
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          FLOATING ACTION BAR
          - Always visible, clear CTA
      ══════════════════════════════════════════════════ */}
      {!isOwn && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            {/* Quantity */}
            <div className="flex items-center bg-gray-100 rounded-full">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`flex-1 h-12 rounded-full font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                cartAdded ? 'bg-green-500' : 'bg-black hover:bg-gray-800'
              }`}
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : cartAdded ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Qo'shildi!
                </>
              ) : (
                "Savatga qo'shish"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

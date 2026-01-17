/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                                                                   ║
 * ║   P R O D U C T   E X P E R I E N C E                            ║
 * ║                                                                   ║
 * ║   "Design is not just what it looks like and feels like.         ║
 * ║    Design is how it works." — Steve Jobs                         ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 * 
 * Design Philosophy:
 * 
 * 1. SIMPLICITY — Remove until it breaks, then add one thing back
 * 2. EMOTION — Every interaction should feel delightful
 * 3. FOCUS — Guide the eye, eliminate distraction
 * 4. QUALITY — Obsess over every detail
 * 5. DESIRE — Create want, not just need
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { getListing, incrementViewCount, isFavorite, addFavorite, removeFavorite, addToCart } from '../lib/supabase'
import { openTelegramChat, shareListing } from '../lib/telegram'
import type { Listing } from '../types'
import { 
  ChevronLeftIcon,
  HeartIcon,
  PaperAirplaneIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid'
import { getListingReviews, canWriteReview, createReview, type Review } from '../lib/reviews'
import WriteReviewModal from '../components/reviews/WriteReviewModal'
import PurchaseClaimButton from '../components/reviews/PurchaseClaimButton'

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS — The DNA of our design system
// ═══════════════════════════════════════════════════════════════════

const COLORS = {
  // Backgrounds
  canvas: '#FAFAFA',        // Main background - warm white
  surface: '#FFFFFF',       // Cards, elevated surfaces
  surfaceHover: '#F5F5F7',  // Hover state
  
  // Text
  primary: '#1D1D1F',       // Headlines - near black
  secondary: '#86868B',     // Body text - sophisticated gray
  tertiary: '#A1A1A6',      // Captions, hints
  
  // Accent - Refined blue (Apple-like)
  accent: '#0071E3',        // Primary actions
  accentHover: '#0077ED',   // Hover state
  accentLight: '#E8F4FD',   // Badges, highlights
  
  // Semantic
  success: '#34C759',       // Positive
  warning: '#FF9500',       // Attention
  error: '#FF3B30',         // Negative
  
  // Special
  gold: '#BF8D30',          // Premium, ratings
  shadow: 'rgba(0,0,0,0.04)', // Subtle shadows
}

const TYPOGRAPHY = {
  // Display - For hero moments
  display: {
    fontSize: '34px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '1.1',
  },
  // Title - For section headers
  title: {
    fontSize: '22px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    lineHeight: '1.2',
  },
  // Headline - For card titles
  headline: {
    fontSize: '17px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    lineHeight: '1.3',
  },
  // Body - For descriptions
  body: {
    fontSize: '15px',
    fontWeight: '400',
    letterSpacing: '0',
    lineHeight: '1.5',
  },
  // Caption - For hints, labels
  caption: {
    fontSize: '13px',
    fontWeight: '400',
    letterSpacing: '0',
    lineHeight: '1.4',
  },
  // Small - For tags, badges
  small: {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.02em',
    lineHeight: '1.3',
  },
}

const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
}

const RADIUS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ProductExperience() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  
  // ─── State ───
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [hasVerifiedPurchase, setHasVerifiedPurchase] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // ─── Derived State ───
  const photos = useMemo(() => {
    const byColor = listing?.attributes?.photos_by_color as Record<string, string[]> | undefined
    if (selectedColor && byColor?.[selectedColor]?.length) {
      return byColor[selectedColor]
    }
    return listing?.photos || []
  }, [listing, selectedColor])

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

  const discount = useMemo(() => {
    if (listing?.attributes?.discount_percent) {
      return {
        percent: listing.attributes.discount_percent,
        original: listing.attributes.discount_original_price,
      }
    }
    return null
  }, [listing])

  const reviewStats = useMemo(() => ({
    count: reviews.length,
    average: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  }), [reviews])

  // ─── Effects ───
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
    const loadReviews = async () => {
      if (!id || !listing) return
      const data = await getListingReviews(id)
      setReviews(data)
      if (user?.telegram_user_id) {
        const { canWrite, claim } = await canWriteReview(id, user.telegram_user_id)
        setCanReview(canWrite)
        setHasVerifiedPurchase(!!claim)
      }
    }
    if (listing) loadReviews()
  }, [id, listing, user])

  // ─── Handlers ───
  const toggleFavorite = useCallback(async () => {
    if (!user || !listing) return
    if (favorited) {
      await removeFavorite(user.telegram_user_id, listing.listing_id)
    } else {
      await addFavorite(user.telegram_user_id, listing.listing_id)
    }
    setFavorited(!favorited)
  }, [user, listing, favorited])

  const handleAddToCart = useCallback(async () => {
    if (!user || !listing || isAddingToCart) return
    setIsAddingToCart(true)
    try {
      await addToCart(user.telegram_user_id, listing.listing_id, 1)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2500)
    } finally {
      setIsAddingToCart(false)
    }
  }, [user, listing, isAddingToCart])

  const contactSeller = useCallback(() => {
    if (!listing?.seller?.username) return
    openTelegramChat(listing.seller.username, `Assalomu alaykum! "${listing.title}" haqida so'ramoqchi edim.`)
  }, [listing])

  const share = useCallback(() => {
    if (!listing) return
    shareListing(listing.listing_id, listing.title, listing.price || undefined)
  }, [listing])

  const isOwn = listing?.seller?.telegram_user_id === user?.telegram_user_id

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE — Beautiful, calm, confident
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: COLORS.canvas,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Skeleton Header */}
        <div style={{ padding: SPACING.md, display: 'flex', gap: SPACING.md }}>
          <div style={{ width: 40, height: 40, borderRadius: RADIUS.full, background: COLORS.surfaceHover }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 40, height: 40, borderRadius: RADIUS.full, background: COLORS.surfaceHover }} />
        </div>
        
        {/* Skeleton Image */}
        <div style={{ 
          aspectRatio: '1', 
          background: COLORS.surfaceHover,
          margin: SPACING.md,
          borderRadius: RADIUS.xl,
        }} />
        
        {/* Skeleton Content */}
        <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          <div style={{ width: '30%', height: 14, borderRadius: RADIUS.sm, background: COLORS.surfaceHover }} />
          <div style={{ width: '80%', height: 28, borderRadius: RADIUS.sm, background: COLORS.surfaceHover }} />
          <div style={{ width: '40%', height: 20, borderRadius: RADIUS.sm, background: COLORS.surfaceHover }} />
        </div>
        
        {/* Pulse Animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          div[style*="background: ${COLORS.surfaceHover}"] {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // NOT FOUND — Elegant, helpful
  // ═══════════════════════════════════════════════════════════════════
  if (!listing) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: COLORS.canvas,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: SPACING.lg }}>🔍</div>
        <h1 style={{ 
          ...TYPOGRAPHY.title, 
          color: COLORS.primary,
          marginBottom: SPACING.sm,
        }}>
          Mahsulot topilmadi
        </h1>
        <p style={{ 
          ...TYPOGRAPHY.body, 
          color: COLORS.secondary,
          marginBottom: SPACING.xl,
        }}>
          Bu mahsulot o'chirilgan yoki mavjud emas
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: COLORS.accent,
            color: 'white',
            border: 'none',
            padding: `${SPACING.md} ${SPACING.xl}`,
            borderRadius: RADIUS.full,
            ...TYPOGRAPHY.headline,
            cursor: 'pointer',
          }}
        >
          Bosh sahifa
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN EXPERIENCE
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: COLORS.canvas,
      paddingBottom: 120,
    }}>
      
      {/* ═══════════════════════════════════════════════════════════════
          NAVIGATION BAR — Minimal, functional
      ═══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: `${COLORS.canvas}E6`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: `${SPACING.sm} ${SPACING.md}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.full,
            background: COLORS.surface,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 2px 8px ${COLORS.shadow}`,
          }}
        >
          <ChevronLeftIcon style={{ width: 24, height: 24, color: COLORS.primary }} />
        </button>
        
        <button
          onClick={toggleFavorite}
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.full,
            background: favorited ? '#FEE2E2' : COLORS.surface,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 2px 8px ${COLORS.shadow}`,
            transition: 'all 0.2s ease',
          }}
        >
          {favorited ? (
            <HeartSolid style={{ width: 22, height: 22, color: '#EF4444' }} />
          ) : (
            <HeartIcon style={{ width: 22, height: 22, color: COLORS.primary }} />
          )}
        </button>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          HERO IMAGE — The star of the show
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: SPACING.md }}>
        <div style={{
          position: 'relative',
          aspectRatio: '1',
          background: COLORS.surface,
          borderRadius: RADIUS.xl,
          overflow: 'hidden',
          boxShadow: `0 4px 24px ${COLORS.shadow}`,
        }}>
          {photos.length > 0 ? (
            <img
              src={photos[currentPhoto]}
              alt={listing.title}
              onLoad={() => setImageLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: SPACING.xl,
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.tertiary,
              fontSize: 64,
            }}>
              📷
            </div>
          )}
          
          {/* Photo Navigation */}
          {photos.length > 1 && (
            <>
              {currentPhoto > 0 && (
                <button
                  onClick={() => { setCurrentPhoto(p => p - 1); setImageLoaded(false) }}
                  style={{
                    position: 'absolute',
                    left: SPACING.sm,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.full,
                    background: `${COLORS.surface}CC`,
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeftIcon style={{ width: 20, height: 20, color: COLORS.primary }} />
                </button>
              )}
              {currentPhoto < photos.length - 1 && (
                <button
                  onClick={() => { setCurrentPhoto(p => p + 1); setImageLoaded(false) }}
                  style={{
                    position: 'absolute',
                    right: SPACING.sm,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.full,
                    background: `${COLORS.surface}CC`,
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRightIcon style={{ width: 20, height: 20, color: COLORS.primary }} />
                </button>
              )}
              
              {/* Indicators */}
              <div style={{
                position: 'absolute',
                bottom: SPACING.md,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 6,
              }}>
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPhoto(i); setImageLoaded(false) }}
                    style={{
                      width: i === currentPhoto ? 24 : 8,
                      height: 8,
                      borderRadius: RADIUS.full,
                      background: i === currentPhoto ? COLORS.primary : COLORS.tertiary,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Discount Badge */}
          {discount && (
            <div style={{
              position: 'absolute',
              top: SPACING.md,
              left: SPACING.md,
              background: COLORS.error,
              color: 'white',
              padding: `${SPACING.xs} ${SPACING.md}`,
              borderRadius: RADIUS.full,
              ...TYPOGRAPHY.small,
              fontWeight: 600,
            }}>
              −{discount.percent}%
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT INFO — Clear hierarchy, easy to scan
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: `0 ${SPACING.lg}` }}>
        
        {/* Brand */}
        {listing.attributes?.brand && (
          <p style={{
            ...TYPOGRAPHY.caption,
            color: COLORS.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: SPACING.xs,
          }}>
            {listing.attributes.brand}
          </p>
        )}
        
        {/* Title */}
        <h1 style={{
          ...TYPOGRAPHY.display,
          color: COLORS.primary,
          marginBottom: SPACING.md,
        }}>
          {listing.title}
        </h1>
        
        {/* Rating */}
        {reviewStats.count > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            marginBottom: SPACING.md,
          }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <StarIcon 
                  key={i}
                  style={{ 
                    width: 16, 
                    height: 16, 
                    color: i <= Math.round(reviewStats.average) ? COLORS.gold : '#E5E5EA'
                  }} 
                />
              ))}
            </div>
            <span style={{ ...TYPOGRAPHY.caption, color: COLORS.secondary }}>
              {reviewStats.average.toFixed(1)} · {reviewStats.count} sharx
            </span>
          </div>
        )}
        
        {/* Price */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
          marginBottom: SPACING.lg,
        }}>
          <span style={{
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.primary,
            letterSpacing: '-0.02em',
          }}>
            {listing.price?.toLocaleString()}
            <span style={{ 
              fontSize: 17, 
              fontWeight: 400, 
              color: COLORS.secondary,
              marginLeft: 4,
            }}>
              so'm
            </span>
          </span>
          {discount && (
            <span style={{
              ...TYPOGRAPHY.body,
              color: COLORS.tertiary,
              textDecoration: 'line-through',
            }}>
              {discount.original?.toLocaleString()}
            </span>
          )}
        </div>
        
        {/* Stock Alert */}
        {variants.total > 0 && variants.total <= 5 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            padding: SPACING.md,
            background: '#FEF3C7',
            borderRadius: RADIUS.md,
            marginBottom: SPACING.lg,
          }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ ...TYPOGRAPHY.caption, color: '#92400E', fontWeight: 500 }}>
              Faqat {variants.total} dona qoldi — Shoshiling!
            </span>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          VARIANTS — Intuitive selection
      ═══════════════════════════════════════════════════════════════ */}
      {(variants.colors.length > 0 || variants.sizes.length > 0) && (
        <section style={{ padding: `${SPACING.lg} ${SPACING.lg}` }}>
          
          {/* Colors */}
          {variants.colors.length > 0 && (
            <div style={{ marginBottom: SPACING.lg }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}>
                <span style={{ ...TYPOGRAPHY.headline, color: COLORS.primary }}>Rang</span>
                {selectedColor && (
                  <span style={{ ...TYPOGRAPHY.body, color: COLORS.secondary, textTransform: 'capitalize' }}>
                    {selectedColor}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
                {variants.colors.map(color => {
                  const isSelected = selectedColor === color
                  const hasPhotos = (listing?.attributes?.photos_by_color as any)?.[color]?.length > 0
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(isSelected ? null : color)
                        setCurrentPhoto(0)
                        setImageLoaded(false)
                      }}
                      style={{
                        position: 'relative',
                        padding: `${SPACING.sm} ${SPACING.md}`,
                        borderRadius: RADIUS.full,
                        border: `2px solid ${isSelected ? COLORS.accent : '#E5E5EA'}`,
                        background: isSelected ? COLORS.accentLight : COLORS.surface,
                        color: isSelected ? COLORS.accent : COLORS.primary,
                        ...TYPOGRAPHY.body,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize',
                      }}
                    >
                      {color}
                      {hasPhotos && !isSelected && (
                        <span style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 8,
                          height: 8,
                          borderRadius: RADIUS.full,
                          background: COLORS.accent,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Sizes */}
          {variants.sizes.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}>
                <span style={{ ...TYPOGRAPHY.headline, color: COLORS.primary }}>O'lcham</span>
                {selectedSize && (
                  <span style={{ ...TYPOGRAPHY.body, color: COLORS.secondary }}>
                    {selectedSize}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
                {variants.sizes.map(size => {
                  const isSelected = selectedSize === size
                  const hasStock = selectedColor 
                    ? (variants.stock[`${size}/${selectedColor}`] || 0) > 0 
                    : true
                  return (
                    <button
                      key={size}
                      onClick={() => hasStock && setSelectedSize(isSelected ? null : size)}
                      disabled={!hasStock}
                      style={{
                        minWidth: 52,
                        height: 52,
                        borderRadius: RADIUS.lg,
                        border: `2px solid ${isSelected ? COLORS.accent : '#E5E5EA'}`,
                        background: isSelected ? COLORS.accent : COLORS.surface,
                        color: isSelected ? 'white' : hasStock ? COLORS.primary : COLORS.tertiary,
                        ...TYPOGRAPHY.headline,
                        cursor: hasStock ? 'pointer' : 'not-allowed',
                        opacity: hasStock ? 1 : 0.5,
                        transition: 'all 0.2s ease',
                        textDecoration: hasStock ? 'none' : 'line-through',
                      }}
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

      {/* ═══════════════════════════════════════════════════════════════
          DESCRIPTION — Story of the product
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ 
        padding: SPACING.lg,
        background: COLORS.surface,
        margin: `${SPACING.lg} ${SPACING.lg}`,
        borderRadius: RADIUS.xl,
      }}>
        <h2 style={{ ...TYPOGRAPHY.headline, color: COLORS.primary, marginBottom: SPACING.md }}>
          Tavsif
        </h2>
        <p style={{ 
          ...TYPOGRAPHY.body, 
          color: COLORS.secondary,
          whiteSpace: 'pre-wrap',
        }}>
          {listing.description || 'Tavsif mavjud emas'}
        </p>
        
        {/* Specs */}
        {(listing.attributes?.material || listing.attributes?.brand) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING.md,
            marginTop: SPACING.lg,
            paddingTop: SPACING.lg,
            borderTop: `1px solid ${COLORS.surfaceHover}`,
          }}>
            {listing.attributes?.material && (
              <div>
                <p style={{ ...TYPOGRAPHY.small, color: COLORS.tertiary, marginBottom: 4 }}>MATERIAL</p>
                <p style={{ ...TYPOGRAPHY.body, color: COLORS.primary }}>{listing.attributes.material}</p>
              </div>
            )}
            {listing.attributes?.brand && (
              <div>
                <p style={{ ...TYPOGRAPHY.small, color: COLORS.tertiary, marginBottom: 4 }}>BREND</p>
                <p style={{ ...TYPOGRAPHY.body, color: COLORS.primary }}>{listing.attributes.brand}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SELLER — Trust and connection
      ═══════════════════════════════════════════════════════════════ */}
      {listing.seller && (
        <section style={{ 
          padding: SPACING.lg,
          background: COLORS.surface,
          margin: `0 ${SPACING.lg}`,
          borderRadius: RADIUS.xl,
        }}>
          <Link
            to={`/profile/${listing.seller.telegram_user_id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: RADIUS.lg,
              background: `linear-gradient(135deg, ${COLORS.accent}, #5856D6)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {listing.seller.profile_photo_url ? (
                <img 
                  src={listing.seller.profile_photo_url} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: 'white', fontSize: 22, fontWeight: 600 }}>
                  {listing.seller.first_name?.[0]}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ ...TYPOGRAPHY.headline, color: COLORS.primary }}>
                {listing.seller.first_name} {listing.seller.last_name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, marginTop: 2 }}>
                {listing.seller.rating_average ? (
                  <>
                    <StarIcon style={{ width: 14, height: 14, color: COLORS.gold }} />
                    <span style={{ ...TYPOGRAPHY.caption, color: COLORS.secondary }}>
                      {listing.seller.rating_average.toFixed(1)} · {listing.seller.total_sales || 0} sotuv
                    </span>
                  </>
                ) : (
                  <span style={{ ...TYPOGRAPHY.caption, color: COLORS.warning }}>
                    Yangi sotuvchi
                  </span>
                )}
              </div>
            </div>
            <ChevronRightIcon style={{ width: 20, height: 20, color: COLORS.tertiary }} />
          </Link>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PURCHASE CLAIM & REVIEWS
      ═══════════════════════════════════════════════════════════════ */}
      {!isOwn && user && (
        <section style={{ padding: `${SPACING.lg} ${SPACING.lg}` }}>
          <PurchaseClaimButton
            listingId={listing.listing_id}
            buyerTelegramId={user.telegram_user_id}
            selectedSize={selectedSize || undefined}
            selectedColor={selectedColor || undefined}
            onClaimApproved={() => setHasVerifiedPurchase(true)}
            onWriteReview={() => setShowReviewModal(true)}
          />
        </section>
      )}

      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <section style={{ 
          padding: SPACING.lg,
          background: COLORS.surface,
          margin: `0 ${SPACING.lg} ${SPACING.lg}`,
          borderRadius: RADIUS.xl,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}>
            <h2 style={{ ...TYPOGRAPHY.headline, color: COLORS.primary }}>
              Sharxlar
            </h2>
            <span style={{ ...TYPOGRAPHY.caption, color: COLORS.accent }}>
              Barchasini ko'rish →
            </span>
          </div>
          
          {/* Latest Review */}
          <div style={{
            padding: SPACING.md,
            background: COLORS.canvas,
            borderRadius: RADIUS.lg,
          }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: SPACING.xs }}>
              {[1,2,3,4,5].map(i => (
                <StarIcon 
                  key={i}
                  style={{ 
                    width: 14, 
                    height: 14, 
                    color: i <= reviews[0].rating ? COLORS.gold : '#E5E5EA'
                  }} 
                />
              ))}
            </div>
            <p style={{ 
              ...TYPOGRAPHY.body, 
              color: COLORS.secondary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {reviews[0].review_text || 'Ajoyib mahsulot!'}
            </p>
            <p style={{ ...TYPOGRAPHY.caption, color: COLORS.tertiary, marginTop: SPACING.xs }}>
              — {reviews[0].reviewer?.first_name || 'Foydalanuvchi'}
            </p>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ACTION BAR — The moment of decision
      ═══════════════════════════════════════════════════════════════ */}
      {!isOwn && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: `${COLORS.surface}F5`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${COLORS.surfaceHover}`,
          padding: `${SPACING.md} ${SPACING.lg}`,
          paddingBottom: `calc(${SPACING.md} + env(safe-area-inset-bottom, 0px))`,
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex',
            gap: SPACING.sm,
            maxWidth: 500,
            margin: '0 auto',
          }}>
            {/* Message Seller */}
            <button
              onClick={contactSeller}
              style={{
                width: 56,
                height: 56,
                borderRadius: RADIUS.lg,
                border: `2px solid ${COLORS.accent}`,
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <PaperAirplaneIcon style={{ width: 24, height: 24, color: COLORS.accent }} />
            </button>
            
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              style={{
                flex: 1,
                height: 56,
                borderRadius: RADIUS.lg,
                border: 'none',
                background: addedToCart ? COLORS.success : COLORS.accent,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.sm,
                cursor: isAddingToCart ? 'wait' : 'pointer',
                ...TYPOGRAPHY.headline,
                transition: 'all 0.3s ease',
              }}
            >
              {isAddingToCart ? (
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              ) : addedToCart ? (
                <>
                  <CheckIcon style={{ width: 22, height: 22 }} />
                  Qo'shildi!
                </>
              ) : (
                "Savatga qo'shish"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <WriteReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async (data) => {
          if (!id || !user?.telegram_user_id) return
          const newReview = await createReview(
            id, user.telegram_user_id, data.rating, data.text, data.photos,
            selectedSize || undefined, selectedColor || undefined
          )
          if (newReview) {
            setReviews(prev => [newReview, ...prev])
            setCanReview(false)
          }
        }}
        listingTitle={listing.title}
        listingPhoto={photos[0]}
        purchasedSize={selectedSize || undefined}
        purchasedColor={selectedColor || undefined}
      />

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
        button:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  )
}

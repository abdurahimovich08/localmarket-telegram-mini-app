/**
 * Unified Listing Platform
 * 
 * Core abstraction: All entities (services, products, store products) 
 * are treated as "Listings" with a type field
 * 
 * This allows:
 * - Unified analytics
 * - Unified dashboard
 * - Unified search with tags
 * - Unified health scores
 * - Unified UI components
 */

import type { ServiceTag, Listing, Service } from './index'

/**
 * Listing types supported by the platform
 */
export type ListingType = 'service' | 'product' | 'store_product'

/**
 * Unified Product interface for UI components
 * 
 * All entities (services, products, store products) can be displayed
 * using this unified interface
 */
export interface UnifiedProduct {
  // Identification
  id: string
  type: ListingType
  
  // Common display fields
  title: string
  description?: string
  category: string
  categoryEmoji?: string
  
  // Pricing
  price?: number
  oldPrice?: number // For promotions
  priceText?: string // Formatted price
  isFree?: boolean
  priceType?: 'fixed' | 'hourly' | 'negotiable'
  
  // Images
  imageUrl?: string
  imageUrls?: string[] // Multiple images
  
  // Status & Metadata
  status: 'active' | 'inactive' | 'deleted' | 'sold'
  isBoosted?: boolean
  stockQty?: number | null // For store products
  
  // Location
  neighborhood?: string
  distance?: number
  
  // Owner
  ownerId: number
  ownerName?: string
  
  // Store (if applicable)
  storeId?: string
  storeName?: string
  
  // Timestamps
  createdAt: string
  updatedAt?: string
  
  // Metrics
  viewCount?: number
  favoriteCount?: number
  
  // Navigation
  detailUrl: string // URL to detail page
  
  // Original entity reference (for adapter pattern)
  original?: Listing | Service
}

/**
 * Unified Listing interface (for analytics and backend)
 * 
 * All entities (services, products, store products) implement this interface
 * through adapters, allowing unified operations
 */
export interface UnifiedListing {
  listing_id: string
  type: ListingType
  owner_telegram_id: number // provider_telegram_id / seller_telegram_id
  
  // Common fields
  title: string
  description: string
  category: string
  tags: ServiceTag[] // Unified tag system
  status: 'active' | 'inactive' | 'deleted' | 'paused'
  
  // Metrics (populated from analytics)
  view_count?: number
  contact_count?: number
  order_count?: number
  
  // Timestamps
  created_at: string
  updated_at?: string
  
  // Type-specific fields (optional, populated by adapters)
  price?: string
  price_type?: 'fixed' | 'hourly' | 'negotiable'
  image_url?: string
  logo_url?: string
  
  // Original entity reference (for adapter pattern)
  original_id?: string
  original_type?: 'service' | 'listing' | 'store_product'
}

/**
 * Listing interaction types
 * Unified across all listing types
 */
export type ListingInteractionType = 'view' | 'click' | 'contact' | 'order'

/**
 * Health Score calculation rules per listing type
 */
export interface HealthScoreRules {
  // Which interaction types count as "conversion"
  conversionTypes: ListingInteractionType[]
  // Whether contact rate matters
  usesContactRate: boolean
  // Default weights for this type
  weights: {
    conversion: number
    engagement: number
    completeness: number
    ranking: number
  }
}

/**
 * Health score rules per listing type
 */
export const LISTING_TYPE_HEALTH_RULES: Record<ListingType, HealthScoreRules> = {
  service: {
    conversionTypes: ['contact', 'order'],
    usesContactRate: true, // Contact → Order matters
    weights: {
      conversion: 30,
      engagement: 30,
      completeness: 20,
      ranking: 20,
    },
  },
  product: {
    conversionTypes: ['order'], // Direct order, no contact step
    usesContactRate: false,
    weights: {
      conversion: 35,
      engagement: 25,
      completeness: 20,
      ranking: 20,
    },
  },
  store_product: {
    conversionTypes: ['order'], // Direct order
    usesContactRate: false,
    weights: {
      conversion: 35,
      engagement: 25,
      completeness: 20,
      ranking: 20,
    },
  },
}

/**
 * Convert Listing to UnifiedProduct
 */
export const listingToUnifiedProduct = (listing: Listing): UnifiedProduct => {
  const category = listing.category
  const categoryEmoji = listing.category ? 
    (listing.category === 'electronics' ? '📱' :
     listing.category === 'furniture' ? '🪑' :
     listing.category === 'clothing' ? '👕' :
     listing.category === 'baby_kids' ? '👶' :
     listing.category === 'home_garden' ? '🏠' :
     listing.category === 'games_hobbies' ? '🎮' :
     listing.category === 'books_media' ? '📚' :
     listing.category === 'sports_outdoors' ? '🏋️' :
     listing.category === 'automotive' ? '🚗' : '🎁') : undefined

  return {
    id: listing.listing_id,
    type: listing.store_id ? 'store_product' : 'product',
    title: listing.title,
    description: listing.description,
    category: listing.category,
    categoryEmoji,
    price: listing.price,
    oldPrice: listing.old_price,
    priceText: listing.is_free ? 'Bepul' : `${listing.price?.toLocaleString()} so'm`,
    isFree: listing.is_free,
    imageUrl: listing.photos?.[0],
    imageUrls: listing.photos,
    status: listing.status,
    isBoosted: listing.is_boosted,
    stockQty: listing.stock_qty,
    neighborhood: listing.neighborhood,
    distance: listing.distance,
    ownerId: listing.seller_telegram_id,
    ownerName: listing.seller?.first_name,
    storeId: listing.store_id,
    storeName: listing.store?.name,
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
    viewCount: listing.view_count,
    favoriteCount: listing.favorite_count,
    detailUrl: `/listing/${listing.listing_id}`,
    original: listing,
  }
}

/**
 * Convert Service to UnifiedProduct
 */
export const serviceToUnifiedProduct = (service: Service): UnifiedProduct => {
  return {
    id: service.service_id,
    type: 'service',
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price ? parseFloat(service.price) : undefined,
    priceText: service.price || 'Kelishiladi',
    priceType: service.price_type,
    imageUrl: service.logo_url || service.image_url,
    status: service.status === 'active' ? 'active' : 'inactive',
    ownerId: service.provider_telegram_id,
    ownerName: service.provider?.first_name,
    createdAt: service.created_at,
    updatedAt: service.updated_at,
    viewCount: service.view_count,
    detailUrl: `/service/${service.service_id}`,
    original: service,
  }
}

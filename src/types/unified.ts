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
 * @deprecated Use CardAdapters.listingToUnifiedProduct instead
 */
export const listingToUnifiedProduct = (listing: Listing): UnifiedProduct => {
  // Re-export from adapters for backward compatibility
  const { listingToUnifiedProduct: adapter } = require('../components/cards/CardAdapters')
  return adapter(listing)
}

/**
 * Convert Service to UnifiedProduct
 * @deprecated Use CardAdapters.serviceToUnifiedProduct instead
 */
export const serviceToUnifiedProduct = (service: Service): UnifiedProduct => {
  // Re-export from adapters for backward compatibility
  const { serviceToUnifiedProduct: adapter } = require('../components/cards/CardAdapters')
  return adapter(service)
}

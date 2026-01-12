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
 */

import type { ServiceTag } from './index'

/**
 * Listing types supported by the platform
 */
export type ListingType = 'service' | 'product' | 'store_product'

/**
 * Unified Listing interface
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

/**
 * Unified Listing Adapter
 * 
 * Converts different entity types (services, products, store products)
 * into UnifiedListing format for unified operations
 */

import type { Service, Listing as ProductListing, Store } from '../types'
import type { UnifiedListing, ListingType } from '../types/unified'
import { ServiceTag } from '../types'

/**
 * Convert Service to UnifiedListing
 */
export function serviceToUnifiedListing(service: Service): UnifiedListing {
  // Extract tags (handle both string[] and ServiceTag[])
  const tags: ServiceTag[] = service.tags?.map((tag) => {
    if (typeof tag === 'string') {
      return {
        value: tag,
        weight: 0.7, // Default weight
        source: 'user',
      }
    }
    return tag
  }) || []

  return {
    listing_id: service.service_id,
    type: 'service',
    owner_telegram_id: service.provider_telegram_id,
    title: service.title,
    description: service.description || '',
    category: service.category || '',
    tags,
    status: service.status || 'active',
    view_count: service.view_count || 0,
    created_at: service.created_at || new Date().toISOString(),
    updated_at: service.updated_at,
    price: service.price,
    price_type: service.price_type,
    image_url: service.logo_url || service.image_url,
    logo_url: service.logo_url,
    original_id: service.service_id,
    original_type: 'service',
  }
}

/**
 * Convert Product Listing to UnifiedListing
 */
export function productListingToUnifiedListing(listing: ProductListing): UnifiedListing {
  // Convert string tags to ServiceTag[]
  const tags: ServiceTag[] = (listing.tags || []).map((tag) => ({
    value: tag.toLowerCase(),
    weight: 0.7, // Default weight for user tags
    source: 'user' as const,
  }))

  return {
    listing_id: listing.listing_id,
    type: 'product',
    owner_telegram_id: listing.seller_telegram_id,
    title: listing.title,
    description: listing.description || '',
    category: listing.category || '',
    tags,
    status: listing.status || 'active',
    view_count: listing.view_count || 0,
    created_at: listing.created_at || new Date().toISOString(),
    updated_at: listing.updated_at,
    price: listing.price?.toString() || 'Kelishiladi',
    price_type: 'fixed',
    image_url: listing.photos?.[0],
    original_id: listing.listing_id,
    original_type: 'listing',
  }
}

/**
 * Convert Store Product to UnifiedListing
 * Store products are listings with a store_id field
 */
export function storeProductToUnifiedListing(
  listing: ProductListing, // Store products are regular listings with store_id
  store: { owner_telegram_id: number; store_id: string }
): UnifiedListing {
  // Convert string tags to ServiceTag[] (products don't have tags yet, but prepare for future)
  const tags: ServiceTag[] = (listing.tags || []).map((tag: string) => ({
    value: tag.toLowerCase(),
    weight: 0.7,
    source: 'user' as const,
  }))

  return {
    listing_id: listing.listing_id,
    type: 'store_product',
    owner_telegram_id: store.owner_telegram_id,
    title: listing.title,
    description: listing.description || '',
    category: listing.category || '',
    tags,
    status: listing.status || 'active',
    view_count: listing.view_count || 0,
    created_at: listing.created_at || new Date().toISOString(),
    updated_at: listing.updated_at,
    price: listing.price?.toString() || 'Kelishiladi',
    price_type: 'fixed',
    image_url: listing.photos?.[0],
    original_id: listing.listing_id,
    original_type: 'listing', // Store products are stored in listings table
  }
}

/**
 * Get listing type badge/emoji for UI
 */
export function getListingTypeBadge(type: ListingType): { emoji: string; label: string } {
  switch (type) {
    case 'service':
      return { emoji: '🛠️', label: 'Xizmat' }
    case 'product':
      return { emoji: '👕', label: 'Mahsulot' }
    case 'store_product':
      return { emoji: '🏪', label: "Do'kon" }
    default:
      return { emoji: '📦', label: 'Mahsulot' }
  }
}

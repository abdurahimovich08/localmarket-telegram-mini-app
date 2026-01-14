/**
 * Card Adapters
 * 
 * Adapter pattern for converting different entity types
 * to UnifiedProduct format for UniversalCard
 * 
 * This prevents "variant explosion" in UniversalCard
 */

import type { Listing, Service } from '../../types'
import type { UnifiedProduct } from '../../types/unified'
import { CATEGORIES } from '../../types'

/**
 * Listing to UnifiedProduct Adapter
 */
export function listingToUnifiedProduct(listing: Listing): UnifiedProduct {
  const category = CATEGORIES.find(c => c.value === listing.category)
  
  return {
    id: listing.listing_id,
    type: listing.store_id ? 'store_product' : 'product',
    title: listing.title,
    description: listing.description,
    category: listing.category,
    categoryEmoji: category?.emoji,
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
 * Service to UnifiedProduct Adapter
 */
export function serviceToUnifiedProduct(service: Service): UnifiedProduct {
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
    imageUrls: service.portfolio_images,
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

/**
 * Unified adapter - automatically detects type
 */
export function toUnifiedProduct(entity: Listing | Service): UnifiedProduct {
  if ('listing_id' in entity) {
    return listingToUnifiedProduct(entity as Listing)
  }
  return serviceToUnifiedProduct(entity as Service)
}

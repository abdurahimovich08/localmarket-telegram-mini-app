/**
 * Query Invalidation Strategy
 * 
 * Centralized query invalidation after mutations
 * Prevents stale cache issues
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Invalidate queries after listing mutation
 */
export function invalidateListingQueries(
  queryClient: QueryClient,
  listingId?: string
) {
  // Invalidate all item queries
  queryClient.invalidateQueries({ queryKey: ['unified_items'] })
  
  // Invalidate specific listing
  if (listingId) {
    queryClient.invalidateQueries({ queryKey: ['item', 'listing', listingId] })
  }
  
  // Invalidate user's listings
  queryClient.invalidateQueries({ queryKey: ['my_listings'] })
  queryClient.invalidateQueries({ queryKey: ['myItems'] })
}

/**
 * Invalidate queries after service mutation
 */
export function invalidateServiceQueries(
  queryClient: QueryClient,
  serviceId?: string
) {
  // Invalidate all item queries
  queryClient.invalidateQueries({ queryKey: ['unified_items'] })
  
  // Invalidate specific service
  if (serviceId) {
    queryClient.invalidateQueries({ queryKey: ['item', 'service', serviceId] })
  }
  
  // Invalidate user's services
  queryClient.invalidateQueries({ queryKey: ['my_services'] })
  queryClient.invalidateQueries({ queryKey: ['myItems'] })
}

/**
 * Invalidate queries after store mutation
 */
export function invalidateStoreQueries(
  queryClient: QueryClient,
  storeId?: string
) {
  // Invalidate store queries
  if (storeId) {
    queryClient.invalidateQueries({ queryKey: ['store', storeId] })
    queryClient.invalidateQueries({ queryKey: ['store_categories', storeId] })
    queryClient.invalidateQueries({ queryKey: ['store_posts', storeId] })
    queryClient.invalidateQueries({ queryKey: ['store_products', storeId] })
  }
  
  // Invalidate all stores
  queryClient.invalidateQueries({ queryKey: ['stores'] })
  queryClient.invalidateQueries({ queryKey: ['my_stores'] })
  
  // Invalidate unified items (store products)
  queryClient.invalidateQueries({ queryKey: ['unified_items'] })
}

/**
 * Invalidate queries after store post reorder
 */
export function invalidateStorePostQueries(
  queryClient: QueryClient,
  storeId: string
) {
  queryClient.invalidateQueries({ queryKey: ['store_posts', storeId] })
  queryClient.invalidateQueries({ queryKey: ['store', storeId] })
}

/**
 * Invalidate queries after store category mutation
 */
export function invalidateStoreCategoryQueries(
  queryClient: QueryClient,
  storeId: string
) {
  queryClient.invalidateQueries({ queryKey: ['store_categories', storeId] })
  queryClient.invalidateQueries({ queryKey: ['store_products', storeId] })
  queryClient.invalidateQueries({ queryKey: ['store', storeId] })
}

/**
 * Invalidate all queries (use sparingly)
 */
export function invalidateAllQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries()
}

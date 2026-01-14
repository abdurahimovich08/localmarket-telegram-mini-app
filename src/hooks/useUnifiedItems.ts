/**
 * useUnifiedItems Hook
 * 
 * React Query hook for fetching unified items from unified_items VIEW
 * 
 * This hook uses the unified_items VIEW for read operations,
 * while mutations still go to individual tables via useEntityMutations
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { UnifiedProduct } from '../types/unified'
import { listingToUnifiedProduct, serviceToUnifiedProduct } from '../components/cards/CardAdapters'
import type { Listing, Service } from '../types'

interface UseUnifiedItemsOptions {
  searchQuery?: string
  itemType?: 'product' | 'store_product' | 'service'
  category?: string
  minPrice?: number
  maxPrice?: number
  ownerId?: number
  storeId?: string
  limit?: number
  enabled?: boolean
}

/**
 * Fetch unified items using the unified_items VIEW
 */
async function fetchUnifiedItems(options: UseUnifiedItemsOptions = {}): Promise<UnifiedProduct[]> {
  const {
    searchQuery,
    itemType,
    category,
    minPrice,
    maxPrice,
    ownerId,
    storeId,
    limit = 50,
  } = options

  // Use search_unified_items function if available
  try {
    const { data, error } = await supabase.rpc('search_unified_items', {
      search_query: searchQuery || null,
      item_type_filter: itemType || null,
      category_filter: category || null,
      min_price: minPrice || null,
      max_price: maxPrice || null,
      owner_id_filter: ownerId || null,
      store_id_filter: storeId || null,
      limit_count: limit,
    })

    if (error) {
      console.error('Error fetching unified items:', error)
      // Fallback to direct table queries
      return fetchUnifiedItemsFallback(options)
    }

    // Convert VIEW results to UnifiedProduct format
    // Note: VIEW returns different structure, need to map
    return (data || []).map((item: any) => {
      // Map VIEW columns to UnifiedProduct
      return {
        id: item.item_id,
        type: item.item_type as 'product' | 'store_product' | 'service',
        title: item.title,
        description: item.description || '',
        category: item.category,
        price: item.price,
        priceType: item.price_type,
        priceText: item.price ? `${item.price.toLocaleString()} so'm` : 'Kelishiladi',
        imageUrl: item.image_url,
        status: item.status,
        ownerId: item.owner_id,
        storeId: item.store_id,
        createdAt: item.created_at,
        viewCount: item.view_count || 0,
        favoriteCount: item.favorite_count || 0,
        detailUrl: item.item_type === 'service' 
          ? `/service/${item.item_id}`
          : `/listing/${item.item_id}`,
      } as UnifiedProduct
    })
  } catch (error) {
    console.error('Error in search_unified_items:', error)
    return fetchUnifiedItemsFallback(options)
  }
}

/**
 * Fallback: Fetch from individual tables
 * Used when VIEW or RPC function is not available
 */
async function fetchUnifiedItemsFallback(options: UseUnifiedItemsOptions = {}): Promise<UnifiedProduct[]> {
  const { itemType, storeId, limit = 50 } = options
  const results: UnifiedProduct[] = []

  // Fetch listings (products or store_products)
  if (!itemType || itemType === 'product' || itemType === 'store_product') {
    let query = supabase
      .from('listings')
      .select('*, seller:users(telegram_user_id, username, first_name, profile_photo_url), store:stores(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemType === 'product') {
      query = query.is('store_id', null)
    } else if (itemType === 'store_product' || storeId) {
      query = query.not('store_id', 'is', null)
      if (storeId) {
        query = query.eq('store_id', storeId)
      }
    }

    const { data: listings, error } = await query

    if (!error && listings) {
      listings.forEach(listing => {
        results.push(listingToUnifiedProduct(listing as Listing))
      })
    }
  }

  // Fetch services
  if (!itemType || itemType === 'service') {
    const { data: services, error } = await supabase
      .from('services')
      .select('*, provider:users(telegram_user_id, username, first_name, profile_photo_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && services) {
      services.forEach(service => {
        results.push(serviceToUnifiedProduct(service as Service))
      })
    }
  }

  // Sort by created_at
  results.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return results.slice(0, limit)
}

/**
 * React Query hook for unified items
 */
export function useUnifiedItems(options: UseUnifiedItemsOptions = {}) {
  const {
    searchQuery,
    itemType,
    category,
    minPrice,
    maxPrice,
    ownerId,
    storeId,
    limit,
    enabled = true,
  } = options

  return useQuery({
    queryKey: ['unified_items', searchQuery, itemType, category, minPrice, maxPrice, ownerId, storeId, limit],
    queryFn: () => fetchUnifiedItems(options),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 daqiqa
    gcTime: 10 * 60 * 1000, // 10 daqiqa
  })
}

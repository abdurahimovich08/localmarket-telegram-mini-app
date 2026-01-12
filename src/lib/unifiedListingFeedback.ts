/**
 * Unified Listing Feedback Loop
 * 
 * Tracks interactions for all listing types (services, products, store products)
 * Replaces service-specific tracking with unified system
 */

import { supabase } from './supabase'
import type { UnifiedListing, ListingType, ListingInteractionType } from '../types/unified'

export interface UnifiedTagConversionMetrics {
  tag: string
  listing_type: ListingType
  view_count: number
  click_count: number
  contact_count: number
  order_count: number
  click_through_rate: number
  contact_rate: number
  conversion_rate: number
  last_used: string
}

/**
 * Track listing interaction (unified across all types)
 */
export async function trackListingInteraction(
  listingId: string,
  listingType: ListingType,
  userTelegramId: number,
  interactionType: ListingInteractionType,
  matchedTags?: string[],
  searchQuery?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_interactions')
      .insert({
        listing_id: listingId,
        listing_type: listingType,
        user_telegram_id: userTelegramId,
        interaction_type: interactionType,
        matched_tags: matchedTags || [],
        search_query: searchQuery || null,
      })

    if (error) {
      console.error('Error tracking listing interaction:', error)
      // Don't throw - tracking is non-critical
    }
  } catch (error) {
    console.error('Error calling trackListingInteraction:', error)
    // Don't throw - tracking is non-critical
  }
}

/**
 * Get unified tag conversion metrics
 */
export async function getUnifiedTagConversionMetrics(
  tags: string[],
  listingType?: ListingType
): Promise<Map<string, UnifiedTagConversionMetrics>> {
  if (!tags || tags.length === 0) {
    return new Map()
  }

  try {
    let query = supabase
      .from('unified_tag_conversion_metrics')
      .select('*')
      .in('tag', tags)

    if (listingType) {
      query = query.eq('listing_type', listingType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching unified tag conversion metrics:', error)
      return new Map()
    }

    const metricsMap = new Map<string, UnifiedTagConversionMetrics>()
    for (const metric of data || []) {
      const key = listingType ? metric.tag : `${metric.tag}_${metric.listing_type}`
      metricsMap.set(key, metric)
    }

    return metricsMap
  } catch (error) {
    console.error('Error calling getUnifiedTagConversionMetrics:', error)
    return new Map()
  }
}

/**
 * Get all listings for a user (unified)
 * Phase 2: Includes services and products
 * Phase 3: Will include store products
 */
export async function getUserUnifiedListings(
  userTelegramId: number
): Promise<UnifiedListing[]> {
  try {
    // Get services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('provider_telegram_id', userTelegramId)
      .eq('status', 'active')

    if (servicesError) {
      console.error('Error fetching user services:', servicesError)
    }

    // Get products (listings)
    const { data: products, error: productsError } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_telegram_id', userTelegramId)
      .eq('status', 'active')

    if (productsError) {
      console.error('Error fetching user products:', productsError)
    }

    // Convert to unified listings
    const { serviceToUnifiedListing, productListingToUnifiedListing } = await import('./unifiedListing')
    
    const unifiedServices = (services || []).map(serviceToUnifiedListing)
    const unifiedProducts = (products || []).map(productListingToUnifiedListing)
    
    // Combine and sort by created_at (newest first)
    const allListings = [...unifiedServices, ...unifiedProducts].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return allListings
  } catch (error) {
    console.error('Error getting user unified listings:', error)
    return []
  }
}

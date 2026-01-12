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
 * Phase 1: Only returns services
 * Phase 2: Will include products
 * Phase 3: Will include store products
 */
export async function getUserUnifiedListings(
  userTelegramId: number
): Promise<UnifiedListing[]> {
  // Phase 1: Only services
  // TODO: Phase 2 - Add products
  // TODO: Phase 3 - Add store products
  
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_telegram_id', userTelegramId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching user services:', error)
      return []
    }

    // Convert to unified listings
    const { serviceToUnifiedListing } = await import('./unifiedListing')
    return (services || []).map(serviceToUnifiedListing)
  } catch (error) {
    console.error('Error getting user unified listings:', error)
    return []
  }
}

/**
 * Unified Search System (Phase 3)
 * 
 * Tag-based search for all listing types (services, products, store products)
 * Uses existing tag search infrastructure and extends it to all types
 */

import type { UnifiedListing, ListingType } from '../types/unified'
import { getUserUnifiedListings, trackListingInteraction } from './unifiedListingFeedback'
import { searchServicesByTags } from './tagSearch'
import { supabase } from './supabase'
import { serviceToUnifiedListing, productListingToUnifiedListing, storeProductToUnifiedListing } from './unifiedListing'
import type { Service } from '../types'
import type { Listing as ProductListing } from '../types'
import { extractTagsFromQuery } from './tagSearch'

export interface UnifiedSearchResult {
  listing: UnifiedListing
  score: number
  explanation?: string[]
}

/**
 * Search all listing types by tags (unified)
 */
export async function unifiedSearchByTags(
  queryTags: string[],
  limit: number = 20,
  userTelegramId?: number
): Promise<UnifiedSearchResult[]> {
  try {
    // Get all services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')

    if (servicesError) {
      console.error('Error fetching services for search:', servicesError)
    }

    // Get all products (non-store products)
    const { data: products, error: productsError } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .is('store_id', null) // Only non-store products

    if (productsError) {
      console.error('Error fetching products for search:', productsError)
    }

    // Get all store products (listings with store_id)
    const { data: storeProducts, error: storeProductsError } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .not('store_id', 'is', null) // Only store products

    if (storeProductsError) {
      console.error('Error fetching store products for search:', storeProductsError)
    }

    // Get stores for store products
    const storeProductListings = storeProducts || []
    const storeIds = [...new Set(storeProductListings.map((p: any) => p.store_id).filter(Boolean))]
    const { data: stores } = await supabase
      .from('stores')
      .select('store_id, owner_telegram_id')
      .in('store_id', storeIds)

    const storesMap = new Map((stores || []).map((s: any) => [s.store_id, s]))

    // Convert to unified listings
    const unifiedServices = (services || []).map(serviceToUnifiedListing)
    const unifiedProducts = (products || []).map(productListingToUnifiedListing)
    const unifiedStoreProducts = storeProductListings.map((p: any) => {
      const store = storesMap.get(p.store_id)
      if (store) {
        return storeProductToUnifiedListing(p, store)
      }
      return null
    }).filter(Boolean) as UnifiedListing[]

    // Combine all listings
    const allListings = [...unifiedServices, ...unifiedProducts, ...unifiedStoreProducts]

    // Score and rank using tag-based algorithm
    const scoredResults = await scoreListingsByTags(allListings, queryTags, userTelegramId)

    // Sort by score (highest first)
    scoredResults.sort((a, b) => b.score - a.score)

    // Return top results
    return scoredResults.slice(0, limit)
  } catch (error) {
    console.error('Error in unified search:', error)
    return []
  }
}

/**
 * Score listings by tag matches
 */
async function scoreListingsByTags(
  listings: UnifiedListing[],
  queryTags: string[],
  userTelegramId?: number
): Promise<UnifiedSearchResult[]> {
  const results: UnifiedSearchResult[] = []

  for (const listing of listings) {
    const listingTags = listing.tags.map(t => t.value.toLowerCase())
    const queryTagsLower = queryTags.map(t => t.toLowerCase())

    // Calculate match score
    let score = 0
    const explanations: string[] = []

    // Exact tag matches (highest score)
    for (const queryTag of queryTagsLower) {
      if (listingTags.includes(queryTag)) {
        const tagWeight = listing.tags.find(t => t.value.toLowerCase() === queryTag)?.weight || 0.7
        score += 100 * tagWeight
        explanations.push(`Exact tag: ${queryTag}`)
      }
    }

    // Partial matches (lower score)
    for (const queryTag of queryTagsLower) {
      if (!listingTags.includes(queryTag)) {
        const partialMatches = listingTags.filter(t => t.includes(queryTag) || queryTag.includes(t))
        if (partialMatches.length > 0) {
          score += 20 * partialMatches.length
          explanations.push(`Partial match: ${queryTag}`)
        }
      }
    }

    // Title/description matches (lower score)
    const titleLower = listing.title.toLowerCase()
    const descLower = listing.description.toLowerCase()
    for (const queryTag of queryTagsLower) {
      if (titleLower.includes(queryTag)) {
        score += 30
        explanations.push(`Title match: ${queryTag}`)
      } else if (descLower.includes(queryTag)) {
        score += 10
        explanations.push(`Description match: ${queryTag}`)
      }
    }

    // Only include listings with some match
    if (score > 0) {
      results.push({
        listing,
        score,
        explanation: explanations.slice(0, 3), // Top 3 explanations
      })
    }
  }

  return results
}

/**
 * Unified search by query string (extracts tags and searches)
 */
export async function unifiedSearchByQuery(
  query: string,
  limit: number = 20,
  userTelegramId?: number
): Promise<UnifiedSearchResult[]> {
  // Extract tags from query
  const queryTags = extractTagsFromQuery(query)

  if (queryTags.length === 0) {
    // Fallback: use query as single tag
    return unifiedSearchByTags([query.toLowerCase()], limit, userTelegramId)
  }

  return unifiedSearchByTags(queryTags, limit, userTelegramId)
}

/**
 * Track unified search interaction
 */
export async function trackUnifiedSearchInteraction(
  listingId: string,
  listingType: ListingType,
  userTelegramId: number,
  interactionType: 'view' | 'click' | 'contact' | 'order',
  matchedTags: string[],
  searchQuery?: string
): Promise<void> {
  await trackListingInteraction(
    listingId,
    listingType,
    userTelegramId,
    interactionType,
    matchedTags,
    searchQuery
  )
}

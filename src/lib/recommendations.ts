/**
 * Advanced Recommendation Engine
 * Combines search history, view history, and interactions for personalized recommendations
 */

import type { Listing } from '../types'
import { supabase } from './supabase'
import { normalizeText } from './transliteration'
import { buildSearchVariations } from './searchAlgorithms'

/**
 * Get user's search keywords with frequency
 */
export const getUserSearchKeywords = async (
  userTelegramId: number,
  days: number = 30
): Promise<Array<{ keyword: string; frequency: number; recent: boolean }>> => {
  try {
    const { data, error } = await supabase
      .from('user_searches')
      .select('search_query, created_at')
      .eq('user_telegram_id', userTelegramId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching search keywords:', error)
      return []
    }

    // Count keyword frequency
    const keywordMap = new Map<string, { frequency: number; recent: boolean }>()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    data?.forEach((search) => {
      const keyword = search.search_query.toLowerCase().trim()
      const isRecent = new Date(search.created_at).getTime() > sevenDaysAgo
      
      if (keywordMap.has(keyword)) {
        const existing = keywordMap.get(keyword)!
        existing.frequency += 1
        existing.recent = existing.recent || isRecent
      } else {
        keywordMap.set(keyword, { frequency: 1, recent: isRecent })
      }
    })

    // Convert to array and sort by frequency and recency
    return Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => {
        // Recent searches first
        if (a.recent && !b.recent) return -1
        if (!a.recent && b.recent) return 1
        // Then by frequency
        return b.frequency - a.frequency
      })
  } catch (error) {
    console.error('Error getting search keywords:', error)
    return []
  }
}

/**
 * Get user's viewed listings (recent views)
 */
export const getUserViewedListings = async (
  userTelegramId: number,
  limit: number = 20
): Promise<Array<{ listing_id: string; category: string; title: string; keywords: string[] }>> => {
  try {
    const { data, error } = await supabase
      .from('user_listing_interactions')
      .select('listing_id, created_at, listing:listings(category, title, description)')
      .eq('user_telegram_id', userTelegramId)
      .eq('interaction_type', 'view')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching viewed listings:', error)
      return []
    }

    return (data || [])
      .filter((item: any) => item.listing)
      .map((item: any) => {
        const listing = item.listing
        const text = `${listing.title} ${listing.description || ''}`.toLowerCase()
        const keywords = normalizeText(text)
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 10)

        return {
          listing_id: item.listing_id,
          category: listing.category,
          title: listing.title,
          keywords
        }
      })
  } catch (error) {
    console.error('Error getting viewed listings:', error)
    return []
  }
}

/**
 * Calculate search-based relevance score
 */
const calculateSearchRelevance = (
  listing: Listing,
  searchKeywords: Array<{ keyword: string; frequency: number; recent: boolean }>
): number => {
  let score = 0
  const listingText = `${listing.title} ${listing.description}`.toLowerCase()
  const normalizedText = normalizeText(listingText)

  searchKeywords.forEach(({ keyword, frequency, recent }) => {
    const variations = buildSearchVariations(keyword)
    
    variations.forEach(variation => {
      const varLower = normalizeText(variation)
      
      if (normalizedText.includes(varLower)) {
        // Title match (higher score)
        if (normalizeText(listing.title).includes(varLower)) {
          score += (recent ? 50 : 30) * frequency
        }
        // Description match
        else {
          score += (recent ? 20 : 10) * frequency
        }
      }
    })
  })

  return score
}

/**
 * Calculate view-based relevance score
 */
const calculateViewRelevance = (
  listing: Listing,
  viewedListings: Array<{ listing_id: string; category: string; keywords: string[] }>
): number => {
  let score = 0
  const listingText = `${listing.title} ${listing.description}`.toLowerCase()
  const normalizedText = normalizeText(listingText)

  viewedListings.forEach((viewed) => {
    // Same category match
    if (viewed.category === listing.category) {
      score += 30
    }

    // Keyword overlap
    const matchingKeywords = viewed.keywords.filter(keyword =>
      normalizedText.includes(normalizeText(keyword))
    )
    score += matchingKeywords.length * 10

    // Same listing (exclude from recommendations)
    if (viewed.listing_id === listing.listing_id) {
      score = -1000 // Strong penalty
    }
  })

  return score
}

/**
 * Get search-based recommendations
 */
export const getSearchBasedRecommendations = async (
  listings: Listing[],
  userTelegramId: number
): Promise<Listing[]> => {
  const searchKeywords = await getUserSearchKeywords(userTelegramId, 30)
  
  if (searchKeywords.length === 0) {
    return listings.slice(0, 20) // Return default if no search history
  }

  // Score listings based on search history
  const scored = listings.map(listing => ({
    listing,
    score: calculateSearchRelevance(listing, searchKeywords)
  }))

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score)

  // Return top 20
  return scored
    .filter(item => item.score > 0) // Only listings with some relevance
    .slice(0, 20)
    .map(item => item.listing)
}

/**
 * Get view-based recommendations
 */
export const getViewBasedRecommendations = async (
  listings: Listing[],
  userTelegramId: number
): Promise<Listing[]> => {
  const viewedListings = await getUserViewedListings(userTelegramId, 20)
  
  if (viewedListings.length === 0) {
    return listings.slice(0, 20) // Return default if no view history
  }

  // Score listings based on view history
  const scored = listings.map(listing => ({
    listing,
    score: calculateViewRelevance(listing, viewedListings)
  }))

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score)

  // Return top 20
  return scored
    .filter(item => item.score > 0) // Only listings with some relevance
    .slice(0, 20)
    .map(item => item.listing)
}

/**
 * Get similar listings based on a reference listing
 */
export const getSimilarListings = async (
  referenceListing: Listing,
  allListings: Listing[],
  limit: number = 6
): Promise<Listing[]> => {
  // Extract keywords from reference listing
  const refText = `${referenceListing.title} ${referenceListing.description}`.toLowerCase()
  const refKeywords = normalizeText(refText)
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 15)

  const refCategory = referenceListing.category
  const refPrice = referenceListing.price || 0
  const priceRange = refPrice * 0.3 // ±30% price range

  // Score similar listings
  const scored = allListings
    .filter(listing => listing.listing_id !== referenceListing.listing_id) // Exclude self
    .filter(listing => listing.status === 'active') // Only active
    .map(listing => {
      let score = 0
      const listingText = `${listing.title} ${listing.description}`.toLowerCase()
      const normalizedText = normalizeText(listingText)

      // Category match (30 points)
      if (listing.category === refCategory) {
        score += 30
      }

      // Keyword overlap (40 points max)
      const matchingKeywords = refKeywords.filter(keyword =>
        normalizedText.includes(normalizeText(keyword))
      )
      score += Math.min(matchingKeywords.length * 5, 40)

      // Price range match (20 points)
      if (listing.price) {
        const priceDiff = Math.abs(listing.price - refPrice)
        if (priceDiff <= priceRange) {
          score += 20
        } else {
          // Penalize if price is very different
          score -= Math.min(priceDiff / refPrice, 10)
        }
      }

      // Title similarity (10 points)
      if (normalizedText.includes(normalizeText(referenceListing.title).split(' ')[0])) {
        score += 10
      }

      return { listing, score }
    })

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score)

  // Return top similar listings
  return scored
    .filter(item => item.score > 0)
    .slice(0, limit)
    .map(item => item.listing)
}

/**
 * Enhanced personalized listings (combines search + view + interactions)
 */
export const getEnhancedPersonalizedListings = async (
  listings: Listing[],
  userTelegramId: number | undefined,
  limit: number = 20
): Promise<Listing[]> => {
  if (!userTelegramId) {
    // No personalization for non-logged-in users
    return listings.slice(0, limit)
  }

  // Get different recommendation sets
  const [searchBased, viewBased] = await Promise.all([
    getSearchBasedRecommendations(listings, userTelegramId),
    getViewBasedRecommendations(listings, userTelegramId)
  ])

  // Combine and deduplicate
  const combined = new Map<string, { listing: Listing; score: number }>()
  
  // Search-based (50% weight)
  searchBased.forEach((listing, index) => {
    const score = (searchBased.length - index) * 50 / searchBased.length
    combined.set(listing.listing_id, {
      listing,
      score: (combined.get(listing.listing_id)?.score || 0) + score
    })
  })

  // View-based (30% weight)
  viewBased.forEach((listing, index) => {
    const score = (viewBased.length - index) * 30 / viewBased.length
    combined.set(listing.listing_id, {
      listing,
      score: (combined.get(listing.listing_id)?.score || 0) + score
    })
  })

  // Add other listings with lower scores (20% weight)
  listings.forEach((listing) => {
    if (!combined.has(listing.listing_id)) {
      combined.set(listing.listing_id, {
        listing,
        score: 10 // Base score
      })
    }
  })

  // Sort by combined score
  const sorted = Array.from(combined.values()).sort((a, b) => b.score - a.score)

  // Return top listings
  return sorted.slice(0, limit).map(item => item.listing)
}

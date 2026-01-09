// Advanced sorting and scoring algorithms for listings
import type { Listing } from '../types'
import { getUserCategoryPreferences, getUserRecentSearches } from './tracking'
import { RELATED_CATEGORIES } from './categoryValidation'

export interface ListingScore {
  listing: Listing
  score: number
  boostedScore: number
  popularityScore: number
  relevanceScore: number
  recencyScore: number
  distanceScore: number
}

/**
 * Calculate popularity score based on views and favorites
 */
export const calculatePopularityScore = (listing: Listing): number => {
  const views = listing.view_count || 0
  const favorites = listing.favorite_count || 0
  
  // Normalize scores (max views = 100, max favorites = 100)
  const viewScore = Math.min(views / 10, 100) // 1000 views = 100 points
  const favoriteScore = Math.min(favorites * 10, 100) // 10 favorites = 100 points
  
  return (viewScore * 0.6 + favoriteScore * 0.4) // Views weighted more
}

/**
 * Calculate recency score (newer = higher score)
 */
export const calculateRecencyScore = (listing: Listing): number => {
  const now = Date.now()
  const createdAt = new Date(listing.created_at).getTime()
  const ageInHours = (now - createdAt) / (1000 * 60 * 60)
  
  // Score decreases over time
  // 0-24 hours: 10 points
  // 24-48 hours: 8 points
  // 48-72 hours: 5 points
  // 72+ hours: 2 points
  if (ageInHours < 24) return 10
  if (ageInHours < 48) return 8
  if (ageInHours < 72) return 5
  return 2
}

/**
 * Calculate distance score (closer = higher score)
 */
export const calculateDistanceScore = (distance: number | undefined, maxRadius: number): number => {
  if (!distance) return 0
  
  // Normalize distance: 0 miles = 50 points, maxRadius = 0 points
  const normalized = Math.max(0, 50 * (1 - distance / maxRadius))
  return normalized
}

/**
 * Calculate relevance score based on user preferences
 */
export const calculateRelevanceScore = async (
  listing: Listing,
  userTelegramId: number | undefined,
  userSearches: string[]
): Promise<number> => {
  if (!userTelegramId) return 0
  
  let score = 0
  
  // Category preference score
  const preferences = await getUserCategoryPreferences(userTelegramId)
  const categoryPreference = preferences[listing.category] || 0
  score += Math.min(categoryPreference * 3, 30) // Max 30 points
  
  // Search keyword match
  if (userSearches.length > 0) {
    const listingText = `${listing.title} ${listing.description}`.toLowerCase()
    const matchedSearches = userSearches.filter(search => 
      listingText.includes(search.toLowerCase())
    )
    score += Math.min(matchedSearches.length * 5, 20) // Max 20 points
  }
  
  return score
}

/**
 * Calculate boosted score (active boost = high priority)
 */
export const calculateBoostedScore = (listing: Listing): number => {
  if (!listing.is_boosted) return 0
  
  // Check if boost is still active
  if (listing.boosted_until) {
    const now = new Date()
    const boostEnd = new Date(listing.boosted_until)
    if (boostEnd > now) {
      return 1000 // Very high priority
    }
  }
  
  return 0
}

/**
 * Score a single listing
 */
export const scoreListing = async (
  listing: Listing,
  userTelegramId: number | undefined,
  userSearches: string[],
  maxRadius: number
): Promise<ListingScore> => {
  const boostedScore = calculateBoostedScore(listing)
  const popularityScore = calculatePopularityScore(listing)
  const recencyScore = calculateRecencyScore(listing)
  const distanceScore = calculateDistanceScore(listing.distance, maxRadius)
  const relevanceScore = await calculateRelevanceScore(listing, userTelegramId, userSearches)
  
  // Combined score formula
  const totalScore = 
    boostedScore +           // 0 or 1000 (highest priority)
    (popularityScore * 1.0) + // 0-100
    (relevanceScore * 1.0) +  // 0-50
    (recencyScore * 1.0) +    // 2-10
    distanceScore             // 0-50
  
  return {
    listing,
    score: totalScore,
    boostedScore,
    popularityScore,
    relevanceScore,
    recencyScore,
    distanceScore
  }
}

/**
 * Sort listings with advanced algorithm
 */
export const sortListings = async (
  listings: Listing[],
  userTelegramId: number | undefined,
  maxRadius: number = 10
): Promise<Listing[]> => {
  // Get user search history for relevance
  const userSearches = userTelegramId 
    ? await getUserRecentSearches(userTelegramId, 10)
    : []
  
  // Score all listings
  const scoredListings = await Promise.all(
    listings.map(listing => scoreListing(listing, userTelegramId, userSearches, maxRadius))
  )
  
  // Sort by total score (descending)
  scoredListings.sort((a, b) => b.score - a.score)
  
  // Return sorted listings
  return scoredListings.map(scored => scored.listing)
}

/**
 * Get personalized listings for "Siz uchun" section
 */
export const getPersonalizedListings = async (
  listings: Listing[],
  userTelegramId: number | undefined,
  maxRadius: number = 10,
  limit: number = 20
): Promise<Listing[]> => {
  // Get user preferences
  const preferences = userTelegramId 
    ? await getUserCategoryPreferences(userTelegramId)
    : {}
  
  // Get user search history
  const userSearches = userTelegramId
    ? await getUserRecentSearches(userTelegramId, 10)
    : []
  
  // Score and sort
  const sorted = await sortListings(listings, userTelegramId, maxRadius)
  
  // Boost listings that match user preferences
  const personalized = sorted.map(listing => {
    const categoryScore = preferences[listing.category] || 0
    const listingText = `${listing.title} ${listing.description}`.toLowerCase()
    const searchMatch = userSearches.some(search => 
      listingText.includes(search.toLowerCase())
    )
    
    return {
      listing,
      personalizationBoost: categoryScore > 5 || searchMatch ? 50 : 0
    }
  })
  
  // Re-sort with personalization boost
  personalized.sort((a, b) => {
    const scoreA = a.listing.is_boosted ? 1000 : 0
    const scoreB = b.listing.is_boosted ? 1000 : 0
    return (scoreB + b.personalizationBoost) - (scoreA + a.personalizationBoost)
  })
  
  return personalized.slice(0, limit).map(item => item.listing)
}

/**
 * Get "Kun narxlari" (deals of the day) listings
 */
export const getDealsOfDay = (
  listings: Listing[],
  limit: number = 10
): Listing[] => {
  return listings
    .filter(listing => {
      // Free items or recently created (last 24 hours)
      const isFree = listing.is_free
      const isRecent = new Date(listing.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      const isPopular = (listing.view_count || 0) > 5 || (listing.favorite_count || 0) > 2
      
      return isFree || (isRecent && isPopular)
    })
    .sort((a, b) => {
      // Sort by: free first, then by popularity, then recency
      if (a.is_free && !b.is_free) return -1
      if (!a.is_free && b.is_free) return 1
      
      const popularityA = (a.view_count || 0) + (a.favorite_count || 0) * 2
      const popularityB = (b.view_count || 0) + (b.favorite_count || 0) * 2
      if (popularityB !== popularityA) return popularityB - popularityA
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, limit)
}

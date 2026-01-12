/**
 * Unified Listing Health Score
 * 
 * Calculates health score for all listing types (services, products, store products)
 * Uses type-specific rules for conversion calculation
 */

import type { UnifiedListing, ListingType, HealthScoreRules } from '../types/unified'
import { LISTING_TYPE_HEALTH_RULES } from '../types/unified'
import { supabase } from './supabase'
import { getUnifiedTagConversionMetrics } from './unifiedListingFeedback'

export interface UnifiedHealthScore {
  score: number
  status: 'healthy' | 'needs_improvement' | 'critical'
  factors: {
    conversion: number
    engagement: number
    completeness: number
    ranking: number
  }
  recommendations: string[]
}

/**
 * Get interaction counts for a listing
 */
async function getListingInteractionCounts(
  listingId: string,
  listingType: ListingType
): Promise<{
  views: number
  clicks: number
  contacts: number
  orders: number
}> {
  try {
    const { data, error } = await supabase
      .from('listing_interactions')
      .select('interaction_type')
      .eq('listing_id', listingId)
      .eq('listing_type', listingType)

    if (error) {
      console.error('Error fetching listing interactions:', error)
      return { views: 0, clicks: 0, contacts: 0, orders: 0 }
    }

    const counts = {
      views: 0,
      clicks: 0,
      contacts: 0,
      orders: 0,
    }

    for (const interaction of data || []) {
      switch (interaction.interaction_type) {
        case 'view':
          counts.views++
          break
        case 'click':
          counts.clicks++
          break
        case 'contact':
          counts.contacts++
          break
        case 'order':
          counts.orders++
          break
      }
    }

    return counts
  } catch (error) {
    console.error('Error getting listing interaction counts:', error)
    return { views: 0, clicks: 0, contacts: 0, orders: 0 }
  }
}

/**
 * Calculate health score for a unified listing
 */
export async function calculateUnifiedHealthScore(
  listing: UnifiedListing
): Promise<UnifiedHealthScore> {
  const rules = LISTING_TYPE_HEALTH_RULES[listing.type]
  const factors = {
    conversion: 0,
    engagement: 0,
    completeness: 0,
    ranking: 0,
  }
  const recommendations: string[] = []

  // Get interaction counts
  const interactions = await getListingInteractionCounts(listing.listing_id, listing.type)
  
  // Factor 1: Conversion (30-35 points depending on type)
  const conversionScore = calculateConversionScore(listing, interactions, rules)
  factors.conversion = conversionScore

  // Factor 2: Engagement (25-30 points)
  const engagementScore = calculateEngagementScore(interactions, listing.view_count || 0)
  factors.engagement = engagementScore

  // Factor 3: Completeness (20 points)
  const completenessScore = calculateCompletenessScore(listing)
  factors.completeness = completenessScore

  // Factor 4: Ranking (20 points) - placeholder for now
  const rankingScore = 10 // TODO: Calculate based on search ranking
  factors.ranking = rankingScore

  // Total score
  const totalScore = factors.conversion + factors.engagement + factors.completeness + factors.ranking

  // Generate recommendations
  if (conversionScore < rules.weights.conversion * 0.5) {
    recommendations.push('Konversiya darajasi past - title va taglarni yaxshilang')
  }
  if (listing.tags.length < 3) {
    recommendations.push(`${3 - listing.tags.length} ta tag qo'shing - qidiruv natijalarini yaxshilash`)
  }
  if (!listing.image_url && !listing.logo_url) {
    recommendations.push("Rasm qo'shing - ko'rishlar 2x oshadi")
  }
  if (listing.description.length < 50) {
    recommendations.push('Tavsifni kengaytiring - foydalanuvchilar ishonchi oshadi')
  }

  return {
    score: Math.round(totalScore),
    status: totalScore >= 70 ? 'healthy' : totalScore >= 40 ? 'needs_improvement' : 'critical',
    factors,
    recommendations,
  }
}

/**
 * Calculate conversion score based on listing type
 */
function calculateConversionScore(
  listing: UnifiedListing,
  interactions: { views: number; clicks: number; contacts: number; orders: number },
  rules: HealthScoreRules
): number {
  const maxScore = rules.weights.conversion
  let score = 0

  if (listing.type === 'service') {
    // Service: Contact rate matters
    const clickRate = interactions.views > 0 ? interactions.clicks / interactions.views : 0
    const contactRate = interactions.clicks > 0 ? interactions.contacts / interactions.clicks : 0
    const conversionRate = interactions.contacts > 0 ? interactions.orders / interactions.contacts : 0

    score = (clickRate * 0.3 + contactRate * 0.4 + conversionRate * 0.3) * maxScore
  } else {
    // Product/Store Product: Direct order rate
    const orderRate = interactions.views > 0 ? interactions.orders / interactions.views : 0
    score = orderRate * maxScore
  }

  return Math.min(maxScore, score)
}

/**
 * Calculate engagement score
 */
function calculateEngagementScore(
  interactions: { views: number; clicks: number; contacts: number; orders: number },
  viewCount: number
): number {
  const maxScore = 30 // Default for services, adjusted for others
  if (viewCount === 0) return 0

  // Click-through rate
  const ctr = interactions.clicks / viewCount
  // Engagement score based on CTR
  return Math.min(maxScore, ctr * 100)
}

/**
 * Calculate completeness score
 */
function calculateCompletenessScore(listing: UnifiedListing): number {
  const maxScore = 20
  let score = 0

  // Title (5 points)
  if (listing.title.length >= 10) score += 5
  else if (listing.title.length >= 5) score += 3

  // Description (5 points)
  if (listing.description.length >= 100) score += 5
  else if (listing.description.length >= 50) score += 3
  else if (listing.description.length > 0) score += 1

  // Image (5 points)
  if (listing.image_url || listing.logo_url) score += 5

  // Tags (5 points)
  if (listing.tags.length >= 5) score += 5
  else if (listing.tags.length >= 3) score += 3
  else if (listing.tags.length >= 1) score += 1

  return Math.min(maxScore, score)
}

/**
 * Get health score badge (visual indicator)
 */
export function getUnifiedHealthScoreBadge(score: number): {
  emoji: string
  text: string
  bgColor: string
  color: string
} {
  if (score >= 70) {
    return {
      emoji: '🟢',
      text: 'Healthy',
      bgColor: 'bg-green-100',
      color: 'text-green-700',
    }
  } else if (score >= 40) {
    return {
      emoji: '🟡',
      text: 'Needs improvement',
      bgColor: 'bg-yellow-100',
      color: 'text-yellow-700',
    }
  } else {
    return {
      emoji: '🔴',
      text: 'Critical',
      bgColor: 'bg-red-100',
      color: 'text-red-700',
    }
  }
}

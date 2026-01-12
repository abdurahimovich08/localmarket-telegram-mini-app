/**
 * Tag-Based Search Ranking Algorithm
 * 
 * Implements score-based search ranking using tag weights and matching strategies
 * Inspired by: Upwork, Fiverr search algorithms
 */

import type { Service } from '../types'
import { normalizeTag, type ServiceTag, enrichTagsWithWeights } from './tagUtils'

// ============================================
// SEARCH SCORING CONSTANTS
// ============================================

const SCORE_WEIGHTS = {
  EXACT_TAG_MATCH: 5.0,      // Exact tag match (highest priority)
  INTENT_MATCH: 3.0,          // Intent-based match (e.g., "web" matches "web-development")
  PARTIAL_MATCH: 1.0,         // Partial word match
  POPULARITY_BOOST: 0.5,      // Popularity boost (view_count, etc.)
  WEIGHT_MULTIPLIER: 2.0,     // Tag weight multiplier
} as const

// ============================================
// SEARCH RANKING FUNCTIONS
// ============================================

/**
 * Calculate search score for a service based on query tags
 * Returns score and explanation (Priority 1: Search Explainability)
 */
export function calculateServiceSearchScore(
  service: Service,
  queryTags: string[],
  includeExplanation: boolean = false
): number | { score: number; explanation: SearchExplanation[] } {
  if (!service.tags || service.tags.length === 0) {
    return includeExplanation ? { score: 0, explanation: [] } : 0
  }
  if (!queryTags || queryTags.length === 0) {
    return includeExplanation ? { score: 0, explanation: [] } : 0
  }

  // Normalize query tags
  const normalizedQueryTags = queryTags.map(tag => normalizeTag(tag))
  
  // Enrich service tags with weights (if not already enriched)
  const serviceTags: ServiceTag[] = Array.isArray(service.tags) && service.tags.length > 0
    ? (typeof service.tags[0] === 'string'
        ? enrichTagsWithWeights(service.tags as string[], 'user')
        : service.tags as ServiceTag[])
    : []

  let totalScore = 0
  const explanation: SearchExplanation[] = []

  // Score each query tag against service tags
  for (const queryTag of normalizedQueryTags) {
    let bestMatchScore = 0
    let bestMatchType: SearchExplanation['type'] = 'partial_match'
    let bestMatchTag = ''

    for (const serviceTag of serviceTags) {
      const tagValue = typeof serviceTag === 'string' ? serviceTag : serviceTag.value
      const tagWeight = typeof serviceTag === 'string' ? 0.5 : serviceTag.weight
      
      const matchResult = calculateTagMatchScoreWithType(queryTag, tagValue, tagWeight)
      if (matchResult.score > bestMatchScore) {
        bestMatchScore = matchResult.score
        bestMatchType = matchResult.type
        bestMatchTag = tagValue
      }
    }

    totalScore += bestMatchScore

    // Add explanation
    if (includeExplanation && bestMatchScore > 0) {
      explanation.push({
        reason: getExplanationReason(bestMatchType, bestMatchTag, queryTag),
        type: bestMatchType,
        tag: bestMatchTag,
        score: bestMatchScore,
      })
    }
  }

  // Add popularity boost
  const popularityBoost = calculatePopularityBoost(service)
  totalScore += popularityBoost

  if (includeExplanation && popularityBoost > 0) {
    const daysSinceCreation = service.created_at
      ? (Date.now() - new Date(service.created_at).getTime()) / (1000 * 60 * 60 * 24)
      : 999

    if (daysSinceCreation < 7) {
      explanation.push({
        reason: 'Yangi xizmat (7 kundan kam)',
        type: 'cold_start',
        score: popularityBoost,
      })
    } else if (service.view_count > 10) {
      explanation.push({
        reason: `Ko'p ko'rilgan (${service.view_count}+ ko'rish)`,
        type: 'popularity',
        score: popularityBoost,
      })
    }
  }

  return includeExplanation ? { score: totalScore, explanation } : totalScore
}

/**
 * Calculate match score with type information
 */
function calculateTagMatchScoreWithType(
  queryTag: string,
  serviceTag: string,
  tagWeight: number
): { score: number; type: SearchExplanation['type'] } {
  const queryLower = queryTag.toLowerCase()
  const serviceLower = serviceTag.toLowerCase()

  // Generic fallback tags get reduced weight
  const effectiveWeight = isGenericFallbackTag(serviceLower) 
    ? Math.max(0.1, tagWeight * 0.2)
    : tagWeight

  // Exact match
  if (queryLower === serviceLower) {
    return {
      score: SCORE_WEIGHTS.EXACT_TAG_MATCH * (1 + effectiveWeight * SCORE_WEIGHTS.WEIGHT_MULTIPLIER),
      type: 'exact_match',
    }
  }

  // Intent-based match
  if (serviceLower.includes(queryLower) || queryLower.includes(serviceLower)) {
    const specificity = serviceLower.split('-').length
    return {
      score: SCORE_WEIGHTS.INTENT_MATCH * (1 + effectiveWeight * SCORE_WEIGHTS.WEIGHT_MULTIPLIER) * (1 + specificity * 0.1),
      type: 'intent_match',
    }
  }

  // Partial word match
  const queryWords = queryLower.split('-')
  const serviceWords = serviceLower.split('-')
  const matchingWords = queryWords.filter(qw => 
    serviceWords.some(sw => sw.includes(qw) || qw.includes(sw))
  )

  if (matchingWords.length > 0) {
    const matchRatio = matchingWords.length / Math.max(queryWords.length, serviceWords.length)
    return {
      score: SCORE_WEIGHTS.PARTIAL_MATCH * matchRatio * (1 + effectiveWeight),
      type: 'partial_match',
    }
  }

  return { score: 0, type: 'partial_match' }
}

/**
 * Get human-readable explanation reason
 */
function getExplanationReason(
  type: SearchExplanation['type'],
  matchedTag: string,
  queryTag: string
): string {
  switch (type) {
    case 'exact_match':
      return `To'g'ri mos keladi: "${matchedTag}"`
    case 'intent_match':
      return `Maqsadli mos keladi: "${matchedTag}"`
    case 'partial_match':
      return `Qisman mos keladi: "${matchedTag}"`
    default:
      return `Mos keladi: "${matchedTag}"`
  }
}

/**
 * Check if tag is a generic fallback tag
 */
function isGenericFallbackTag(tag: string): boolean {
  const genericTags = ['service', 'business', 'general', 'local', 'professional']
  return genericTags.includes(tag.toLowerCase())
}

/**
 * Calculate match score between query tag and service tag
 */
function calculateTagMatchScore(
  queryTag: string,
  serviceTag: string,
  tagWeight: number
): number {
  const queryLower = queryTag.toLowerCase()
  const serviceLower = serviceTag.toLowerCase()

  // Generic fallback tags get reduced weight (Priority 2 fix)
  // They still match but don't dominate ranking
  const effectiveWeight = isGenericFallbackTag(serviceLower) 
    ? Math.max(0.1, tagWeight * 0.2) // Cap at 0.1 minimum, but reduce by 80%
    : tagWeight

  // Exact match (highest score)
  if (queryLower === serviceLower) {
    return SCORE_WEIGHTS.EXACT_TAG_MATCH * (1 + effectiveWeight * SCORE_WEIGHTS.WEIGHT_MULTIPLIER)
  }

  // Intent-based match (e.g., "web" matches "web-development")
  if (serviceLower.includes(queryLower) || queryLower.includes(serviceLower)) {
    // More specific matches get higher score
    const specificity = serviceLower.split('-').length
    return SCORE_WEIGHTS.INTENT_MATCH * (1 + effectiveWeight * SCORE_WEIGHTS.WEIGHT_MULTIPLIER) * (1 + specificity * 0.1)
  }

  // Partial word match
  const queryWords = queryLower.split('-')
  const serviceWords = serviceLower.split('-')
  
  const matchingWords = queryWords.filter(qw => 
    serviceWords.some(sw => sw.includes(qw) || qw.includes(sw))
  )

  if (matchingWords.length > 0) {
    const matchRatio = matchingWords.length / Math.max(queryWords.length, serviceWords.length)
    return SCORE_WEIGHTS.PARTIAL_MATCH * matchRatio * (1 + effectiveWeight)
  }

  return 0
}

/**
 * Calculate popularity boost with time decay
 * Prevents weight drift: popular tags don't dominate forever
 */
function calculatePopularityBoost(service: Service): number {
  let boost = 0

  // View count boost (logarithmic scale)
  if (service.view_count && service.view_count > 0) {
    boost += Math.log10(service.view_count + 1) * SCORE_WEIGHTS.POPULARITY_BOOST
  }

  // Time decay for popularity (prevents old popular services from dominating)
  if (service.updated_at || service.created_at) {
    const lastActivity = service.updated_at || service.created_at
    const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    
    // Exponential decay: e^(-daysSinceActivity / 30)
    // After 30 days, popularity is ~37% of original
    // After 60 days, popularity is ~14% of original
    const decayFactor = Math.exp(-daysSinceActivity / 30)
    boost *= decayFactor
  }

  // Cold Start Boost: New services get temporary boost (Priority 3)
  if (service.created_at) {
    const daysSinceCreation = (Date.now() - new Date(service.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation < 7) {
      boost += 0.3 // New services get small boost (first week)
    } else if (daysSinceCreation < 14) {
      boost += 0.15 // Second week: reduced boost
    }
  }

  return boost
}

/**
 * Search services by tags with ranking
 * Returns services with search scores and explanations (Priority 1)
 */
export function searchServicesByTags(
  services: Service[],
  queryTags: string[],
  limit: number = 20,
  includeExplanation: boolean = false
): Service[] | ScoredService[] {
  if (!services || services.length === 0) return []
  if (!queryTags || queryTags.length === 0) return services

  // Calculate scores for all services
  const scoredServices = services.map(service => {
    const result = calculateServiceSearchScore(service, queryTags, includeExplanation)
    const score = typeof result === 'number' ? result : result.score
    const explanation = typeof result === 'number' ? [] : result.explanation

    return {
      service,
      score,
      explanation,
    }
  })

  // Sort by score (descending)
  scoredServices.sort((a, b) => b.score - a.score)

  // Filter out services with zero score and return top results
  const filtered = scoredServices
    .filter(item => item.score > 0)
    .slice(0, limit)

  if (includeExplanation) {
    return filtered.map(item => ({
      ...item.service,
      searchScore: item.score,
      explanation: item.explanation,
    })) as ScoredService[]
  }

  return filtered.map(item => item.service)
}

/**
 * Extract tags from search query
 */
export function extractTagsFromQuery(query: string): string[] {
  if (!query || typeof query !== 'string') return []

  // Split by common separators
  const tags = query
    .toLowerCase()
    .split(/[\s,;|]+/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  // Normalize tags
  return tags.map(tag => normalizeTag(tag)).filter(tag => tag.length > 0)
}

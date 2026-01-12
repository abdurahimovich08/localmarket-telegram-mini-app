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
 */
export function calculateServiceSearchScore(
  service: Service,
  queryTags: string[]
): number {
  if (!service.tags || service.tags.length === 0) return 0
  if (!queryTags || queryTags.length === 0) return 0

  // Normalize query tags
  const normalizedQueryTags = queryTags.map(tag => normalizeTag(tag))
  
  // Enrich service tags with weights (if not already enriched)
  const serviceTags: ServiceTag[] = Array.isArray(service.tags) && service.tags.length > 0
    ? (typeof service.tags[0] === 'string'
        ? enrichTagsWithWeights(service.tags as string[], 'user')
        : service.tags as ServiceTag[])
    : []

  let totalScore = 0

  // Score each query tag against service tags
  for (const queryTag of normalizedQueryTags) {
    let bestMatchScore = 0

    for (const serviceTag of serviceTags) {
      const tagValue = typeof serviceTag === 'string' ? serviceTag : serviceTag.value
      const tagWeight = typeof serviceTag === 'string' ? 0.5 : serviceTag.weight
      
      const matchScore = calculateTagMatchScore(queryTag, tagValue, tagWeight)
      bestMatchScore = Math.max(bestMatchScore, matchScore)
    }

    totalScore += bestMatchScore
  }

  // Add popularity boost
  const popularityBoost = calculatePopularityBoost(service)
  totalScore += popularityBoost

  return totalScore
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

  // Exact match (highest score)
  if (queryLower === serviceLower) {
    return SCORE_WEIGHTS.EXACT_TAG_MATCH * (1 + tagWeight * SCORE_WEIGHTS.WEIGHT_MULTIPLIER)
  }

  // Intent-based match (e.g., "web" matches "web-development")
  if (serviceLower.includes(queryLower) || queryLower.includes(serviceLower)) {
    // More specific matches get higher score
    const specificity = serviceLower.split('-').length
    return SCORE_WEIGHTS.INTENT_MATCH * (1 + tagWeight * SCORE_WEIGHTS.WEIGHT_MULTIPLIER) * (1 + specificity * 0.1)
  }

  // Partial word match
  const queryWords = queryLower.split('-')
  const serviceWords = serviceLower.split('-')
  
  const matchingWords = queryWords.filter(qw => 
    serviceWords.some(sw => sw.includes(qw) || qw.includes(sw))
  )

  if (matchingWords.length > 0) {
    const matchRatio = matchingWords.length / Math.max(queryWords.length, serviceWords.length)
    return SCORE_WEIGHTS.PARTIAL_MATCH * matchRatio * (1 + tagWeight)
  }

  return 0
}

/**
 * Calculate popularity boost based on service metrics
 */
function calculatePopularityBoost(service: Service): number {
  let boost = 0

  // View count boost (logarithmic scale)
  if (service.view_count && service.view_count > 0) {
    boost += Math.log10(service.view_count + 1) * SCORE_WEIGHTS.POPULARITY_BOOST
  }

  // Recent services get small boost
  if (service.created_at) {
    const daysSinceCreation = (Date.now() - new Date(service.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation < 7) {
      boost += 0.3 // New services get small boost
    }
  }

  return boost
}

/**
 * Search services by tags with ranking
 */
export function searchServicesByTags(
  services: Service[],
  queryTags: string[],
  limit: number = 20
): Service[] {
  if (!services || services.length === 0) return []
  if (!queryTags || queryTags.length === 0) return services

  // Calculate scores for all services
  const scoredServices = services.map(service => ({
    service,
    score: calculateServiceSearchScore(service, queryTags),
  }))

  // Sort by score (descending)
  scoredServices.sort((a, b) => b.score - a.score)

  // Filter out services with zero score and return top results
  return scoredServices
    .filter(item => item.score > 0)
    .slice(0, limit)
    .map(item => item.service)
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

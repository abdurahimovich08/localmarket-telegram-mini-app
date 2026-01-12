/**
 * Dashboard Ranking & Visibility API (Rank Block)
 * 
 * Tracks where services rank in search results:
 * - Current rank for each service
 * - Which queries show the service
 * - Rank changes over time
 * - Explainability (why this rank)
 */

import { supabase } from './supabase'
import type { Service } from '../types'
import { searchServicesByTags } from './tagSearch'
import { extractTagsFromQuery } from './tagSearch'

export interface ServiceRankInfo {
  serviceId: string
  serviceTitle: string
  query: string
  rank: number
  totalResults: number
  previousRank?: number
  rankChange: number // positive = moved up, negative = moved down
  explanation: string[]
  matchedTags: string[]
  isDrop?: boolean // Feature 3: Rank drop alert
  dropSeverity?: 'minor' | 'major' | 'critical'
}

/**
 * Get ranking info for a service across common queries
 */
export async function getServiceRankInfo(
  serviceId: string,
  commonQueries: string[] = []
): Promise<ServiceRankInfo[]> {
  try {
    // Get service data
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'active')
      .single()

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError)
      return []
    }

    // If no queries provided, get from service tags
    if (commonQueries.length === 0) {
      const tags = (service.tags || []) as string[]
      commonQueries = tags.slice(0, 5) // Use top 5 tags as queries
    }

    // Get all active services for ranking
    const { data: allServices, error: allServicesError } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')

    if (allServicesError || !allServices) {
      console.error('Error fetching all services:', allServicesError)
      return []
    }

    const rankInfos: ServiceRankInfo[] = []

    for (const query of commonQueries) {
      // Extract tags from query
      const queryTags = extractTagsFromQuery(query)

      if (queryTags.length === 0) continue

      // Search and rank services (no user ID for public ranking)
      const rankedServices = await searchServicesByTags(
        allServices as Service[],
        queryTags,
        50, // Top 50 results
        true, // Include explanations
        undefined // No user personalization for ranking analysis
      ) as any[]

      // Find our service in results
      const serviceIndex = rankedServices.findIndex(s => s.service_id === serviceId)

      if (serviceIndex === -1) {
        // Service not in top 50
        rankInfos.push({
          serviceId,
          serviceTitle: service.title,
          query,
          rank: 51, // Beyond top 50
          totalResults: rankedServices.length,
          rankChange: 0,
          explanation: ['Xizmat top natijalarda ko\'rinmayapti'],
          matchedTags: [],
        })
        continue
      }

      const rankedService = rankedServices[serviceIndex]
      const explanation = rankedService.explanation || []

      // Get previous rank (if tracked in database)
      // For now, we'll calculate based on historical data
      const previousRank = await getPreviousRank(serviceId, query)

      const currentRank = serviceIndex + 1
      const rankChange = previousRank ? previousRank - currentRank : 0
      
      // Feature 3: Detect rank drops
      const isDrop = rankChange < 0 && Math.abs(rankChange) >= 5 // Dropped by 5+ positions
      let dropSeverity: 'minor' | 'major' | 'critical' | undefined
      if (isDrop) {
        const dropAmount = Math.abs(rankChange)
        if (dropAmount >= 20) {
          dropSeverity = 'critical'
        } else if (dropAmount >= 10) {
          dropSeverity = 'major'
        } else {
          dropSeverity = 'minor'
        }
      }

      const rankInfo: ServiceRankInfo = {
        serviceId,
        serviceTitle: service.title,
        query,
        rank: currentRank,
        totalResults: rankedServices.length,
        previousRank,
        rankChange,
        explanation: explanation.map((e: any) => e.reason || ''),
        matchedTags: queryTags,
        isDrop,
        dropSeverity,
      }

      rankInfos.push(rankInfo)
    }

    return rankInfos
  } catch (error) {
    console.error('Error getting service rank info:', error)
    return []
  }
}

/**
 * Get previous rank for a service (from historical data)
 * In production, this would query a rankings_history table
 */
async function getPreviousRank(serviceId: string, query: string): Promise<number | undefined> {
  // TODO: Implement ranking history tracking
  // For now, return undefined
  return undefined
}

/**
 * Get popular queries for a category (for ranking analysis)
 */
export async function getPopularQueriesForCategory(
  category: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('service_interactions')
      .select('search_query, services!inner(category)')
      .not('search_query', 'is', null)
      .eq('services.category', category)
      .limit(1000)

    if (error) {
      console.error('Error fetching popular queries:', error)
      return []
    }

    // Count occurrences
    const queryCounts = new Map<string, number>()
    for (const interaction of data || []) {
      const query = interaction.search_query?.trim()
      if (query && query.length > 0) {
        queryCounts.set(query, (queryCounts.get(query) || 0) + 1)
      }
    }

    // Sort by count and return top N
    return Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query)
  } catch (error) {
    console.error('Error getting popular queries:', error)
    return []
  }
}

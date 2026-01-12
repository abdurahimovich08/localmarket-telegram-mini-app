/**
 * Tag Analytics Functions
 * 
 * Functions to fetch and analyze tag usage statistics
 */

import { supabase } from './supabase'

export interface TagUsageStats {
  tag_value: string
  usage_count: number
  search_count: number
  match_count: number
  last_used: string
  match_rate?: number // match_count / search_count (if search_count > 0)
}

/**
 * Get top performing tags (by usage count)
 */
export async function getTopTags(limit: number = 20): Promise<TagUsageStats[]> {
  const { data, error } = await supabase
    .from('tag_usage')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching top tags:', error)
    return []
  }

  return (data || []).map(calculateMatchRate)
}

/**
 * Get trending tags (recently used, high search count)
 */
export async function getTrendingTags(limit: number = 20, days: number = 7): Promise<TagUsageStats[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const { data, error } = await supabase
    .from('tag_usage')
    .select('*')
    .gte('last_used', cutoffDate.toISOString())
    .order('search_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching trending tags:', error)
    return []
  }

  return (data || []).map(calculateMatchRate)
}

/**
 * Get tags with high match rate (effective tags)
 */
export async function getEffectiveTags(limit: number = 20, minSearches: number = 5): Promise<TagUsageStats[]> {
  const { data, error } = await supabase
    .from('tag_usage')
    .select('*')
    .gte('search_count', minSearches)
    .order('match_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching effective tags:', error)
    return []
  }

  return (data || []).map(calculateMatchRate)
    .sort((a, b) => {
      // Sort by match rate (descending)
      const rateA = a.match_rate || 0
      const rateB = b.match_rate || 0
      return rateB - rateA
    })
}

/**
 * Get tags to avoid (low match rate, high search count)
 */
export async function getIneffectiveTags(limit: number = 10, minSearches: number = 5): Promise<TagUsageStats[]> {
  const { data, error } = await supabase
    .from('tag_usage')
    .select('*')
    .gte('search_count', minSearches)
    .order('search_count', { ascending: false })
    .limit(limit * 2) // Get more, then filter

  if (error) {
    console.error('Error fetching ineffective tags:', error)
    return []
  }

  return (data || [])
    .map(calculateMatchRate)
    .filter(tag => {
      // Tags with low match rate (< 0.3) and high search count
      const matchRate = tag.match_rate || 0
      return matchRate < 0.3 && tag.search_count >= minSearches
    })
    .sort((a, b) => {
      // Sort by match rate (ascending) - worst first
      const rateA = a.match_rate || 0
      const rateB = b.match_rate || 0
      return rateA - rateB
    })
    .slice(0, limit)
}

/**
 * Calculate match rate for a tag
 */
function calculateMatchRate(tag: TagUsageStats): TagUsageStats {
  const matchRate = tag.search_count > 0
    ? tag.match_count / tag.search_count
    : 0

  return {
    ...tag,
    match_rate: matchRate,
  }
}

/**
 * Get tag suggestions for AI prompt
 */
export async function getTagSuggestionsForAI(): Promise<{
  topTags: string[]
  trendingTags: string[]
  effectiveTags: string[]
  avoidTags: string[]
}> {
  const [topTags, trendingTags, effectiveTags, avoidTags] = await Promise.all([
    getTopTags(10),
    getTrendingTags(10),
    getEffectiveTags(10),
    getIneffectiveTags(5),
  ])

  return {
    topTags: topTags.map(t => t.tag_value),
    trendingTags: trendingTags.map(t => t.tag_value),
    effectiveTags: effectiveTags.map(t => t.tag_value),
    avoidTags: avoidTags.map(t => t.tag_value),
  }
}

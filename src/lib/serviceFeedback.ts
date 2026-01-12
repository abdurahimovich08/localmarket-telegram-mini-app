/**
 * Service Feedback Loop (Priority A: Conversion-Based Ranking)
 * 
 * Tracks which tags lead to conversions (views → clicks → contacts → orders)
 * Uses conversion data to improve search ranking
 */

import { supabase } from './supabase'

export interface TagConversionMetrics {
  tag: string
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
 * Track service interaction (view, click, contact, order)
 */
export async function trackServiceInteraction(
  serviceId: string,
  userTelegramId: number,
  interactionType: 'view' | 'click' | 'contact' | 'order',
  matchedTags: string[],
  searchQuery?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('service_interactions')
      .insert({
        service_id: serviceId,
        user_telegram_id: userTelegramId,
        interaction_type: interactionType,
        matched_tags: matchedTags,
        search_query: searchQuery || null,
      })

    if (error) {
      console.error('Error tracking service interaction:', error)
      // Don't throw - tracking is non-critical
    }
  } catch (error) {
    console.error('Error calling trackServiceInteraction:', error)
    // Don't throw - tracking is non-critical
  }
}

/**
 * Get tag conversion metrics
 * Returns conversion rates for tags (used in ranking)
 */
export async function getTagConversionMetrics(
  tags: string[]
): Promise<Map<string, TagConversionMetrics>> {
  if (!tags || tags.length === 0) {
    return new Map()
  }

  try {
    const { data, error } = await supabase
      .from('tag_conversion_metrics')
      .select('*')
      .in('tag', tags)

    if (error) {
      console.error('Error fetching tag conversion metrics:', error)
      return new Map()
    }

    const metricsMap = new Map<string, TagConversionMetrics>()
    for (const metric of data || []) {
      metricsMap.set(metric.tag, metric)
    }

    return metricsMap
  } catch (error) {
    console.error('Error calling getTagConversionMetrics:', error)
    return new Map()
  }
}

/**
 * Calculate conversion boost for a tag
 * Higher conversion rate = higher boost
 */
export function calculateConversionBoost(
  tag: string,
  metrics: TagConversionMetrics | undefined
): number {
  if (!metrics) return 0

  // Weighted conversion score:
  // - Click-through rate: 30%
  // - Contact rate: 40%
  // - Conversion rate: 30%
  const conversionScore =
    metrics.click_through_rate * 0.3 +
    metrics.contact_rate * 0.4 +
    metrics.conversion_rate * 0.3

  // Boost: 0.0 to 1.0 (multiplier)
  // Tags with 50%+ conversion get max boost
  return Math.min(1.0, conversionScore * 2)
}

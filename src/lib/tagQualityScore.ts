/**
 * Tag Quality Score (Priority C: AI Quality Metric)
 * 
 * Calculates quality score for tags:
 * quality = match_rate * conversion_rate * freshness
 * 
 * AI uses this to avoid low-quality tags
 */

import { supabase } from './supabase'
import type { TagUsageStats } from './tagAnalytics'

export interface TagQualityScore {
  tag: string
  quality: number // 0.0 to 1.0
  matchRate: number
  conversionRate: number
  freshness: number
  reasons: string[] // Why quality is high/low
}

/**
 * Calculate quality score for a tag
 * Formula: quality = match_rate * conversion_rate * freshness
 */
export async function calculateTagQualityScore(
  tag: string
): Promise<TagQualityScore> {
  try {
    // Get tag usage stats
    const { data: usageData, error: usageError } = await supabase
      .from('tag_usage')
      .select('*')
      .eq('tag_value', tag)
      .single()

    // Get conversion metrics
    const { data: conversionData, error: conversionError } = await supabase
      .from('tag_conversion_metrics')
      .select('*')
      .eq('tag', tag)
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error fetching tag usage:', usageError)
    }

    if (conversionError && conversionError.code !== 'PGRST116') {
      console.error('Error fetching tag conversion:', conversionError)
    }

    const usage = usageData as TagUsageStats | null
    const conversion = conversionData as any | null

    // Calculate match rate
    const matchRate = usage && usage.search_count > 0
      ? (usage.match_count || 0) / usage.search_count
      : 0.5 // Default if no data

    // Calculate conversion rate
    const conversionRate = conversion && conversion.view_count > 0
      ? (conversion.click_through_rate || 0) * 0.3 +
        (conversion.contact_rate || 0) * 0.4 +
        (conversion.conversion_rate || 0) * 0.3
      : 0.5 // Default if no data

    // Calculate freshness (based on last_used)
    const lastUsed = usage?.last_used || conversion?.last_used
    let freshness = 0.5 // Default
    if (lastUsed) {
      const daysSinceLastUse = (Date.now() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24)
      // Freshness decays over 30 days
      freshness = Math.exp(-daysSinceLastUse / 30)
    }

    // Calculate overall quality
    const quality = matchRate * conversionRate * freshness

    // Generate reasons
    const reasons: string[] = []
    if (matchRate > 0.7) {
      reasons.push('Yuqori moslik darajasi')
    } else if (matchRate < 0.3) {
      reasons.push('Past moslik darajasi')
    }

    if (conversionRate > 0.6) {
      reasons.push('Yuqori konversiya')
    } else if (conversionRate < 0.3) {
      reasons.push('Past konversiya')
    }

    if (freshness > 0.7) {
      reasons.push('Yaqinda ishlatilgan')
    } else if (freshness < 0.3) {
      reasons.push('Eski teg (kam ishlatiladi)')
    }

    return {
      tag,
      quality,
      matchRate,
      conversionRate,
      freshness,
      reasons,
    }
  } catch (error) {
    console.error('Error calculating tag quality score:', error)
    return {
      tag,
      quality: 0.5, // Default quality
      matchRate: 0.5,
      conversionRate: 0.5,
      freshness: 0.5,
      reasons: ['Ma\'lumot yetarli emas'],
    }
  }
}

/**
 * Get quality scores for multiple tags
 */
export async function getTagQualityScores(
  tags: string[]
): Promise<Map<string, TagQualityScore>> {
  const scores = await Promise.all(
    tags.map(tag => calculateTagQualityScore(tag))
  )

  const scoreMap = new Map<string, TagQualityScore>()
  for (const score of scores) {
    scoreMap.set(score.tag, score)
  }

  return scoreMap
}

/**
 * Filter out low-quality tags (for AI suggestions)
 * Returns tags with quality >= threshold
 */
export function filterLowQualityTags(
  tags: string[],
  qualityScores: Map<string, TagQualityScore>,
  threshold: number = 0.3
): string[] {
  return tags.filter(tag => {
    const score = qualityScores.get(tag)
    return !score || score.quality >= threshold
  })
}

/**
 * A/B Testing Framework (Priority 3: Scientific Growth)
 * 
 * Enables A/B testing for:
 * - Ranking formulas
 * - AI tag variants
 * - UI changes
 * 
 * Tracks which variant leads to more orders
 */

import { supabase } from './supabase'

export type ExperimentType = 'ranking_formula' | 'ai_tag_variants' | 'ui_variant'
export type Variant = 'A' | 'B' | 'C'

export interface Experiment {
  experiment_id: string
  experiment_type: ExperimentType
  variant: Variant
  user_telegram_id?: number
  service_id?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ExperimentResult {
  experiment_id: string
  experiment_type: ExperimentType
  variant: Variant
  views: number
  clicks: number
  contacts: number
  orders: number
  conversion_rate: number
  is_winner: boolean
}

/**
 * Assign user to experiment variant
 * Uses consistent hashing to ensure same user gets same variant
 */
export function assignExperimentVariant(
  experimentId: string,
  userId: number,
  experimentType: ExperimentType
): Variant {
  // Consistent hashing: same user + experiment = same variant
  const hash = `${experimentId}:${userId}:${experimentType}`
  let hashValue = 0
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i)
    hashValue = ((hashValue << 5) - hashValue) + char
    hashValue = hashValue & hashValue // Convert to 32-bit integer
  }

  // 50/50 split for A/B, or 33/33/33 for A/B/C
  const variantCount = experimentType === 'ui_variant' ? 3 : 2
  const variantIndex = Math.abs(hashValue) % variantCount

  if (variantCount === 3) {
    return variantIndex === 0 ? 'A' : variantIndex === 1 ? 'B' : 'C'
  } else {
    return variantIndex === 0 ? 'A' : 'B'
  }
}

/**
 * Track experiment exposure
 */
export async function trackExperimentExposure(
  experimentId: string,
  experimentType: ExperimentType,
  variant: Variant,
  userId?: number,
  serviceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('experiments')
      .insert({
        experiment_id: experimentId,
        experiment_type: experimentType,
        variant,
        user_telegram_id: userId || null,
        service_id: serviceId || null,
        metadata: metadata || {},
      })

    if (error) {
      console.error('Error tracking experiment exposure:', error)
      // Don't throw - tracking is non-critical
    }
  } catch (error) {
    console.error('Error calling trackExperimentExposure:', error)
    // Don't throw - tracking is non-critical
  }
}

/**
 * Track experiment conversion (order)
 */
export async function trackExperimentConversion(
  experimentId: string,
  experimentType: ExperimentType,
  variant: Variant,
  userId: number,
  serviceId?: string
): Promise<void> {
  try {
    // Mark as conversion in experiments table
    const { error } = await supabase
      .from('experiments')
      .update({
        metadata: { converted: true, converted_at: new Date().toISOString() },
      })
      .eq('experiment_id', experimentId)
      .eq('experiment_type', experimentType)
      .eq('variant', variant)
      .eq('user_telegram_id', userId)

    if (error) {
      console.error('Error tracking experiment conversion:', error)
    }
  } catch (error) {
    console.error('Error calling trackExperimentConversion:', error)
  }
}

/**
 * Get experiment results
 */
export async function getExperimentResults(
  experimentId: string,
  experimentType: ExperimentType
): Promise<ExperimentResult[]> {
  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('experiment_type', experimentType)

    if (error) {
      console.error('Error fetching experiment results:', error)
      return []
    }

    // Aggregate by variant
    const variantStats = new Map<Variant, {
      views: number
      clicks: number
      contacts: number
      orders: number
    }>()

    for (const experiment of data || []) {
      const variant = experiment.variant as Variant
      if (!variantStats.has(variant)) {
        variantStats.set(variant, { views: 0, clicks: 0, contacts: 0, orders: 0 })
      }

      const stats = variantStats.get(variant)!
      stats.views++

      // Check if converted
      const metadata = experiment.metadata || {}
      if (metadata.converted) {
        stats.orders++
      }
    }

    // Calculate conversion rates
    const results: ExperimentResult[] = []
    let maxConversionRate = 0

    for (const [variant, stats] of variantStats.entries()) {
      const conversionRate = stats.views > 0 ? stats.orders / stats.views : 0
      if (conversionRate > maxConversionRate) {
        maxConversionRate = conversionRate
      }

      results.push({
        experiment_id: experimentId,
        experiment_type: experimentType,
        variant,
        views: stats.views,
        clicks: stats.clicks,
        contacts: stats.contacts,
        orders: stats.orders,
        conversion_rate: conversionRate,
        is_winner: false, // Will be set below
      })
    }

    // Mark winner (highest conversion rate)
    for (const result of results) {
      if (result.conversion_rate === maxConversionRate && maxConversionRate > 0) {
        result.is_winner = true
      }
    }

    return results.sort((a, b) => b.conversion_rate - a.conversion_rate)
  } catch (error) {
    console.error('Error calculating experiment results:', error)
    return []
  }
}

/**
 * Example: A/B test ranking formulas
 */
export async function testRankingFormula(
  serviceId: string,
  userId: number,
  queryTags: string[]
): Promise<{ variant: Variant; usePersonalization: boolean }> {
  const experimentId = 'ranking_formula_v1'
  const variant = assignExperimentVariant(experimentId, userId, 'ranking_formula')

  // Track exposure
  await trackExperimentExposure(experimentId, 'ranking_formula', variant, userId, serviceId, {
    query_tags: queryTags,
  })

  // Variant A: Standard ranking
  // Variant B: Ranking with personalization boost
  return {
    variant,
    usePersonalization: variant === 'B',
  }
}

/**
 * Example: A/B test AI tag variants
 */
export async function testAITagVariants(
  serviceId: string,
  userId: number
): Promise<{ variant: Variant; useQualityFilter: boolean }> {
  const experimentId = 'ai_tag_quality_v1'
  const variant = assignExperimentVariant(experimentId, userId, 'ai_tag_variants')

  // Track exposure
  await trackExperimentExposure(experimentId, 'ai_tag_variants', variant, userId, serviceId)

  // Variant A: Standard AI tags
  // Variant B: AI tags with quality filter
  return {
    variant,
    useQualityFilter: variant === 'B',
  }
}

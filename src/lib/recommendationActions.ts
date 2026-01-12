/**
 * Recommendation Actions (Feature 2: One-Click Fix)
 * 
 * Allows users to apply AI recommendations with one click
 */

import { updateService } from './supabase'
import { validateAndNormalizeTags } from './tagUtils'
import { supabase } from './supabase'
import type { Service } from '../types'

export interface RecommendationAction {
  type: 'add_tag' | 'remove_tag' | 'update_title' | 'update_description' | 'update_price'
  description: string
  value?: string
  tags?: string[]
  expectedImpact?: {
    ctr?: number // Expected CTR improvement in %
    conversion?: number // Expected conversion improvement in %
    healthScore?: number // Expected health score improvement
  }
}

/**
 * Apply recommendation action to a service
 */
export async function applyRecommendation(
  serviceId: string,
  action: RecommendationAction,
  currentService: Service
): Promise<boolean> {
  try {
    let updates: Partial<Service> = {}

    switch (action.type) {
      case 'add_tag':
        if (action.tags && action.tags.length > 0) {
          const currentTags = (currentService.tags || []) as string[]
          const newTags = [...currentTags, ...action.tags]
          const validatedTags = validateAndNormalizeTags(newTags)
          updates.tags = validatedTags
        }
        break

      case 'remove_tag':
        if (action.tags && action.tags.length > 0) {
          const currentTags = (currentService.tags || []) as string[]
          const newTags = currentTags.filter(tag => !action.tags!.includes(tag))
          updates.tags = newTags.length > 0 ? newTags : currentTags // Keep at least current tags
        }
        break

      case 'update_title':
        if (action.value) {
          updates.title = action.value
        }
        break

      case 'update_description':
        if (action.value) {
          updates.description = action.value
        }
        break

      case 'update_price':
        if (action.value) {
          updates.price = action.value
        }
        break
    }

    if (Object.keys(updates).length === 0) {
      return false
    }

    // Get before metrics for impact tracking
    const beforeMetrics = {
      views: currentService.view_count || 0,
      clicks: 0, // Would need to calculate
      conversion: 0, // Would need to calculate
    }

    const result = await updateService(serviceId, updates)

    if (result) {
      // Record recommendation application (for analytics)
      try {
        await supabase
          .from('recommendation_applications')
          .insert({
            user_telegram_id: currentService.provider_telegram_id,
            service_id: serviceId,
            recommendation_type: action.type,
            recommendation_description: action.description,
            impact_metrics: {
              expected_ctr: action.expectedImpact?.ctr,
              expected_conversion: action.expectedImpact?.conversion,
              expected_health: action.expectedImpact?.healthScore,
              before_metrics: beforeMetrics,
            },
          })
      } catch (error) {
        console.error('Error recording recommendation application:', error)
        // Don't fail the update
      }
    }

    return result !== null
  } catch (error) {
    console.error('Error applying recommendation:', error)
    return false
  }
}

/**
 * Generate actionable recommendations from insights
 */
export function generateActionableRecommendations(insights: any): RecommendationAction[] {
  const actions: RecommendationAction[] = []

  // Remove underperforming tags (Feature B: Impact Preview)
  if (insights.underperformingTags && insights.underperformingTags.length > 0) {
    // Calculate expected improvement: removing poor tags improves CTR by ~5-10%
    const currentCTR = insights.totalViews > 0 ? (insights.totalClicks / insights.totalViews) * 100 : 0
    const expectedCTR = currentCTR * 1.1 // 10% improvement estimate
    
    actions.push({
      type: 'remove_tag',
      description: `${insights.underperformingTags.length} ta past natija ko'rsatayotgan tegni olib tashlash`,
      tags: insights.underperformingTags,
      expectedImpact: {
        ctr: expectedCTR - currentCTR, // Expected CTR improvement
        conversion: 2, // Estimated 2% conversion improvement
        healthScore: 5, // Health score improvement estimate
      },
    })
  }

  // Add high-performing tags from category (Feature B: Impact Preview)
  if (insights.topPerformingTags && insights.topPerformingTags.length > 0) {
    const currentTags = insights.tagInsights.map((ti: any) => ti.tag)
    const missingTags = insights.topPerformingTags.filter((tag: string) => !currentTags.includes(tag))
    if (missingTags.length > 0) {
      // Calculate expected improvement: adding good tags improves CTR by ~8-15%
      const currentCTR = insights.totalViews > 0 ? (insights.totalClicks / insights.totalViews) * 100 : 0
      const expectedCTR = currentCTR * 1.12 // 12% improvement estimate
      
      actions.push({
        type: 'add_tag',
        description: `${missingTags.length} ta yaxshi ishlayotgan tegni qo'shish`,
        tags: missingTags.slice(0, 3), // Max 3 at a time
        expectedImpact: {
          ctr: expectedCTR - currentCTR, // Expected CTR improvement
          conversion: 3, // Estimated 3% conversion improvement
          healthScore: 8, // Health score improvement estimate
        },
      })
    }
  }

  // Title improvement suggestions (Feature B: Impact Preview)
  if (insights.overallConversionRate < 0.05) {
    const currentCTR = insights.totalViews > 0 ? (insights.totalClicks / insights.totalViews) * 100 : 0
    const expectedCTR = currentCTR * 1.15 // 15% improvement estimate
    
    actions.push({
      type: 'update_title',
      description: "Title'ga intent so'zlar qo'shish (masalan: 'telegram', 'fast', 'professional')",
      value: '', // Will be filled by AI or user
      expectedImpact: {
        ctr: expectedCTR - currentCTR, // Expected CTR improvement
        conversion: 5, // Estimated 5% conversion improvement
        healthScore: 10, // Health score improvement estimate
      },
    })
  }

  return actions
}

/**
 * Recommendation Actions (Feature 2: One-Click Fix)
 * 
 * Allows users to apply AI recommendations with one click
 */

import { updateService } from './supabase'
import { validateAndNormalizeTags } from './tagUtils'
import type { Service } from '../types'

export interface RecommendationAction {
  type: 'add_tag' | 'remove_tag' | 'update_title' | 'update_description' | 'update_price'
  description: string
  value?: string
  tags?: string[]
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

    const result = await updateService(serviceId, updates)
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

  // Remove underperforming tags
  if (insights.underperformingTags && insights.underperformingTags.length > 0) {
    actions.push({
      type: 'remove_tag',
      description: `${insights.underperformingTags.length} ta past natija ko'rsatayotgan tegni olib tashlash`,
      tags: insights.underperformingTags,
    })
  }

  // Add high-performing tags from category
  if (insights.topPerformingTags && insights.topPerformingTags.length > 0) {
    const currentTags = insights.tagInsights.map((ti: any) => ti.tag)
    const missingTags = insights.topPerformingTags.filter((tag: string) => !currentTags.includes(tag))
    if (missingTags.length > 0) {
      actions.push({
        type: 'add_tag',
        description: `${missingTags.length} ta yaxshi ishlayotgan tegni qo'shish`,
        tags: missingTags.slice(0, 3), // Max 3 at a time
      })
    }
  }

  // Title improvement suggestions (based on insights)
  if (insights.overallConversionRate < 0.05) {
    actions.push({
      type: 'update_title',
      description: "Title'ga intent so'zlar qo'shish (masalan: 'telegram', 'fast', 'professional')",
      value: '', // Will be filled by AI or user
    })
  }

  return actions
}

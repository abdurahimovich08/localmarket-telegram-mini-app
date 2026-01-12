/**
 * Search Result Personalization (Priority B: User Preferences)
 * 
 * Boosts tags based on user's past behavior
 * Example: If user views many telegram services, boost telegram-* tags
 */

import { supabase } from './supabase'

export interface UserTagPreferences {
  tag: string
  viewCount: number
  clickCount: number
  lastViewed: string
  preferenceScore: number // 0.0 to 1.0
}

/**
 * Get user's tag preferences based on past interactions
 */
export async function getUserTagPreferences(
  userTelegramId: number,
  days: number = 30
): Promise<Map<string, UserTagPreferences>> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  try {
    const { data, error } = await supabase
      .from('service_interactions')
      .select('matched_tags, interaction_type, created_at')
      .eq('user_telegram_id', userTelegramId)
      .gte('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error fetching user tag preferences:', error)
      return new Map()
    }

    // Aggregate tag preferences
    const tagMap = new Map<string, { views: number; clicks: number; lastViewed: Date }>()

    for (const interaction of data || []) {
      const tags = interaction.matched_tags || []
      const lastViewed = new Date(interaction.created_at)

      for (const tag of tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, { views: 0, clicks: 0, lastViewed })
        }

        const stats = tagMap.get(tag)!
        if (interaction.interaction_type === 'view') {
          stats.views++
        } else if (interaction.interaction_type === 'click') {
          stats.clicks++
        }

        // Update last viewed if newer
        if (lastViewed > stats.lastViewed) {
          stats.lastViewed = lastViewed
        }
      }
    }

    // Calculate preference scores
    const preferences = new Map<string, UserTagPreferences>()

    for (const [tag, stats] of tagMap.entries()) {
      // Preference score: based on views and clicks, with recency decay
      const daysSinceLastView = (Date.now() - stats.lastViewed.getTime()) / (1000 * 60 * 60 * 24)
      const recencyFactor = Math.exp(-daysSinceLastView / 7) // Decay over 7 days

      const activityScore = Math.min(1.0, (stats.views * 0.1 + stats.clicks * 0.5) / 10)
      const preferenceScore = activityScore * recencyFactor

      preferences.set(tag, {
        tag,
        viewCount: stats.views,
        clickCount: stats.clicks,
        lastViewed: stats.lastViewed.toISOString(),
        preferenceScore,
      })
    }

    return preferences
  } catch (error) {
    console.error('Error calculating user tag preferences:', error)
    return new Map()
  }
}

/**
 * Calculate personalization boost for a tag
 * Returns boost multiplier (0.0 to 0.5)
 */
export function calculatePersonalizationBoost(
  tag: string,
  userPreferences: Map<string, UserTagPreferences>
): number {
  const preference = userPreferences.get(tag)
  if (!preference) return 0

  // Boost: 0.0 to 0.5 (max 50% boost)
  // Higher preference score = higher boost
  return preference.preferenceScore * 0.5
}

/**
 * Check if tag matches user's preference pattern
 * Example: If user likes "telegram-bot", also boost "telegram-shop", "telegram-mini-app"
 */
export function getRelatedTagsBoost(
  tag: string,
  userPreferences: Map<string, UserTagPreferences>
): number {
  // Extract prefix (e.g., "telegram" from "telegram-bot")
  const prefix = tag.split('-')[0]

  // Find all user-preferred tags with same prefix
  let maxBoost = 0
  for (const [prefTag, preference] of userPreferences.entries()) {
    if (prefTag.startsWith(prefix + '-') && prefTag !== tag) {
      // Related tag found: apply 30% of its preference score
      maxBoost = Math.max(maxBoost, preference.preferenceScore * 0.3)
    }
  }

  return maxBoost * 0.5 // Max 15% boost for related tags
}

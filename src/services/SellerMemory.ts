/**
 * Seller Memory Service
 * 
 * Enables "Netflix-level" UX by remembering what sellers previously listed.
 * 
 * Features:
 * - Get last taxonomy selection
 * - Get top categories
 * - Save taxonomy selection
 */

import { supabase } from '../lib/supabase'
import type { TaxonNode } from '../taxonomy/clothing.uz'

export interface SellerHistory {
  id: string
  user_id: string
  taxonomy_leaf_id: string
  taxonomy_path_uz: string
  audience?: string
  segment?: string
  listing_id?: string
  created_at: string
}

export interface LastTaxonomy {
  leaf_id: string
  path_uz: string
  audience?: string
  segment?: string
  created_at: string
}

export interface TopCategory {
  leaf_id: string
  path_uz: string
  count: number
}

/**
 * Get last taxonomy selection for a user
 */
export async function getLastTaxonomy(
  userId: string
): Promise<LastTaxonomy | null> {
  try {
    const { data, error } = await supabase
      .from('seller_history')
      .select('taxonomy_leaf_id, taxonomy_path_uz, audience, segment, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - user has no history
        return null
      }
      console.error('Error getting last taxonomy:', error)
      return null
    }

    return {
      leaf_id: data.taxonomy_leaf_id,
      path_uz: data.taxonomy_path_uz,
      audience: data.audience || undefined,
      segment: data.segment || undefined,
      created_at: data.created_at,
    }
  } catch (error) {
    console.error('Error getting last taxonomy:', error)
    return null
  }
}

/**
 * Get top categories for a user (most frequently used)
 */
export async function getTopCategories(
  userId: string,
  limit: number = 3
): Promise<TopCategory[]> {
  try {
    const { data, error } = await supabase
      .from('seller_history')
      .select('taxonomy_leaf_id, taxonomy_path_uz')
      .eq('user_id', userId)

    if (error) {
      console.error('Error getting top categories:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Count frequency
    const frequency: Record<string, { path_uz: string; count: number }> = {}
    for (const item of data) {
      const key = item.taxonomy_leaf_id
      if (frequency[key]) {
        frequency[key].count++
      } else {
        frequency[key] = {
          path_uz: item.taxonomy_path_uz,
          count: 1,
        }
      }
    }

    // Sort by count and return top N
    const top = Object.entries(frequency)
      .map(([leaf_id, { path_uz, count }]) => ({
        leaf_id,
        path_uz,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return top
  } catch (error) {
    console.error('Error getting top categories:', error)
    return []
  }
}

/**
 * Save taxonomy selection to history
 */
export async function saveTaxonomySelection(
  userId: string,
  taxonomy: TaxonNode,
  listingId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('seller_history')
      .insert({
        user_id: userId,
        taxonomy_leaf_id: taxonomy.id,
        taxonomy_path_uz: taxonomy.pathUz || taxonomy.labelUz,
        audience: taxonomy.audience,
        segment: taxonomy.segment,
        listing_id: listingId || null,
      })

    if (error) {
      console.error('Error saving taxonomy selection:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving taxonomy selection:', error)
    return false
  }
}

/**
 * Check if user has any history
 */
export async function hasSellerHistory(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('seller_history')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false
      }
      console.error('Error checking seller history:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking seller history:', error)
    return false
  }
}

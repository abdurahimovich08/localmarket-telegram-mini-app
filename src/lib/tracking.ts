// User behavior tracking for personalization
import { supabase } from './supabase'

/**
 * Track user search query
 */
export const trackUserSearch = async (
  userTelegramId: number,
  searchQuery: string,
  category?: string,
  resultCount: number = 0
): Promise<void> => {
  try {
    await supabase.from('user_searches').insert({
      user_telegram_id: userTelegramId,
      search_query: searchQuery,
      category: category || null,
      result_count: resultCount
    })
  } catch (error) {
    console.error('Error tracking user search:', error)
  }
}

/**
 * Track user interaction with listing (view, click, favorite)
 */
export const trackUserInteraction = async (
  userTelegramId: number,
  listingId: string,
  interactionType: 'view' | 'click' | 'favorite' | 'search_match' | 'category_view',
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await supabase.from('user_listing_interactions').insert({
      user_telegram_id: userTelegramId,
      listing_id: listingId,
      interaction_type: interactionType,
      metadata: metadata || null
    })
  } catch (error) {
    console.error('Error tracking user interaction:', error)
  }
}

/**
 * Track listing view
 */
export const trackListingView = async (
  userTelegramId: number,
  listingId: string
): Promise<void> => {
  await trackUserInteraction(userTelegramId, listingId, 'view')
}

/**
 * Track category view
 */
export const trackCategoryView = async (
  userTelegramId: number,
  category: string
): Promise<void> => {
  try {
    // Use a dummy UUID string for category-only tracking (not a real listing)
    const dummyListingId = '00000000-0000-0000-0000-000000000000'
    await supabase.from('user_listing_interactions').insert({
      user_telegram_id: userTelegramId,
      listing_id: dummyListingId,
      interaction_type: 'category_view',
      metadata: { category }
    })
  } catch (error) {
    console.error('Error tracking category view:', error)
  }
}

/**
 * Get user category preferences
 */
export const getUserCategoryPreferences = async (
  userTelegramId: number
): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('user_category_preferences')
      .select('category, score')
      .eq('user_telegram_id', userTelegramId)
      .order('score', { ascending: false })

    if (error) {
      console.error('Error fetching user preferences:', error)
      return {}
    }

    const preferences: Record<string, number> = {}
    data?.forEach((pref) => {
      preferences[pref.category] = parseFloat(pref.score)
    })

    return preferences
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return {}
  }
}

/**
 * Get user recent search keywords
 */
export const getUserRecentSearches = async (
  userTelegramId: number,
  limit: number = 10
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_searches')
      .select('search_query')
      .eq('user_telegram_id', userTelegramId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent searches:', error)
      return []
    }

    return data?.map((search) => search.search_query) || []
  } catch (error) {
    console.error('Error getting recent searches:', error)
    return []
  }
}

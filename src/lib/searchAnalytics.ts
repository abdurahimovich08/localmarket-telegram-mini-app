/**
 * Search Analytics System
 * 
 * Tracks and analyzes user search behavior:
 * 1. Popular search terms
 * 2. Search trends over time
 * 3. Zero-result searches (to improve)
 * 4. Search → conversion tracking
 */

import { supabase } from './supabase'
import { normalizeText } from './transliteration'
import { normalizeBrand } from './smartSearch'

export interface SearchEvent {
  query: string
  normalizedQuery: string
  category?: string
  resultCount: number
  userId?: number
  brandDetected?: string
  timestamp: string
}

export interface PopularSearch {
  query: string
  count: number
  avgResults: number
  trend: 'up' | 'down' | 'stable'
}

export interface SearchSuggestion {
  query: string
  score: number
  type: 'popular' | 'recent' | 'category' | 'brand'
}

// Local storage for search history (before user authentication)
const SEARCH_HISTORY_KEY = 'localmarket_search_history'
const MAX_HISTORY_ITEMS = 50

/**
 * Track a search event
 */
export async function trackSearch(event: Omit<SearchEvent, 'timestamp' | 'normalizedQuery'>): Promise<void> {
  const normalizedQuery = normalizeText(event.query)
  const timestamp = new Date().toISOString()
  
  const fullEvent: SearchEvent = {
    ...event,
    normalizedQuery,
    timestamp,
  }

  // Save to local storage (for anonymous users)
  saveToLocalHistory(fullEvent)

  // Save to database (if user is logged in)
  if (event.userId) {
    try {
      await supabase.from('search_events').insert({
        user_telegram_id: event.userId,
        query: event.query,
        normalized_query: normalizedQuery,
        category: event.category,
        result_count: event.resultCount,
        brand_detected: event.brandDetected,
        searched_at: timestamp,
      })
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error('Error tracking search:', error)
    }
  }
}

/**
 * Save search to local history
 */
function saveToLocalHistory(event: SearchEvent): void {
  try {
    const history = getLocalHistory()
    
    // Add new search at the beginning
    history.unshift({
      query: event.query,
      timestamp: event.timestamp,
      resultCount: event.resultCount,
    })
    
    // Deduplicate (keep most recent)
    const seen = new Set<string>()
    const deduped = history.filter(item => {
      const normalized = normalizeText(item.query)
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
    
    // Limit history size
    const limited = deduped.slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error('Error saving search history:', error)
  }
}

/**
 * Get local search history
 */
function getLocalHistory(): Array<{ query: string; timestamp: string; resultCount: number }> {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Get user's recent searches
 */
export function getRecentSearches(limit: number = 5): string[] {
  const history = getLocalHistory()
  return history.slice(0, limit).map(h => h.query)
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY)
}

/**
 * Get popular searches (static list + dynamic from DB)
 */
export async function getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
  // Static popular searches (common items in Uzbekistan)
  const staticPopular: PopularSearch[] = [
    { query: 'krossovka', count: 1000, avgResults: 50, trend: 'up' },
    { query: 'futbolka', count: 800, avgResults: 100, trend: 'stable' },
    { query: 'jinsi', count: 750, avgResults: 80, trend: 'up' },
    { query: 'nike', count: 600, avgResults: 30, trend: 'up' },
    { query: 'adidas', count: 550, avgResults: 25, trend: 'stable' },
    { query: 'sport forma', count: 400, avgResults: 40, trend: 'up' },
    { query: 'telefon', count: 900, avgResults: 60, trend: 'stable' },
    { query: 'nexia', count: 700, avgResults: 20, trend: 'down' },
    { query: 'kvartira', count: 500, avgResults: 30, trend: 'stable' },
    { query: 'laptop', count: 450, avgResults: 25, trend: 'up' },
  ]

  // Try to get dynamic data from DB
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data } = await supabase
      .from('search_events')
      .select('normalized_query, result_count')
      .gte('searched_at', sevenDaysAgo.toISOString())

    if (data && data.length > 0) {
      // Aggregate searches
      const queryStats = new Map<string, { count: number; totalResults: number }>()
      
      for (const event of data) {
        const query = event.normalized_query
        const stats = queryStats.get(query) || { count: 0, totalResults: 0 }
        stats.count++
        stats.totalResults += event.result_count || 0
        queryStats.set(query, stats)
      }

      // Convert to array and sort
      const dynamicPopular: PopularSearch[] = [...queryStats.entries()]
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          avgResults: Math.round(stats.totalResults / stats.count),
          trend: 'stable' as const, // Would need historical data for real trend
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      if (dynamicPopular.length >= 5) {
        return dynamicPopular
      }
    }
  } catch (error) {
    console.error('Error fetching popular searches:', error)
  }

  return staticPopular.slice(0, limit)
}

/**
 * Get autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 8
): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) return []

  const normalized = normalizeText(query)
  const suggestions: SearchSuggestion[] = []

  // 1. Recent searches that match
  const recent = getRecentSearches(20)
  for (const recentQuery of recent) {
    if (normalizeText(recentQuery).includes(normalized) || normalized.includes(normalizeText(recentQuery))) {
      suggestions.push({
        query: recentQuery,
        score: 100, // High score for recent
        type: 'recent'
      })
    }
  }

  // 2. Brand suggestions
  const POPULAR_BRANDS = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Zara', 'H&M',
    'Samsung', 'iPhone', 'Xiaomi', 'Nexia', 'Lacetti', 'Malibu', 'Cobalt'
  ]
  
  for (const brand of POPULAR_BRANDS) {
    if (normalizeText(brand).includes(normalized) || normalized.includes(normalizeText(brand))) {
      suggestions.push({
        query: brand,
        score: 80,
        type: 'brand'
      })
    }
  }

  // 3. Category suggestions
  const CATEGORY_SUGGESTIONS = [
    { query: 'krossovka', category: 'clothing' },
    { query: 'futbolka', category: 'clothing' },
    { query: 'jinsi', category: 'clothing' },
    { query: 'kurtka', category: 'clothing' },
    { query: 'sport forma', category: 'clothing' },
    { query: 'telefon', category: 'electronics' },
    { query: 'noutbuk', category: 'electronics' },
    { query: 'televizor', category: 'electronics' },
    { query: 'mashina', category: 'automotive' },
    { query: 'kvartira', category: 'realestate' },
  ]
  
  for (const item of CATEGORY_SUGGESTIONS) {
    if (normalizeText(item.query).includes(normalized) || normalized.includes(normalizeText(item.query))) {
      suggestions.push({
        query: item.query,
        score: 70,
        type: 'category'
      })
    }
  }

  // 4. Popular searches that match
  const popular = await getPopularSearches(20)
  for (const pop of popular) {
    if (normalizeText(pop.query).includes(normalized) || normalized.includes(normalizeText(pop.query))) {
      // Avoid duplicates
      if (!suggestions.some(s => normalizeText(s.query) === normalizeText(pop.query))) {
        suggestions.push({
          query: pop.query,
          score: 60 + (pop.count / 100), // Higher count = higher score
          type: 'popular'
        })
      }
    }
  }

  // Sort by score and deduplicate
  const seen = new Set<string>()
  return suggestions
    .sort((a, b) => b.score - a.score)
    .filter(s => {
      const norm = normalizeText(s.query)
      if (seen.has(norm)) return false
      seen.add(norm)
      return true
    })
    .slice(0, limit)
}

/**
 * Get zero-result searches (for improvement)
 */
export async function getZeroResultSearches(limit: number = 20): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('search_events')
      .select('query')
      .eq('result_count', 0)
      .order('searched_at', { ascending: false })
      .limit(limit)

    if (data) {
      // Deduplicate
      const seen = new Set<string>()
      return data
        .map(d => d.query)
        .filter(q => {
          const norm = normalizeText(q)
          if (seen.has(norm)) return false
          seen.add(norm)
          return true
        })
    }
  } catch (error) {
    console.error('Error fetching zero-result searches:', error)
  }

  return []
}

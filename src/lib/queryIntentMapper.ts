/**
 * Query → Intent Mapper (Priority 2)
 * 
 * Converts natural language queries into structured intents and tags
 * Example: "telegramda magazin ochish" → ["telegram-shop", "telegram-bot", "local-market"]
 * 
 * Performance: Uses caching to reduce AI calls and latency
 */

import { normalizeTag } from './tagUtils'
import { startChatSession, sendMessage } from '../services/GeminiService'

// ============================================
// QUERY INTENT CACHE (Performance optimization)
// ============================================

interface CachedIntent {
  intent: QueryIntent
  timestamp: number
  hitCount: number
}

// In-memory cache (can be moved to Redis in production)
const intentCache = new Map<string, CachedIntent>()

// Cache TTL: 24 hours (frequently used queries stay cached longer)
const CACHE_TTL = 24 * 60 * 60 * 1000

// Max cache size: 1000 entries (LRU eviction)
const MAX_CACHE_SIZE = 1000

/**
 * Get cache key from query (normalized)
 */
function getCacheKey(query: string): string {
  return normalizeTag(query.toLowerCase().trim())
}

/**
 * Get cached intent if available and not expired
 */
function getCachedIntent(query: string): QueryIntent | null {
  const key = getCacheKey(query)
  const cached = intentCache.get(key)

  if (!cached) return null

  // Check if expired
  const age = Date.now() - cached.timestamp
  if (age > CACHE_TTL) {
    intentCache.delete(key)
    return null
  }

  // Update hit count (for analytics)
  cached.hitCount++
  return cached.intent
}

/**
 * Store intent in cache
 */
function setCachedIntent(query: string, intent: QueryIntent): void {
  const key = getCacheKey(query)

  // LRU eviction: remove oldest if cache is full
  if (intentCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(intentCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
    intentCache.delete(oldestKey)
  }

  intentCache.set(key, {
    intent,
    timestamp: Date.now(),
    hitCount: 1,
  })
}

/**
 * Get cache statistics (for monitoring)
 */
export function getIntentCacheStats(): {
  size: number
  hitRate: number
  topQueries: Array<{ query: string; hits: number }>
} {
  const entries = Array.from(intentCache.entries())
  const topQueries = entries
    .sort((a, b) => b[1].hitCount - a[1].hitCount)
    .slice(0, 10)
    .map(([query, cached]) => ({ query, hits: cached.hitCount }))

  return {
    size: intentCache.size,
    hitRate: 0, // Would need to track misses separately
    topQueries,
  }
}

export interface QueryIntent {
  tags: string[]
  category?: string
  priceRange?: { min?: number; max?: number }
  intent: string // Human-readable intent
}

/**
 * Map natural language query to structured intent and tags
 * Uses AI to understand user intent and extract relevant tags
 * Performance: Uses caching to reduce AI calls
 */
export async function mapQueryToIntent(query: string): Promise<QueryIntent> {
  if (!query || query.trim().length === 0) {
    return {
      tags: [],
      intent: '',
    }
  }

  // Check cache first (Performance optimization)
  const cached = getCachedIntent(query)
  if (cached) {
    return cached
  }

  try {
    // Use AI to extract intent and tags from query
    const prompt = `Quyidagi foydalanuvchi so'rovini tahlil qil va teglarga aylantir:

So'rov: "${query}"

Vazifang:
1. Foydalanuvchi nimani qidirayotganini aniqlash
2. Teglarni ajratib olish (lotin alifbosi, kichik harflar, defis bilan)
3. Kategoriyani aniqlash (agar mumkin bo'lsa)

FAQAT JSON formatda javob qaytar:
{
  "intent": "Foydalanuvchi nimani qidirayotgani (o'zbek tilida)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Kategoriya (yoki null)"
}

Masalan:
So'rov: "telegramda magazin ochish"
Javob: {
  "intent": "Telegram orqali onlayn do'kon yaratish xizmati",
  "tags": ["telegram-shop", "telegram-bot", "ecommerce", "online-store"],
  "category": "technology"
}`

    const chatSession = await startChatSession()
    const response = await sendMessage(chatSession, prompt)

    // Try to parse JSON from response
    const text = response.message || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        const normalizedTags = (parsed.tags || [])
          .map((tag: string) => normalizeTag(tag))
          .filter((tag: string) => tag.length > 0)

        const intent: QueryIntent = {
          tags: normalizedTags,
          category: parsed.category || undefined,
          intent: parsed.intent || query,
        }

        // Cache the result
        setCachedIntent(query, intent)
        return intent
      } catch (e) {
        console.warn('Failed to parse AI response for query intent:', e)
      }
    }
  } catch (error) {
    console.error('Error mapping query to intent:', error)
  }

  // Fallback: simple keyword extraction
  const fallbackIntent = extractKeywordsAsTags(query)
  // Cache fallback too (to avoid repeated AI calls for same query)
  setCachedIntent(query, fallbackIntent)
  return fallbackIntent
}

/**
 * Fallback: Extract keywords from query and convert to tags
 */
function extractKeywordsAsTags(query: string): QueryIntent {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .map(word => normalizeTag(word))
    .filter(tag => tag.length > 0)

  return {
    tags: keywords.slice(0, 5), // Limit to 5 tags
    intent: query,
  }
}

/**
 * Combine query intent mapping with tag-based search
 * This is the main function to use for search
 */
export async function searchWithQueryIntent(
  services: any[],
  query: string,
  searchServicesByTags: (services: any[], tags: string[], limit?: number, includeExplanation?: boolean) => any[]
): Promise<any[]> {
  // Map query to intent and tags
  const intent = await mapQueryToIntent(query)

  if (intent.tags.length === 0) {
    // If no tags extracted, return empty or use simple text search
    return []
  }

  // Use tag-based search with extracted tags
  return searchServicesByTags(services, intent.tags, 20, true) as any[]
}

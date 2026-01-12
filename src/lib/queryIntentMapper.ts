/**
 * Query → Intent Mapper (Priority 2)
 * 
 * Converts natural language queries into structured intents and tags
 * Example: "telegramda magazin ochish" → ["telegram-shop", "telegram-bot", "local-market"]
 */

import { normalizeTag } from './tagUtils'
import { startChatSession, sendMessage } from '../services/GeminiService'

export interface QueryIntent {
  tags: string[]
  category?: string
  priceRange?: { min?: number; max?: number }
  intent: string // Human-readable intent
}

/**
 * Map natural language query to structured intent and tags
 * Uses AI to understand user intent and extract relevant tags
 */
export async function mapQueryToIntent(query: string): Promise<QueryIntent> {
  if (!query || query.trim().length === 0) {
    return {
      tags: [],
      intent: '',
    }
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

        return {
          tags: normalizedTags,
          category: parsed.category || undefined,
          intent: parsed.intent || query,
        }
      } catch (e) {
        console.warn('Failed to parse AI response for query intent:', e)
      }
    }
  } catch (error) {
    console.error('Error mapping query to intent:', error)
  }

  // Fallback: simple keyword extraction
  return extractKeywordsAsTags(query)
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

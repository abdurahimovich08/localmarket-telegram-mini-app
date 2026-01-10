/**
 * Advanced Search Algorithms
 * Includes: Fuzzy search, typo tolerance, synonym expansion, multi-script support
 */

import { expandSynonyms } from './synonyms'
import { normalizeText, transliterate } from './transliteration'

/**
 * Calculate Levenshtein distance between two strings
 * Used for typo tolerance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity score (0-1) between two strings
 */
export function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  return 1 - distance / maxLen
}

/**
 * Check if query is likely a typo of a known word
 * Returns corrected version if similarity > threshold
 */
export function correctTypo(
  query: string,
  knownWords: string[],
  threshold: number = 0.7
): string | null {
  const normalizedQuery = normalizeText(query)
  
  for (const word of knownWords) {
    const normalizedWord = normalizeText(word)
    const similarity = similarityScore(normalizedQuery, normalizedWord)
    
    if (similarity >= threshold) {
      // If query is shorter and similar, likely a typo
      if (normalizedQuery.length < normalizedWord.length * 0.7) {
        return word
      }
      // If query is similar enough, return correction
      if (similarity > 0.8) {
        return word
      }
    }
  }
  
  return null
}

/**
 * Extract keywords from search query
 */
export function extractKeywords(query: string): string[] {
  // Normalize and split by spaces
  const normalized = normalizeText(query)
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 1) // Remove single characters
    .filter(word => !/^[0-9]+$/.test(word)) // Remove pure numbers (keep them separately)
}

/**
 * Build search query variations for fuzzy matching
 * Includes: original, normalized, transliterated, synonym-expanded
 */
export function buildSearchVariations(query: string): string[] {
  const variations = new Set<string>()
  
  // Original query
  if (query.trim()) {
    variations.add(query.trim())
  }
  
  // Normalized (case-insensitive, trimmed)
  const normalized = normalizeText(query)
  if (normalized) {
    variations.add(normalized)
  }
  
  // Transliterated (Cyrillic → Latin, Russian → Uzbek)
  const transliterated = transliterate(query)
  if (transliterated && transliterated !== normalized) {
    variations.add(transliterated)
  }
  
  // Synonym-expanded
  const synonyms = expandSynonyms(query)
  synonyms.forEach(syn => {
    variations.add(syn)
    // Also normalize synonyms
    const normalizedSyn = normalizeText(syn)
    if (normalizedSyn) {
      variations.add(normalizedSyn)
    }
  })
  
  // Split and add individual words (for partial matching)
  const keywords = extractKeywords(query)
  keywords.forEach(keyword => {
    variations.add(keyword)
    const normalizedKeyword = normalizeText(keyword)
    if (normalizedKeyword && normalizedKeyword !== keyword) {
      variations.add(normalizedKeyword)
    }
  })
  
  return Array.from(variations).filter(v => v.length > 0)
}

/**
 * Build PostgreSQL search query for ILIKE matching
 * Uses OR conditions for all variations
 */
export function buildPostgresSearchQuery(query: string): string {
  const variations = buildSearchVariations(query)
  
  if (variations.length === 0) {
    return ''
  }
  
  // Create ILIKE conditions
  const conditions = variations.map(variation => {
    const escaped = variation.replace(/'/g, "''") // Escape single quotes
    return `(title ILIKE '%${escaped}%' OR description ILIKE '%${escaped}%')`
  })
  
  return conditions.join(' OR ')
}

/**
 * Score a listing based on search query relevance
 * Higher score = better match
 */
export function scoreListingRelevance(
  listing: { title: string; description: string },
  query: string
): number {
  let score = 0
  const variations = buildSearchVariations(query)
  const titleLower = normalizeText(listing.title)
  const descLower = normalizeText(listing.description)
  
  variations.forEach(variation => {
    const varLower = normalizeText(variation)
    
    // Exact match in title (highest score)
    if (titleLower === varLower) {
      score += 100
    }
    // Title contains variation (high score)
    else if (titleLower.includes(varLower)) {
      score += 50
    }
    // Description contains variation (medium score)
    else if (descLower.includes(varLower)) {
      score += 20
    }
    // Fuzzy match in title
    else {
      const titleSimilarity = similarityScore(titleLower, varLower)
      if (titleSimilarity > 0.7) {
        score += titleSimilarity * 30
      }
    }
  })
  
  return score
}

/**
 * Common Uzbek words that might be typed incorrectly
 * Used for typo correction
 */
export const COMMON_UZBEK_WORDS = [
  // Transport
  'kamaz', 'mashina', 'avtomobil', 'velosiped', 'mototsikl', 'yuk mashinasi',
  // Electronics
  'telefon', 'kompyuter', 'noutbuk', 'planshet', 'televizor', 'smartfon',
  // Real Estate
  'uy', 'kvartira', 'xonadon', 'uy-joy',
  // Furniture
  'mebel', 'stol', 'stul', 'divan', 'karavot',
  // Clothing
  'kiyim', 'futbolka', 'shim', 'ko\'ylak', 'poyabzal', 'botinka',
]

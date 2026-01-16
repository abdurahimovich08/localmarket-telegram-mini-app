/**
 * Clothing Taxonomy Utilities
 * 
 * Helper functions for taxonomy operations:
 * - Search and filtering
 * - Tag generation
 * - Suggestions
 * - Labels
 */

import {
  CLOTHING_TAXONOMY,
  type Audience,
  type Segment,
  type TaxonNode,
  getAudienceLabel,
  getSegmentLabel,
} from './clothing.uz'

export const audienceLabels: Record<Audience, string> = {
  erkaklar: 'Erkaklar',
  ayollar: 'Ayollar',
  bolalar: 'Bolalar',
  unisex: 'Barcha uchun',
}

export const segmentLabels: Record<Segment, string> = {
  kiyim: 'Kiyim',
  oyoq_kiyim: 'Oyoq kiyim',
  aksessuar: 'Aksessuar',
  ichki_kiyim: 'Ichki kiyim',
  sport: 'Sport',
  milliy: 'Milliy',
}

/**
 * Convert Uzbek text to slug (latin-ish)
 * - Lowercase
 * - Spaces → hyphens
 * - Remove apostrophes
 * - Normalize o'/g' → o/g
 * - Remove special characters
 * - Common alias mappings (krasofka → krossovka)
 */
export function toSlugUz(input: string | undefined | null): string {
  // Handle null/undefined
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Common alias mappings
  const aliases: Record<string, string> = {
    'krasofka': 'krossovka',
    'krasovka': 'krossovka',
    'krasofki': 'krossovka',
    'krasovki': 'krossovka',
  }
  
  const lower = input.toLowerCase().trim()
  const aliased = aliases[lower] || lower
  
  return aliased
    .replace(/[''`]/g, '') // Remove apostrophes
    .replace(/o['']/g, 'o') // o' → o
    .replace(/g['']/g, 'g') // g' → g
    .replace(/\s+/g, '-') // Spaces → hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special chars
    .replace(/-+/g, '-') // Multiple hyphens → single
    .replace(/^-|-$/g, '') // Trim hyphens
}

/**
 * Get all audiences with labels
 */
export function getAudiences(): Array<{ key: Audience; label: string }> {
  return Object.entries(audienceLabels).map(([key, label]) => ({
    key: key as Audience,
    label,
  }))
}

/**
 * Get segments that have leaves for given audience
 */
export function getSegmentsForAudience(audience: Audience): Array<{ key: Segment; label: string }> {
  const segments = new Set<Segment>()
  
  CLOTHING_TAXONOMY.forEach((node) => {
    if (node.audience === audience && node.leaf) {
      segments.add(node.segment)
    }
  })
  
  return Array.from(segments)
    .map((key) => ({
      key,
      label: segmentLabels[key],
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Get all leaf nodes for given audience and segment
 */
export function getLeaves(audience: Audience, segment: Segment): TaxonNode[] {
  return CLOTHING_TAXONOMY.filter(
    (node) => node.audience === audience && node.segment === segment && node.leaf
  ).sort((a, b) => a.labelUz.localeCompare(b.labelUz))
}

/**
 * Search leaves by query
 * 
 * @param query - Search query
 * @param audience - Optional audience filter
 * @param segment - Optional segment filter
 * @returns Top 60 matching leaves, ranked by relevance
 */
export function searchLeaves(
  query: string,
  audience?: Audience,
  segment?: Segment
): TaxonNode[] {
  let normalizedQuery = query.trim().toLowerCase()
  
  if (!normalizedQuery) {
    return []
  }
  
  // Normalize common variations
  const queryAliases: Record<string, string> = {
    'krasofka': 'krossovka',
    'krasovka': 'krossovka',
    'krasofki': 'krossovka',
    'krasovki': 'krossovka',
    'x': 'ks', // x → ks (common typo)
  }
  
  // Apply aliases
  normalizedQuery = queryAliases[normalizedQuery] || normalizedQuery
  
  // Filter by audience/segment if provided
  let candidates = CLOTHING_TAXONOMY.filter((node) => node.leaf)
  
  if (audience) {
    candidates = candidates.filter((node) => node.audience === audience)
  }
  
  if (segment) {
    candidates = candidates.filter((node) => node.segment === segment)
  }
  
  // Score each candidate
  const scored = candidates.map((node) => {
    let score = 0
    
    // Check labelUz
    const labelLower = node.labelUz.toLowerCase()
    if (labelLower.startsWith(normalizedQuery)) {
      score += 10 // Highest priority
    } else if (labelLower.includes(normalizedQuery)) {
      score += 5
    }
    
    // Check synonyms
    if (node.synonymsUz) {
      for (const synonym of node.synonymsUz) {
        const synLower = synonym.toLowerCase()
        if (synLower.startsWith(normalizedQuery)) {
          score += 8
          break
        } else if (synLower.includes(normalizedQuery)) {
          score += 3
          break
        }
      }
    }
    
    // Check pathUz
    const pathLower = node.pathUz.toLowerCase()
    if (pathLower.includes(normalizedQuery)) {
      score += 2
    }
    
    return { node, score }
  })
  
  // Sort by score (descending) and take top 60
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)
    .map((item) => item.node)
}

/**
 * Build tags array from selected taxonomy node
 * 
 * @param node - Selected taxonomy node
 * @param attributes - Optional attributes with brand_id, country_id, etc.
 * @returns Array of unique tags (max 12) - includes entity IDs for canonical matching
 */
export function buildTagsFromSelection(
  node: TaxonNode,
  attributes?: Record<string, any>
): string[] {
  const tags = new Set<string>()
  
  // Always include clothing
  tags.add('clothing')
  
  // Add audience tag
  if (node.audience && audienceLabels[node.audience]) {
    const audienceSlug = toSlugUz(audienceLabels[node.audience])
    if (audienceSlug) tags.add(audienceSlug)
  }
  
  // Add segment tag
  if (node.segment && segmentLabels[node.segment]) {
    const segmentSlug = toSlugUz(segmentLabels[node.segment])
    if (segmentSlug) tags.add(segmentSlug)
  }
  
  // Add canonical entity IDs (for search/filter)
  if (attributes) {
    // Brand ID (if available)
    if (attributes.brand_id) {
      tags.add(attributes.brand_id) // e.g., "brand_001"
    }
    // Country ID (if available)
    if (attributes.country_id) {
      tags.add(attributes.country_id) // e.g., "country_002"
    }
  }
  
  // Add path pieces from node.id (skip audience and segment duplicates)
  // Limit to 5 path parts to avoid too many tags
  const idParts = node.id.split('.')
  if (idParts.length > 2) {
    const leafParts = idParts.slice(2).slice(0, 5) // Max 5 parts
    for (const part of leafParts) {
      if (part) {
        tags.add(part)
      }
    }
  }
  
  // Add label slug
  const labelSlug = toSlugUz(node.labelUz)
  if (labelSlug) {
    tags.add(labelSlug)
  }
  
  // Convert to array, limit to 10 tags (ideal: 6-10)
  return Array.from(tags).slice(0, 10)
}

/**
 * Suggest leaves based on context
 * 
 * @param options - Search options
 * @returns Top 3 suggested leaves
 */
export function suggestLeaves(options: {
  audience?: Audience
  segment?: Segment
  keyword?: string
  season?: 'yoz' | 'qish' | 'bahor' | 'kuz'
}): TaxonNode[] {
  const { audience, segment, keyword, season } = options
  
  // If keyword provided, use search
  if (keyword && keyword.trim()) {
    const results = searchLeaves(keyword, audience, segment)
    return results.slice(0, 3)
  }
  
  // If season provided, suggest seasonal items
  if (season) {
    const seasonalItems: Record<string, string[]> = {
      yoz: ['futbolka', 'shorti', 'sandal', 'shippak', 'ko\'ylak', 'shorts', 'sandali'],
      qish: ['palto', 'kurtka', 'etik', 'dublyonka', 'shuba', 'termokiyim', 'uggi', 'botford'],
      bahor: ['vetrovka', 'trench', 'bomber', 'keda', 'sviter', 'pidjak'],
      kuz: ['vetrovka', 'trench', 'bomber', 'keda', 'sviter', 'pidjak'],
    }
    
    const seasonalKeywords = seasonalItems[season] || []
    
    // Try to find matches
    const candidates: TaxonNode[] = []
    for (const keyword of seasonalKeywords) {
      const results = searchLeaves(keyword, audience, segment)
      candidates.push(...results)
      if (candidates.length >= 3) break
    }
    
    if (candidates.length > 0) {
      // Deduplicate and return top 3
      const unique = new Map<string, TaxonNode>()
      for (const node of candidates) {
        if (!unique.has(node.id)) {
          unique.set(node.id, node)
          if (unique.size >= 3) break
        }
      }
      return Array.from(unique.values())
    }
  }
  
  // Fallback: return 3 popular generic leaves
  const fallbackItems: Record<string, string[]> = {
    kiyim: ['futbolka', 'jinsi', 'ko\'ylak'],
    oyoq_kiyim: ['krossovka', 'tufli', 'etik'],
    aksessuar: ['sumka', 'ryukzak', 'kamar'],
    ichki_kiyim: ['paypoq', 'pijama', 'termokiyim'],
    sport: ['sport_kostyum', 'sport_futbolka', 'trening_oyoq_kiyim'],
    milliy: ['chopon', 'do\'ppi', 'milliy_libos'],
  }
  
  const segmentKey = segment || 'kiyim'
  const keywords = fallbackItems[segmentKey] || fallbackItems.kiyim
  
  const results: TaxonNode[] = []
  for (const keyword of keywords) {
    const matches = searchLeaves(keyword, audience, segment)
    if (matches.length > 0) {
      results.push(matches[0])
      if (results.length >= 3) break
    }
  }
  
  // If still empty, return first 3 leaves for audience/segment
  if (results.length === 0) {
    const leaves = audience && segment 
      ? getLeaves(audience, segment)
      : CLOTHING_TAXONOMY.filter((n) => n.leaf).slice(0, 3)
    return leaves.slice(0, 3)
  }
  
  return results.slice(0, 3)
}

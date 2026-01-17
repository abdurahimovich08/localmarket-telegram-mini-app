/**
 * Smart Search System
 * 
 * Handles:
 * 1. Brand normalization (Nike, Nayk, Найк → Nike)
 * 2. Phonetic matching (sound-alike words)
 * 3. Clothing-specific synonyms
 * 4. Typo tolerance with common mistakes
 * 5. Multi-script support (Latin, Cyrillic)
 */

import { transliterate, normalizeText } from './transliteration'
import { levenshteinDistance, similarityScore } from './searchAlgorithms'

// ============================================
// BRAND NORMALIZATION
// ============================================

// Brand variations → Canonical name
const BRAND_MAPPINGS: Record<string, string[]> = {
  // Sports brands
  'nike': ['nayk', 'найк', 'найки', 'nayki', 'nayke', 'naike'],
  'adidas': ['адидас', 'adidos', 'addidas', 'adidass', 'adiddas'],
  'puma': ['пума', 'pumu', 'пумма'],
  'reebok': ['рибок', 'ribok', 'ribook', 'ребок'],
  'new balance': ['нью баланс', 'newbalance', 'new balans', 'ньюбаланс'],
  'under armour': ['андер армор', 'underarmour', 'under armor'],
  'asics': ['асикс', 'asix', 'assics'],
  'fila': ['фила', 'filla'],
  'converse': ['конверс', 'convers', 'konvers'],
  'vans': ['ванс', 'vanz'],
  
  // Fashion brands
  'zara': ['зара', 'zarro', 'zaara'],
  'h&m': ['hm', 'h m', 'эйчэнэм', 'h and m'],
  'gucci': ['гуччи', 'guchi', 'гучи', 'guci'],
  'louis vuitton': ['луи виттон', 'lv', 'лв', 'lui vitton', 'louis vitton'],
  'versace': ['версаче', 'versachi', 'versace'],
  'dolce gabbana': ['дольче габбана', 'dolce gabana', 'd&g', 'дг'],
  'armani': ['армани', 'armoni', 'армони'],
  'calvin klein': ['кельвин кляйн', 'ck', 'ск', 'kelvin klein'],
  'tommy hilfiger': ['томми хилфигер', 'tommy', 'tommi'],
  'lacoste': ['лакост', 'lacost', 'lakost'],
  'polo': ['поло', 'polo ralph lauren'],
  'levis': ['левис', 'левайс', 'levis', "levi's"],
  
  // Tech brands (for electronics)
  'samsung': ['самсунг', 'sumsung', 'samsng'],
  'apple': ['эпл', 'appl', 'epl'],
  'iphone': ['айфон', 'ayfon', 'ifone', 'i phone'],
  'xiaomi': ['сяоми', 'ксиаоми', 'xiomi', 'shaomi', 'шаоми'],
  'huawei': ['хуавей', 'huavey', 'huavei', 'хуавэй'],
  
  // Car brands
  'chevrolet': ['шевроле', 'shevrolet', 'chevrolet', 'шеви'],
  'nexia': ['нексия', 'neksiya', 'nexiya', 'neksia'],
  'lacetti': ['лачетти', 'laceti', 'lachetti', 'лачети'],
  'malibu': ['малибу', 'maliby', 'малибю'],
  'cobalt': ['кобальт', 'kobalt'],
  'spark': ['спарк'],
  'matiz': ['матиз', 'matiz', 'matiss'],
  'damas': ['дамас', 'damos'],
}

/**
 * Normalize brand name to canonical form
 */
export function normalizeBrand(input: string): string {
  if (!input) return ''
  
  const normalized = normalizeText(input)
  const transliterated = transliterate(input)
  
  // Check direct match
  for (const [canonical, variations] of Object.entries(BRAND_MAPPINGS)) {
    if (normalized === canonical || transliterated === canonical) {
      return canonical
    }
    
    for (const variation of variations) {
      if (normalized === variation || transliterated === variation) {
        return canonical
      }
      // Fuzzy match for typos
      if (similarityScore(normalized, variation) > 0.8) {
        return canonical
      }
    }
  }
  
  return normalized
}

/**
 * Get all brand variations for search
 */
export function getBrandVariations(brand: string): string[] {
  const normalized = normalizeBrand(brand)
  const variations = new Set<string>([normalized, brand.toLowerCase()])
  
  // Add all known variations
  if (BRAND_MAPPINGS[normalized]) {
    BRAND_MAPPINGS[normalized].forEach(v => variations.add(v))
  }
  
  // Check if brand is a variation
  for (const [canonical, vars] of Object.entries(BRAND_MAPPINGS)) {
    if (vars.includes(normalized)) {
      variations.add(canonical)
      vars.forEach(v => variations.add(v))
    }
  }
  
  return Array.from(variations)
}

// ============================================
// CLOTHING SYNONYMS
// ============================================

const CLOTHING_SYNONYMS: Record<string, string[]> = {
  // Footwear
  'krossovka': ['krassovka', 'krosovka', 'sport oyoq kiyimi', 'sportivka', 'sneaker', 'sniker', 'кроссовки', 'кроссовка'],
  'botinka': ['botinki', 'tufli', 'ayollar botinkasi', 'erkaklar botinkasi', 'ботинки'],
  'tufli': ['туфли', 'ayollar tufli', 'balandposhnali'],
  'shippak': ['shlepki', 'тапочки', 'tapochki', 'uy oyoq kiyimi'],
  'sandal': ['сандали', 'yozgi oyoq kiyimi', 'sandali'],
  'etik': ['сапоги', 'sapogi', 'uzun botinka', 'qishki oyoq kiyim'],
  
  // Upper body
  'futbolka': ['футболка', 'tshirt', 't-shirt', 'mayka', 'майка'],
  'ko\'ylak': ['рубашка', 'rubashka', 'shirt', 'ko`ylak', 'koylak'],
  'kurtka': ['куртка', 'kurtka', 'jacket', 'jaket'],
  'palto': ['пальто', 'coat', 'kou'],
  'sviter': ['свитер', 'sweater', 'suiter'],
  'hoodie': ['худи', 'xudi', 'kapushonli'],
  'bomber': ['бомбер', 'bomber kurtka'],
  
  // Lower body
  'shim': ['брюки', 'bryuki', 'pants', 'shtani', 'штаны'],
  'jinsi': ['джинсы', 'jeans', 'jins', 'джинс'],
  'shorty': ['шорты', 'shorts', 'qisqa shim'],
  'yubka': ['юбка', 'skirt'],
  
  // Full body
  'kostyum': ['костюм', 'suit', 'klassik kostyum'],
  'sport forma': ['спортивный костюм', 'trenirovka kiyimi', 'sportivka'],
  'ko\'ylak-libos': ['платье', 'dress', 'platie', 'plat\'e'],
  
  // Accessories
  'kepka': ['кепка', 'cap', 'bosh kiyim', 'shapka'],
  'sharf': ['шарф', 'scarf', 'boyunbog\''],
  'sumka': ['сумка', 'bag', 'sumka'],
  'kamar': ['ремень', 'belt', 'remen'],
  
  // General
  'kiyim': ['одежда', 'odejda', 'clothes'],
  'oyoq kiyim': ['обувь', 'obuv', 'poyabzal', 'footwear'],
  'aksessuar': ['аксессуары', 'accessories'],
}

/**
 * Get clothing synonyms for search
 */
export function getClothingSynonyms(term: string): string[] {
  const normalized = normalizeText(term)
  const transliterated = transliterate(term)
  const synonyms = new Set<string>([normalized])
  
  // Direct match
  if (CLOTHING_SYNONYMS[normalized]) {
    CLOTHING_SYNONYMS[normalized].forEach(s => synonyms.add(s))
  }
  
  // Check if term is a synonym
  for (const [key, syns] of Object.entries(CLOTHING_SYNONYMS)) {
    if (syns.includes(normalized) || syns.includes(transliterated)) {
      synonyms.add(key)
      syns.forEach(s => synonyms.add(s))
    }
  }
  
  // Fuzzy match
  for (const [key, syns] of Object.entries(CLOTHING_SYNONYMS)) {
    if (similarityScore(normalized, key) > 0.75) {
      synonyms.add(key)
      syns.forEach(s => synonyms.add(s))
    }
    for (const syn of syns) {
      if (similarityScore(normalized, syn) > 0.75) {
        synonyms.add(key)
        syns.forEach(s => synonyms.add(s))
      }
    }
  }
  
  return Array.from(synonyms)
}

// ============================================
// PHONETIC MATCHING (Soundex-like for Uzbek)
// ============================================

// Uzbek phonetic groups (similar sounding letters)
const PHONETIC_GROUPS: Record<string, string> = {
  // Vowels
  'a': 'A', 'o': 'A', 'u': 'A',
  'e': 'E', 'i': 'E',
  // Hard consonants
  'k': 'K', 'q': 'K', 'g': 'K', 'x': 'K', 'h': 'K',
  // Soft consonants
  's': 'S', 'z': 'S', 'ts': 'S', 'c': 'S',
  'sh': 'SH', 'ch': 'SH', 'j': 'SH', 'zh': 'SH',
  // Labials
  'b': 'B', 'p': 'B', 'v': 'B', 'f': 'B',
  // Dentals
  't': 'T', 'd': 'T',
  // Liquids
  'l': 'L', 'r': 'L',
  // Nasals
  'm': 'M', 'n': 'M', 'ng': 'M',
  // Semivowels
  'y': 'Y', 'w': 'Y',
}

/**
 * Generate phonetic code for a word (simplified Soundex for Uzbek)
 */
export function phoneticCode(word: string): string {
  if (!word) return ''
  
  const normalized = normalizeText(word)
  let code = ''
  let prevGroup = ''
  
  for (let i = 0; i < normalized.length; i++) {
    // Check for digraphs first
    const digraph = normalized.substring(i, i + 2)
    let char = normalized[i]
    
    if (PHONETIC_GROUPS[digraph]) {
      const group = PHONETIC_GROUPS[digraph]
      if (group !== prevGroup) {
        code += group
        prevGroup = group
      }
      i++ // Skip next char
    } else if (PHONETIC_GROUPS[char]) {
      const group = PHONETIC_GROUPS[char]
      if (group !== prevGroup) {
        code += group
        prevGroup = group
      }
    }
  }
  
  // Keep first 6 characters
  return code.substring(0, 6)
}

/**
 * Check if two words sound similar
 */
export function soundsSimilar(word1: string, word2: string): boolean {
  const code1 = phoneticCode(word1)
  const code2 = phoneticCode(word2)
  
  if (!code1 || !code2) return false
  
  // Exact phonetic match
  if (code1 === code2) return true
  
  // Similar phonetic match (allow 1 difference)
  const minLen = Math.min(code1.length, code2.length)
  if (minLen < 2) return false
  
  let differences = 0
  for (let i = 0; i < minLen; i++) {
    if (code1[i] !== code2[i]) differences++
  }
  
  return differences <= 1
}

// ============================================
// COMMON TYPOS
// ============================================

const COMMON_TYPOS: Record<string, string> = {
  // Keyboard adjacency typos
  'krossofka': 'krossovka',
  'krasovka': 'krossovka',
  'futbolga': 'futbolka',
  'shimlar': 'shim',
  'jinslar': 'jinsi',
  'botinkalar': 'botinka',
  
  // Vowel confusion
  'korssovka': 'krossovka',
  'korsovka': 'krossovka',
  'fotbolka': 'futbolka',
  
  // Double letter mistakes
  'krosovka': 'krossovka',
  'adiddas': 'adidas',
  'nikke': 'nike',
}

/**
 * Correct common typos
 */
export function correctTypo(word: string): string {
  const normalized = normalizeText(word)
  return COMMON_TYPOS[normalized] || normalized
}

// ============================================
// UNIFIED SMART SEARCH
// ============================================

export interface SmartSearchResult {
  originalQuery: string
  normalizedQuery: string
  searchVariations: string[]
  brandMatch?: string
  suggestedCorrection?: string
  synonyms: string[]
}

/**
 * Build comprehensive search query with all enhancements
 */
export function buildSmartSearch(query: string): SmartSearchResult {
  const normalized = normalizeText(query)
  const transliterated = transliterate(query)
  const variations = new Set<string>()
  const synonyms = new Set<string>()
  
  // Add original and normalized
  variations.add(query.trim())
  variations.add(normalized)
  variations.add(transliterated)
  
  // Correct typos
  const corrected = correctTypo(normalized)
  if (corrected !== normalized) {
    variations.add(corrected)
  }
  
  // Split into words and process each
  const words = normalized.split(/\s+/).filter(w => w.length > 1)
  
  for (const word of words) {
    // Add word variations
    variations.add(word)
    variations.add(correctTypo(word))
    
    // Check for brand
    const brand = normalizeBrand(word)
    if (brand !== word) {
      getBrandVariations(brand).forEach(v => variations.add(v))
    }
    
    // Get clothing synonyms
    getClothingSynonyms(word).forEach(s => {
      synonyms.add(s)
      variations.add(s)
    })
  }
  
  // Find brand match
  let brandMatch: string | undefined
  for (const word of words) {
    const brand = normalizeBrand(word)
    if (BRAND_MAPPINGS[brand]) {
      brandMatch = brand
      break
    }
  }
  
  // Suggest correction if query might have typos
  let suggestedCorrection: string | undefined
  if (corrected !== normalized && levenshteinDistance(corrected, normalized) <= 2) {
    suggestedCorrection = corrected
  }
  
  return {
    originalQuery: query,
    normalizedQuery: normalized,
    searchVariations: Array.from(variations).filter(v => v.length > 0),
    brandMatch,
    suggestedCorrection,
    synonyms: Array.from(synonyms)
  }
}

/**
 * Score listing relevance with smart matching
 */
export function smartScoreRelevance(
  listing: { 
    title: string
    description: string
    attributes?: {
      brand?: string
      tags?: string[]
      taxonomy?: any
    }
  },
  query: string
): number {
  let score = 0
  const search = buildSmartSearch(query)
  
  const titleLower = normalizeText(listing.title)
  const descLower = normalizeText(listing.description)
  
  // Check all variations
  for (const variation of search.searchVariations) {
    const varLower = normalizeText(variation)
    
    // Exact title match (highest)
    if (titleLower === varLower) {
      score += 100
    }
    // Title contains variation
    else if (titleLower.includes(varLower)) {
      score += 50
    }
    // Description contains variation
    else if (descLower.includes(varLower)) {
      score += 25
    }
    // Phonetic match in title
    else if (soundsSimilar(titleLower, varLower)) {
      score += 30
    }
    // Fuzzy match
    else {
      const similarity = similarityScore(titleLower, varLower)
      if (similarity > 0.7) {
        score += similarity * 20
      }
    }
  }
  
  // Brand match bonus
  if (search.brandMatch && listing.attributes?.brand) {
    const listingBrand = normalizeBrand(listing.attributes.brand)
    if (listingBrand === search.brandMatch) {
      score += 40
    }
  }
  
  // Tag match bonus
  if (listing.attributes?.tags && search.synonyms.length > 0) {
    const tags = listing.attributes.tags.map(t => normalizeText(t))
    for (const synonym of search.synonyms) {
      if (tags.includes(normalizeText(synonym))) {
        score += 15
      }
    }
  }
  
  return score
}

// ============================================
// RECOMMENDATION ENGINE
// ============================================

/**
 * Find similar listings based on attributes
 */
export function findSimilarByAttributes(
  targetListing: {
    category: string
    attributes?: {
      brand?: string
      tags?: string[]
      taxonomy?: {
        audience?: string
        segment?: string
        labelUz?: string
      }
    }
  },
  allListings: Array<{
    listing_id: string
    category: string
    attributes?: any
  }>
): Array<{ listing_id: string; similarityScore: number }> {
  const results: Array<{ listing_id: string; similarityScore: number }> = []
  
  for (const listing of allListings) {
    let score = 0
    
    // Same category
    if (listing.category === targetListing.category) {
      score += 20
    }
    
    // Same brand
    if (targetListing.attributes?.brand && listing.attributes?.brand) {
      const targetBrand = normalizeBrand(targetListing.attributes.brand)
      const listingBrand = normalizeBrand(listing.attributes.brand)
      if (targetBrand === listingBrand) {
        score += 30
      }
    }
    
    // Same taxonomy (audience, segment)
    if (targetListing.attributes?.taxonomy && listing.attributes?.taxonomy) {
      if (targetListing.attributes.taxonomy.audience === listing.attributes?.taxonomy?.audience) {
        score += 15 // Same gender/audience
      }
      if (targetListing.attributes.taxonomy.segment === listing.attributes?.taxonomy?.segment) {
        score += 15 // Same segment (oyoq kiyim, ustki kiyim, etc.)
      }
      if (targetListing.attributes.taxonomy.labelUz === listing.attributes?.taxonomy?.labelUz) {
        score += 25 // Same exact item type
      }
    }
    
    // Matching tags
    if (targetListing.attributes?.tags && listing.attributes?.tags) {
      const targetTags = new Set(targetListing.attributes.tags.map(t => normalizeText(t)))
      const listingTags = listing.attributes.tags.map((t: string) => normalizeText(t))
      
      let matchingTags = 0
      for (const tag of listingTags) {
        if (targetTags.has(tag)) {
          matchingTags++
        }
      }
      
      score += matchingTags * 5
    }
    
    if (score > 0) {
      results.push({ listing_id: listing.listing_id, similarityScore: score })
    }
  }
  
  // Sort by score (descending)
  return results.sort((a, b) => b.similarityScore - a.similarityScore)
}

/**
 * Uzbek Synonyms Database
 * Maps search terms to their synonyms for better search results
 */

// Real Estate Synonyms
const REAL_ESTATE_SYNONYMS: Record<string, string[]> = {
  'kuchmas mulk': ['uy', 'kvartira', 'xonadon', 'uy-joy', 'kvartira', 'uy sotish', 'uy ijaraga'],
  'uy': ['kvartira', 'xonadon', 'uy-joy', 'kuchmas mulk', 'uy sotish'],
  'kvartira': ['uy', 'xonadon', 'uy-joy', 'kuchmas mulk'],
  'xonadon': ['uy', 'kvartira', 'uy-joy'],
  'uy sotish': ['kvartira sotish', 'uy-joy sotish', 'kuchmas mulk sotish'],
  'uy ijaraga': ['kvartira ijaraga', 'uy-joy ijaraga'],
}

// Transport Synonyms
const TRANSPORT_SYNONYMS: Record<string, string[]> = {
  'kamaz': ['yuk mashinasi', 'yuk avtomobili', 'yuk mashina', 'yuk mashinasi sotish'],
  'mashina': ['avtomobil', 'mashina sotish', 'avtomobil sotish'],
  'avtomobil': ['mashina', 'avto', 'avtomobil sotish', 'mashina sotish'],
  'yuk mashinasi': ['kamaz', 'yuk avtomobili', 'yuk mashina'],
  'mototsikl': ['motosikl', 'mototsikl sotish', 'motosikl sotish'],
  'velosiped': ['velo', 'velosiped sotish'],
}

// Electronics Synonyms
const ELECTRONICS_SYNONYMS: Record<string, string[]> = {
  'telefon': ['smartfon', 'telefon sotish', 'smartfon sotish'],
  'smartfon': ['telefon', 'mobil telefon'],
  'kompyuter': ['komp', 'kompyuter sotish', 'komp sotish'],
  'noutbuk': ['laptop', 'noutbuk sotish', 'laptop sotish'],
  'planshet': ['planshet sotish', 'planshet'],
  'televizor': ['tv', 'televizor sotish', 'tv sotish'],
}

// Furniture Synonyms
const FURNITURE_SYNONYMS: Record<string, string[]> = {
  'mebel': ['mebel sotish', 'uy mebeli'],
  'stol': ['stol sotish', 'jurnal stoli', 'oshxona stoli'],
  'divan': ['divan sotish', 'sofalar'],
  'karavot': ['krovat', 'karavot sotish', 'krovat sotish'],
}

// Clothing Synonyms
const CLOTHING_SYNONYMS: Record<string, string[]> = {
  'kiyim': ['kiyim sotish', 'yangi kiyim'],
  'poyabzal': ['botinka', 'poyabzal sotish', 'botinka sotish'],
  'botinka': ['poyabzal', 'etiklari'],
}

// Russian → Uzbek mappings (for Russian users)
const RUSSIAN_TO_UZBEK: Record<string, string[]> = {
  'дом': ['uy', 'kvartira', 'xonadon'],
  'квартира': ['kvartira', 'uy', 'xonadon'],
  'машина': ['mashina', 'avtomobil'],
  'автомобиль': ['avtomobil', 'mashina'],
  'телефон': ['telefon', 'smartfon'],
  'ноутбук': ['noutbuk', 'laptop'],
  'мебель': ['mebel'],
  'одежда': ['kiyim'],
  'обувь': ['poyabzal', 'botinka'],
}

// Combined synonyms map
const ALL_SYNONYMS: Record<string, string[]> = {
  ...REAL_ESTATE_SYNONYMS,
  ...TRANSPORT_SYNONYMS,
  ...ELECTRONICS_SYNONYMS,
  ...FURNITURE_SYNONYMS,
  ...CLOTHING_SYNONYMS,
  ...RUSSIAN_TO_UZBEK,
}

/**
 * Expand a search query with synonyms
 * Returns array of all variations including original
 */
export function expandSynonyms(query: string): string[] {
  const synonyms = new Set<string>()
  const normalizedQuery = query.toLowerCase().trim()
  
  // Add original query
  if (normalizedQuery) {
    synonyms.add(normalizedQuery)
  }
  
  // Check if query matches a synonym key
  if (ALL_SYNONYMS[normalizedQuery]) {
    ALL_SYNONYMS[normalizedQuery].forEach(syn => {
      synonyms.add(syn.toLowerCase())
    })
  }
  
  // Also check if query contains any synonym key
  Object.keys(ALL_SYNONYMS).forEach(key => {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      // Add all synonyms for this key
      ALL_SYNONYMS[key].forEach(syn => {
        synonyms.add(syn.toLowerCase())
      })
    }
  })
  
  // Check partial matches (for multi-word queries like "kuchmas mulk")
  const words = normalizedQuery.split(/\s+/)
  words.forEach(word => {
    if (ALL_SYNONYMS[word]) {
      ALL_SYNONYMS[word].forEach(syn => {
        synonyms.add(syn.toLowerCase())
        // Also try replacing the word in original query
        const replaced = normalizedQuery.replace(word, syn)
        if (replaced !== normalizedQuery) {
          synonyms.add(replaced)
        }
      })
    }
  })
  
  return Array.from(synonyms)
}

/**
 * Get synonyms for a specific word
 */
export function getSynonyms(word: string): string[] {
  const normalized = word.toLowerCase().trim()
  return ALL_SYNONYMS[normalized] || []
}

/**
 * Check if two words are synonyms
 */
export function areSynonyms(word1: string, word2: string): boolean {
  const syns1 = getSynonyms(word1.toLowerCase())
  const syns2 = getSynonyms(word2.toLowerCase())
  
  return (
    syns1.includes(word2.toLowerCase()) ||
    syns2.includes(word1.toLowerCase()) ||
    word1.toLowerCase() === word2.toLowerCase()
  )
}

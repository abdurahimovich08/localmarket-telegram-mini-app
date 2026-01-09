// Category validation and keyword matching
import type { ListingCategory } from '../types'

/**
 * Category keywords mapping (Uzbek + English)
 */
export const CATEGORY_KEYWORDS: Record<ListingCategory, string[]> = {
  electronics: [
    // Uzbek
    'telefon', 'smartfon', 'kompyuter', 'noutbuk', 'laptop', 'planshet', 'tablet',
    'naushnik', 'quloqchin', 'telefon', 'televizor', 'tv', 'monitor', 'printer',
    'kamera', 'foto', 'video', 'radio', 'magnitofon', 'televizor', 'musiqa',
    'elektronika', 'gadjet', 'qurilma',
    // English
    'phone', 'smartphone', 'computer', 'laptop', 'tablet', 'headphone', 'earphone',
    'camera', 'tv', 'television', 'monitor', 'printer', 'gadget', 'device'
  ],
  clothing: [
    // Uzbek
    'kiyim', 'ko\'ylak', 'shim', 'futbolka', 'palto', 'kurtka', 'jensiy', 'dyinsiy',
    'oyoq kiyim', 'tufli', 'botinka', 'krossovka', 'etika', 'shim', 'shorts',
    'ko\'ylak', 'bluzka', 'platye', 'sariq', 'yubka', 'sarafan', 'kostyum',
    'pidjak', 'sweater', 'sviter', 'tolstovka', 'xudi', 'kapshon',
    // English
    'clothing', 'clothes', 'shirt', 'pants', 'jeans', 'jacket', 'coat', 'shoes',
    'sneakers', 'boots', 'dress', 'skirt', 'suit', 'sweater', 'hoodie'
  ],
  furniture: [
    // Uzbek
    'stul', 'divan', 'stol', 'yotoq', 'shkaf', 'komod', 'o\'rindiq', 'kreslo',
    'parta', 'polka', 'ro\'zg\'or', 'mebellar', 'uy jihozlari', 'mehmonxona',
    'xonadon', 'mebellari',
    // English
    'chair', 'sofa', 'table', 'bed', 'wardrobe', 'cabinet', 'desk', 'shelf',
    'furniture', 'furnishings', 'home', 'living room'
  ],
  baby_kids: [
    // Uzbek
    'bola', 'chaqaloq', 'bolalar', 'o\'yinchoq', 'mashina', 'qo\'g\'irchoq',
    'bolalar kiyimi', 'chakana', 'puska', 'kolyaska', 'oyna', 'bolalar o\'yinchoqlari',
    // English
    'baby', 'kid', 'children', 'toy', 'doll', 'baby clothes', 'stroller', 'crib'
  ],
  home_garden: [
    // Uzbek
    'uy', 'xona', 'bog\'', 'o\'simlik', 'gul', 'lagan', 'vaza', 'shift',
    'parda', 'gilam', 'matras', 'yostiq', 'sochiq', 'non', 'non', 'sochiq',
    'uy bezaklari', 'dekoratsiya',
    // English
    'home', 'garden', 'plant', 'flower', 'pot', 'vase', 'curtain', 'carpet',
    'mattress', 'pillow', 'towel', 'decoration', 'decor'
  ],
  games_hobbies: [
    // Uzbek
    'o\'yin', 'o\'yinchoq', 'karta', 'shaxmat', 'narde', 'dama', 'konso\'l',
    'playstation', 'xbox', 'nintendo', 'videogame', 'o\'yinlar',
    // English
    'game', 'toy', 'card', 'chess', 'console', 'playstation', 'xbox', 'hobby'
  ],
  books_media: [
    // Uzbek
    'kitob', 'jurnal', 'gazeta', 'dvd', 'cd', 'disk', 'musiqa', 'kino',
    'audio', 'video', 'kitoblar', 'adabiyot',
    // English
    'book', 'magazine', 'newspaper', 'dvd', 'cd', 'music', 'movie', 'audio'
  ],
  sports_outdoors: [
    // Uzbek
    'sport', 'idman', 'velosiped', 'velik', 'mashina', 'yugurish', 'futbol',
    'basketbol', 'voleybol', 'tennis', 'idman jihozlari', 'mashq', 'fitnes',
    // English
    'sport', 'bicycle', 'bike', 'running', 'football', 'basketball', 'tennis',
    'fitness', 'exercise', 'outdoor'
  ],
  other: [] // Catch-all category
}

/**
 * Related categories (for recommendation)
 */
export const RELATED_CATEGORIES: Record<ListingCategory, ListingCategory[]> = {
  electronics: ['games_hobbies', 'home_garden'],
  clothing: ['baby_kids', 'home_garden'],
  furniture: ['home_garden', 'other'],
  baby_kids: ['clothing', 'games_hobbies'],
  home_garden: ['furniture', 'other'],
  games_hobbies: ['electronics', 'books_media'],
  books_media: ['games_hobbies', 'other'],
  sports_outdoors: ['clothing', 'other'],
  other: []
}

/**
 * Validate if listing category matches its content
 */
export const validateCategory = (
  category: ListingCategory,
  title: string,
  description: string
): { isValid: boolean; suggestedCategory?: ListingCategory; confidence: number } => {
  const text = `${title} ${description}`.toLowerCase()
  const keywords = CATEGORY_KEYWORDS[category] || []
  
  // Check if any keywords from the category appear in the text
  const matchedKeywords = keywords.filter(keyword => text.includes(keyword.toLowerCase()))
  const confidence = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0
  
  // If confidence is low, try to find a better category
  if (confidence < 0.3 && keywords.length > 0) {
    let bestMatch: ListingCategory | null = null
    let bestScore = 0
    
    for (const [cat, catKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (cat === category || cat === 'other') continue
      
      const matches = catKeywords.filter(keyword => text.includes(keyword.toLowerCase()))
      const score = catKeywords.length > 0 ? matches.length / catKeywords.length : 0
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = cat as ListingCategory
      }
    }
    
    // Only suggest if we found a much better match
    if (bestMatch && bestScore > confidence * 1.5) {
      return {
        isValid: false,
        suggestedCategory: bestMatch,
        confidence: bestScore
      }
    }
  }
  
  return {
    isValid: confidence >= 0.3 || keywords.length === 0, // 'other' category is always valid
    confidence
  }
}

/**
 * Auto-detect category from title and description
 */
export const detectCategory = (title: string, description: string): ListingCategory => {
  const text = `${title} ${description}`.toLowerCase()
  let bestCategory: ListingCategory = 'other'
  let bestScore = 0
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue
    
    const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()))
    const score = matches.length / Math.max(keywords.length, 1)
    
    if (score > bestScore) {
      bestScore = score
      bestCategory = category as ListingCategory
    }
  }
  
  // Only return detected category if confidence is reasonable
  return bestScore >= 0.2 ? bestCategory : 'other'
}

/**
 * Check if text contains vehicle-related keywords (kamaz, mashina, etc.)
 */
export const containsVehicleKeywords = (text: string): boolean => {
  const vehicleKeywords = [
    'kamaz', 'mashina', 'avtomobil', 'moshina', 'yengil mashina', 'yuk mashinasi',
    'moto', 'mototsikl', 'velosiped', 'velik', 'skuter', 'car', 'truck', 'vehicle',
    'avto', 'avtomobil', 'yuk mashina'
  ]
  
  const lowerText = text.toLowerCase()
  return vehicleKeywords.some(keyword => lowerText.includes(keyword))
}

/**
 * Enhanced category validation with vehicle check
 */
export const validateCategoryStrict = (
  category: ListingCategory,
  title: string,
  description: string
): { isValid: boolean; suggestedCategory?: ListingCategory; reason?: string } => {
  const text = `${title} ${description}`
  
  // Special case: vehicles should not be in clothing
  if (category === 'clothing' && containsVehicleKeywords(text)) {
    return {
      isValid: false,
      suggestedCategory: 'other',
      reason: 'Transport vositalari kiyimlar kategoriyasiga mos kelmaydi'
    }
  }
  
  // General validation
  const validation = validateCategory(category, title, description)
  
  return {
    isValid: validation.isValid,
    suggestedCategory: validation.suggestedCategory,
    reason: validation.isValid ? undefined : 'Kategoriya va e\'lon mazmuni mos kelmaydi'
  }
}

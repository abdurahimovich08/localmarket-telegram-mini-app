/**
 * Transliteration for Multi-Script Support
 * Converts Cyrillic → Latin, Russian → Uzbek
 */

// Cyrillic to Latin mapping (Uzbek)
const CYRILLIC_TO_LATIN: Record<string, string> = {
  // Vowels
  'А': 'A', 'а': 'a',
  'Б': 'B', 'б': 'b',
  'В': 'V', 'в': 'v',
  'Г': 'G', 'г': 'g',
  'Д': 'D', 'д': 'd',
  'Е': 'E', 'е': 'e',
  'Ё': 'Yo', 'ё': 'yo',
  'Ж': 'Zh', 'ж': 'zh',
  'З': 'Z', 'з': 'z',
  'И': 'I', 'и': 'i',
  'Й': 'Y', 'й': 'y',
  'К': 'K', 'к': 'k',
  'Л': 'L', 'л': 'l',
  'М': 'M', 'м': 'm',
  'Н': 'N', 'н': 'n',
  'О': 'O', 'о': 'o',
  'П': 'P', 'п': 'p',
  'Р': 'R', 'р': 'r',
  'С': 'S', 'с': 's',
  'Т': 'T', 'т': 't',
  'У': 'U', 'у': 'u',
  'Ф': 'F', 'ф': 'f',
  'Х': 'X', 'х': 'x',
  'Ц': 'Ts', 'ц': 'ts',
  'Ч': 'Ch', 'ч': 'ch',
  'Ш': 'Sh', 'ш': 'sh',
  'Щ': 'Shch', 'щ': 'shch',
  'Ъ': '', 'ъ': '',
  'Ы': 'Y', 'ы': 'y',
  'Ь': '', 'ь': '',
  'Э': 'E', 'э': 'e',
  'Ю': 'Yu', 'ю': 'yu',
  'Я': 'Ya', 'я': 'ya',
  // Uzbek-specific Cyrillic
  'Ғ': 'G\'', 'ғ': 'g\'',
  'Қ': 'Q', 'қ': 'q',
  'Ң': 'Ng', 'ң': 'ng',
  'Ө': 'O\'', 'ө': 'o\'',
  'Ҳ': 'H', 'ҳ': 'h',
  'Ў': 'O\'', 'ў': 'o\'',
}

// Russian → Uzbek keyword mappings
const RUSSIAN_TO_UZBEK_KEYWORDS: Record<string, string> = {
  // Real Estate
  'дом': 'uy',
  'квартира': 'kvartira',
  'недвижимость': 'kuchmas mulk',
  // Transport
  'машина': 'mashina',
  'автомобиль': 'avtomobil',
  'авто': 'mashina',
  'грузовик': 'kamaz',
  'велосипед': 'velosiped',
  'мотоцикл': 'mototsikl',
  // Electronics
  'телефон': 'telefon',
  'смартфон': 'smartfon',
  'компьютер': 'kompyuter',
  'ноутбук': 'noutbuk',
  'планшет': 'planshet',
  'телевизор': 'televizor',
  // Furniture
  'мебель': 'mebel',
  'стол': 'stol',
  'стул': 'stul',
  'диван': 'divan',
  'кровать': 'karavot',
  // Clothing
  'одежда': 'kiyim',
  'обувь': 'poyabzal',
  'рубашка': 'ko\'ylak',
  'брюки': 'shim',
}

/**
 * Transliterate Cyrillic text to Latin
 */
export function transliterateCyrillicToLatin(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    result += CYRILLIC_TO_LATIN[char] || char
  }
  return result
}

/**
 * Convert Russian keywords to Uzbek equivalents
 */
export function convertRussianKeywords(text: string): string {
  let result = text.toLowerCase()
  
  // Check for Russian keywords and replace
  Object.keys(RUSSIAN_TO_UZBEK_KEYWORDS).forEach(russian => {
    const regex = new RegExp(russian, 'gi')
    if (regex.test(result)) {
      result = result.replace(regex, RUSSIAN_TO_UZBEK_KEYWORDS[russian])
    }
  })
  
  return result
}

/**
 * Normalize text (remove accents, convert to lowercase, trim)
 */
export function normalizeText(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompose characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Main transliteration function
 * Handles Cyrillic → Latin and Russian → Uzbek
 */
export function transliterate(text: string): string {
  if (!text) return ''
  
  // First, convert Russian keywords to Uzbek
  let converted = convertRussianKeywords(text)
  
  // Check if text contains Cyrillic characters
  const hasCyrillic = /[А-Яа-яЁёҒғҚқҢңӨөҲҳЎў]/.test(converted)
  
  if (hasCyrillic) {
    // Transliterate Cyrillic to Latin
    converted = transliterateCyrillicToLatin(converted)
  }
  
  // Normalize the result
  return normalizeText(converted)
}

/**
 * Check if text contains Cyrillic characters
 */
export function isCyrillic(text: string): boolean {
  return /[А-Яа-яЁёҒғҚқҢңӨөҲҳЎў]/.test(text)
}

/**
 * Check if text contains Russian keywords
 */
export function hasRussianKeywords(text: string): boolean {
  const lower = text.toLowerCase()
  return Object.keys(RUSSIAN_TO_UZBEK_KEYWORDS).some(russian => 
    lower.includes(russian)
  )
}

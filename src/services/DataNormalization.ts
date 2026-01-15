/**
 * Data Normalization Service
 * 
 * Converts user input to normalized format for search and matching
 * 
 * 3-Layer Architecture:
 * 1. RAW - User input (unchanged)
 * 2. NORMALIZED - Cleaned and standardized
 * 3. CANONICAL - Platform entity ID (from database)
 */

export interface NormalizedField {
  raw: string
  norm: string
  canonical_id?: string
  display?: string
  confidence?: number
}

/**
 * Basic text normalization
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters (keep a-z, 0-9, space, dash)
 * - Normalize multiple spaces
 */
export function normalizeText(input: string | null | undefined): string {
  if (!input) return ''
  
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars (keep a-z, 0-9, space, dash)
    .replace(/\s+/g, ' ')           // Multiple spaces to single space
}

/**
 * Normalize brand name
 * - Remove spaces (brands usually don't have spaces)
 * - Handle common variations
 */
export function normalizeBrand(input: string | null | undefined): string {
  if (!input) return ''
  
  const normalized = normalizeText(input)
    .replace(/\s+/g, '')  // Remove all spaces
  
  // Handle common brand variations
  const variations: Record<string, string> = {
    'nike': 'nike',
    'nayk': 'nike',
    'найк': 'nike',
    'adidas': 'adidas',
    'адидас': 'adidas',
    'puma': 'puma',
    'пума': 'puma',
    'reebok': 'reebok',
    'рибок': 'reebok',
    'toyota': 'toyota',
    'тойота': 'toyota',
    'honda': 'honda',
    'хонда': 'honda',
    'samsung': 'samsung',
    'самсунг': 'samsung',
    'apple': 'apple',
    'эпл': 'apple',
  }
  
  // Check if normalized matches any variation
  const lower = normalized.toLowerCase()
  if (variations[lower]) {
    return variations[lower]
  }
  
  return normalized
}

/**
 * Normalize country name
 * - Handle multiple languages (UZ, RU, EN)
 * - Map to standard country codes
 */
export function normalizeCountry(input: string | null | undefined): string {
  if (!input) return ''
  
  const normalized = normalizeText(input)
  
  // Country name mappings (UZ, RU, EN → normalized)
  const countryMap: Record<string, string> = {
    // Uzbekistan
    'uzbekistan': 'uzbekistan',
    'o\'zbekiston': 'uzbekistan',
    'узбекистан': 'uzbekistan',
    'uz': 'uzbekistan',
    
    // Russia
    'russia': 'russia',
    'rossiya': 'russia',
    'россия': 'russia',
    'ru': 'russia',
    
    // China
    'china': 'china',
    'xitoy': 'china',
    'китай': 'china',
    'cn': 'china',
    
    // Turkey
    'turkey': 'turkey',
    'turkiya': 'turkey',
    'турция': 'turkey',
    'tr': 'turkey',
    
    // Korea
    'korea': 'korea',
    'koreya': 'korea',
    'корея': 'korea',
    'kr': 'korea',
    
    // USA
    'usa': 'usa',
    'america': 'usa',
    'amerika': 'usa',
    'америка': 'usa',
    'us': 'usa',
  }
  
  const lower = normalized.toLowerCase()
  if (countryMap[lower]) {
    return countryMap[lower]
  }
  
  return normalized
}

/**
 * Normalize price string to number
 * - Remove currency symbols
 * - Remove spaces
 * - Handle thousand separators
 * - Convert to number
 */
export function normalizePrice(input: string | null | undefined): number | null {
  if (!input) return null
  
  // Remove currency symbols and text
  let cleaned = String(input)
    .replace(/[^\d.,\s]/g, '')  // Keep only digits, dots, commas, spaces
    .replace(/\s+/g, '')         // Remove spaces
    .replace(/,/g, '')           // Remove commas (thousand separators)
  
  // Handle decimal separator
  const dotIndex = cleaned.indexOf('.')
  const commaIndex = cleaned.indexOf(',')
  
  if (dotIndex > -1 && commaIndex > -1) {
    // Both present - assume last one is decimal
    if (dotIndex > commaIndex) {
      cleaned = cleaned.replace(/,/g, '')
    } else {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    }
  } else if (commaIndex > -1) {
    // Only comma - check if decimal (if followed by 2 digits)
    const afterComma = cleaned.substring(commaIndex + 1)
    if (afterComma.length <= 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(',', '')
    }
  }
  
  const number = parseFloat(cleaned)
  return isNaN(number) ? null : number
}

/**
 * Normalize number string to number
 * - Remove non-numeric characters
 * - Handle decimal separators
 */
export function normalizeNumber(input: string | null | undefined): number | null {
  if (!input) return null
  
  let cleaned = String(input)
    .replace(/[^\d.,]/g, '')  // Keep only digits, dots, commas
    .replace(/,/g, '.')       // Convert comma to dot
  
  const number = parseFloat(cleaned)
  return isNaN(number) ? null : number
}

/**
 * Normalize phone number
 * - Remove all non-digits
 * - Handle country codes
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return ''
  
  return String(input)
    .replace(/\D/g, '')  // Remove all non-digits
}

/**
 * Normalize email
 * - Lowercase
 * - Trim whitespace
 */
export function normalizeEmail(input: string | null | undefined): string {
  if (!input) return ''
  
  return String(input)
    .toLowerCase()
    .trim()
}

/**
 * Create normalized field object
 */
export function createNormalizedField(
  raw: string,
  norm: string,
  canonical_id?: string,
  display?: string,
  confidence?: number
): NormalizedField {
  return {
    raw,
    norm,
    canonical_id,
    display,
    confidence,
  }
}

/**
 * Normalize multiple text fields at once
 */
export function normalizeFields(fields: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(fields)) {
    normalized[key] = normalizeText(value)
  }
  
  return normalized
}

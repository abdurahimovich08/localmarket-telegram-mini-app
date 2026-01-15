/**
 * Canonical Entities Service
 * 
 * Manages platform-known entities (brands, countries, etc.)
 * for 3-layer data normalization architecture
 */

import { supabase } from '../lib/supabase'
import { normalizeBrand, normalizeCountry, type NormalizedField } from './DataNormalization'

export interface Brand {
  id: string
  display_uz: string
  display_ru?: string
  display_en?: string
  aliases: string[]
  category?: string
  subcategory?: string
  logo_url?: string
  is_active: boolean
}

export interface Country {
  id: string
  display_uz: string
  display_ru?: string
  display_en?: string
  aliases: string[]
  code?: string
  region?: string
  is_active: boolean
}

export interface CarBrand {
  id: string
  display_uz: string
  display_ru?: string
  display_en?: string
  aliases: string[]
  country_id?: string
  logo_url?: string
  is_active: boolean
}

export interface EntityMatch {
  entity: Brand | Country | CarBrand
  confidence: number
  matched_alias?: string
}

/**
 * Find brand by normalized input
 */
export async function findBrand(
  normalized: string,
  category?: string
): Promise<Brand | null> {
  try {
    let query = supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .contains('aliases', [normalized])
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query.limit(1).single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null
      }
      console.error('Error finding brand:', error)
      return null
    }
    
    return data as Brand
  } catch (error) {
    console.error('Error finding brand:', error)
    return null
  }
}

/**
 * Find country by normalized input
 */
export async function findCountry(normalized: string): Promise<Country | null> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .contains('aliases', [normalized])
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error finding country:', error)
      return null
    }
    
    return data as Country
  } catch (error) {
    console.error('Error finding country:', error)
    return null
  }
}

/**
 * Find car brand by normalized input
 */
export async function findCarBrand(normalized: string): Promise<CarBrand | null> {
  try {
    const { data, error } = await supabase
      .from('car_brands')
      .select('*')
      .eq('is_active', true)
      .contains('aliases', [normalized])
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error finding car brand:', error)
      return null
    }
    
    return data as CarBrand
  } catch (error) {
    console.error('Error finding car brand:', error)
    return null
  }
}

/**
 * Match entity with confidence score
 */
export async function matchBrand(
  raw: string,
  category?: string
): Promise<EntityMatch | null> {
  const normalized = normalizeBrand(raw)
  
  // Exact match in aliases
  const brand = await findBrand(normalized, category)
  if (brand) {
    // Check if exact match
    const exactMatch = brand.aliases.some(alias => alias === normalized)
    return {
      entity: brand,
      confidence: exactMatch ? 0.95 : 0.85,
      matched_alias: normalized,
    }
  }
  
  // Fuzzy match (check if normalized is substring of any alias)
  try {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .limit(10)
    
    if (data) {
      for (const brand of data as Brand[]) {
        for (const alias of brand.aliases) {
          if (alias.includes(normalized) || normalized.includes(alias)) {
            // Calculate similarity
            const similarity = calculateSimilarity(normalized, alias)
            if (similarity > 0.7) {
              return {
                entity: brand,
                confidence: similarity * 0.9, // Lower confidence for fuzzy match
                matched_alias: alias,
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in fuzzy brand match:', error)
  }
  
  return null
}

/**
 * Match country with confidence score
 */
export async function matchCountry(raw: string): Promise<EntityMatch | null> {
  const normalized = normalizeCountry(raw)
  
  const country = await findCountry(normalized)
  if (country) {
    const exactMatch = country.aliases.some(alias => alias === normalized)
    return {
      entity: country,
      confidence: exactMatch ? 0.95 : 0.85,
      matched_alias: normalized,
    }
  }
  
  return null
}

/**
 * Calculate string similarity (simple Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Create brand entity (admin function)
 */
export async function createBrand(
  display_uz: string,
  aliases: string[],
  category?: string
): Promise<Brand | null> {
  try {
    // Generate ID
    const id = `brand_${Date.now().toString(36)}`
    
    const { data, error } = await supabase
      .from('brands')
      .insert({
        id,
        display_uz,
        aliases: aliases.map(a => a.toLowerCase()),
        category,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating brand:', error)
      return null
    }
    
    return data as Brand
  } catch (error) {
    console.error('Error creating brand:', error)
    return null
  }
}

/**
 * Get all active brands by category
 */
export async function getBrandsByCategory(category: string): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('display_uz')
    
    if (error) {
      console.error('Error getting brands:', error)
      return []
    }
    
    return (data || []) as Brand[]
  } catch (error) {
    console.error('Error getting brands:', error)
    return []
  }
}

/**
 * Data Post-Processing Service
 * 
 * Enriches AI output with canonical entities
 * Converts AI's 3-layer data to final database format
 */

import { normalizeBrand, normalizeCountry, normalizePrice, type NormalizedField } from './DataNormalization'
import { matchBrand, matchCountry, type EntityMatch } from './CanonicalEntities'

export interface ProcessedField {
  raw?: string
  norm?: string
  canonical_id?: string
  display?: string
  confidence?: number
  value?: any  // Final value (for non-entity fields)
}

export interface ProcessedData {
  core: Record<string, any>
  attributes: Record<string, any>
}

/**
 * Process AI output and enrich with canonical entities
 */
export async function processAIOutput(
  aiOutput: any,
  category: string
): Promise<ProcessedData> {
  const processed: ProcessedData = {
    core: { ...aiOutput.core },
    attributes: {},
  }

  // Process attributes
  for (const [key, value] of Object.entries(aiOutput.attributes || {})) {
    const processedField = await processField(key, value, category)
    
    // Merge all layers into attributes
    if (processedField.raw) {
      processed.attributes[`${key}_raw`] = processedField.raw
    }
    if (processedField.norm) {
      processed.attributes[`${key}_norm`] = processedField.norm
    }
    if (processedField.canonical_id) {
      processed.attributes[`${key}_id`] = processedField.canonical_id
    }
    if (processedField.display) {
      processed.attributes[`${key}_display`] = processedField.display
    }
    if (processedField.confidence !== undefined) {
      processed.attributes[`${key}_confidence`] = processedField.confidence
    }
    
    // Also keep the main value (for backward compatibility)
    processed.attributes[key] = processedField.value ?? value
  }

  return processed
}

/**
 * Process a single field
 */
async function processField(
  key: string,
  value: any,
  category: string
): Promise<ProcessedField> {
  const field: ProcessedField = {}

  // Handle brand fields
  if (key === 'brand' || key.includes('brand')) {
    return await processBrandField(value, category)
  }

  // Handle country fields
  if (key === 'country' || key.includes('country') || key === 'country_of_origin') {
    return await processCountryField(value)
  }

  // Handle price fields
  if (key === 'price' || key.includes('price')) {
    return await processPriceField(value)
  }

  // Handle number fields
  if (typeof value === 'string' && /^\d+/.test(value)) {
    const num = parseFloat(value.replace(/[^\d.,]/g, ''))
    if (!isNaN(num)) {
      field.value = num
      field.norm = num.toString()
      return field
    }
  }

  // Default: text field
  if (typeof value === 'string') {
    field.raw = value
    field.norm = value.toLowerCase().trim()
    field.value = value
    return field
  }

  // Default: keep as is
  field.value = value
  return field
}

/**
 * Process brand field
 */
async function processBrandField(
  value: any,
  category: string
): Promise<ProcessedField> {
  const field: ProcessedField = {}

  // If AI already provided 3-layer data
  if (typeof value === 'object' && value !== null) {
    field.raw = value.brand_raw || value.raw || String(value)
    field.norm = value.brand_norm || value.norm || normalizeBrand(field.raw)
    field.canonical_id = value.brand_id || value.canonical_id
    field.display = value.brand_display || value.display
    field.confidence = value.brand_confidence || value.confidence
    field.value = field.display || field.norm
  } else {
    // AI provided simple string, we need to process it
    const raw = String(value)
    const norm = normalizeBrand(raw)
    
    field.raw = raw
    field.norm = norm
    
    // Try to find canonical entity
    const match = await matchBrand(raw, category)
    if (match) {
      field.canonical_id = match.entity.id
      field.display = match.entity.display_uz
      field.confidence = match.confidence
      field.value = field.display
    } else {
      field.value = raw  // Keep original if no match
      field.confidence = 0.3
    }
  }

  return field
}

/**
 * Process country field
 */
async function processCountryField(value: any): Promise<ProcessedField> {
  const field: ProcessedField = {}

  // If AI already provided 3-layer data
  if (typeof value === 'object' && value !== null) {
    field.raw = value.country_raw || value.raw || String(value)
    field.norm = value.country_norm || value.norm || normalizeCountry(field.raw)
    field.canonical_id = value.country_id || value.canonical_id
    field.display = value.country_display || value.display
    field.confidence = value.country_confidence || value.confidence
    field.value = field.display || field.norm
  } else {
    // AI provided simple string
    const raw = String(value)
    const norm = normalizeCountry(raw)
    
    field.raw = raw
    field.norm = norm
    
    // Try to find canonical entity
    const match = await matchCountry(raw)
    if (match) {
      field.canonical_id = match.entity.id
      field.display = match.entity.display_uz
      field.confidence = match.confidence
      field.value = field.display
    } else {
      field.value = raw
      field.confidence = 0.3
    }
  }

  return field
}

/**
 * Process price field
 */
async function processPriceField(value: any): Promise<ProcessedField> {
  const field: ProcessedField = {}

  if (typeof value === 'object' && value !== null) {
    field.raw = value.price_raw || value.raw || String(value)
    field.norm = value.price_norm || value.norm
    field.value = normalizePrice(field.raw) || value.value
  } else {
    const raw = String(value)
    const normalized = normalizePrice(raw)
    
    field.raw = raw
    field.norm = normalized?.toString() || raw
    field.value = normalized
  }

  return field
}

/**
 * Enrich normalized field with canonical entity
 */
export async function enrichWithCanonical(
  field: NormalizedField,
  entityType: 'brand' | 'country',
  category?: string
): Promise<NormalizedField> {
  let match: EntityMatch | null = null

  if (entityType === 'brand') {
    match = await matchBrand(field.raw, category)
  } else if (entityType === 'country') {
    match = await matchCountry(field.raw)
  }

  if (match) {
    return {
      ...field,
      canonical_id: match.entity.id,
      display: match.entity.display_uz,
      confidence: match.confidence,
    }
  }

  return {
    ...field,
    confidence: 0.3,  // Low confidence if no match
  }
}

/**
 * Calculate confidence score based on match quality
 */
export function calculateConfidence(match: EntityMatch | null): number {
  if (!match) return 0.3
  
  return match.confidence
}

/**
 * Check if field needs admin review (low confidence)
 */
export function needsAdminReview(field: ProcessedField): boolean {
  if (field.confidence === undefined) return false
  return field.confidence < 0.7
}

/**
 * Get fields that need review
 */
export function getFieldsNeedingReview(data: ProcessedData): string[] {
  const fields: string[] = []

  for (const [key, value] of Object.entries(data.attributes)) {
    if (key.endsWith('_confidence')) {
      const confidence = value as number
      if (confidence < 0.7) {
        const fieldName = key.replace('_confidence', '')
        fields.push(fieldName)
      }
    }
  }

  return fields
}

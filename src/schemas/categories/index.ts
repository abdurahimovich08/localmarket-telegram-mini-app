/**
 * Category Schema Registry
 * Central export for all category schemas
 */

import { clothingSchema } from './clothing.schema'
import { realestateSchema } from './realestate.schema'
import { carSchema } from './car.schema'
import { foodSchema } from './food.schema'
import { serviceSchema } from './service.schema'
import type { CategorySchema, CategorySchemaRegistry } from './types'

/**
 * All available category schemas
 */
export const categorySchemas: CategorySchemaRegistry = {
  clothing: clothingSchema,
  realestate: realestateSchema,
  automotive: carSchema,
  car: carSchema, // Alias
  food: foodSchema,
  service: serviceSchema,
  // Add more categories as needed
}

/**
 * Get schema by category name
 */
export function getCategorySchema(category: string): CategorySchema | null {
  return categorySchemas[category] || null
}

/**
 * Get schema by entity type and category
 */
export function getSchema(entityType: 'product' | 'service', category: string): CategorySchema | null {
  const schema = getCategorySchema(category)
  if (!schema) return null
  if (schema.entityType !== entityType) return null
  return schema
}

/**
 * Get all required fields for a category
 */
export function getRequiredFields(schema: CategorySchema): string[] {
  return schema.fields
    .filter(field => field.required)
    .map(field => field.key)
}

/**
 * Check if all required fields are filled
 */
export function validateRequiredFields(
  schema: CategorySchema,
  data: { core: any; attributes: any }
): { valid: boolean; missing: string[] } {
  const required = getRequiredFields(schema)
  const missing: string[] = []

  for (const fieldKey of required) {
    const field = schema.fields.find(f => f.key === fieldKey)
    if (!field) continue

    // Skip fields that are excluded from validation (handled separately)
    // sizes and colors are now handled via stock_by_size_color
    if (fieldKey === 'sizes' || fieldKey === 'colors') {
      // Check if stock_by_size_color exists and has data
      const stockData = data.attributes?.stock_by_size_color
      if (!stockData || Object.keys(stockData).length === 0) {
        missing.push(field.label || fieldKey)
      }
      continue
    }

    // Check dependsOn condition - if field depends on another field, only validate if condition is met
    if (field.dependsOn) {
      const dependsOnValue = field.dependsOn.field in data.core
        ? data.core[field.dependsOn.field]
        : data.attributes[field.dependsOn.field]
      
      // If dependsOn condition is not met, skip validation for this field
      if (dependsOnValue !== field.dependsOn.value) {
        continue
      }
    }

    // Check in core or attributes
    const value = fieldKey in data.core 
      ? data.core[fieldKey]
      : data.attributes[fieldKey]

    // Handle array types
    if (field.type === 'array' || field.type === 'multi_select') {
      if (!Array.isArray(value) || value.length === 0) {
        missing.push(field.label || fieldKey)
      }
      continue
    }

    // Handle string types - check for empty string
    if (field.type === 'string') {
      const isEmpty = value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')
      if (isEmpty) {
        console.log(`Field ${fieldKey} (${field.label}) is missing or empty:`, {
          value,
          type: typeof value,
          isUndefined: value === undefined,
          isNull: value === null,
          isEmptyString: value === '',
          isWhitespace: typeof value === 'string' && value.trim() === ''
        })
        missing.push(field.label || fieldKey)
      }
      continue
    }

    // Handle other types
    if (value === undefined || value === null || value === '') {
      missing.push(field.label || fieldKey)
    }
  }

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Export all schemas
 */
export * from './types'
export * from './base'

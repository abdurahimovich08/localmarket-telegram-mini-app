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

    // Check in core or attributes
    const value = fieldKey in data.core 
      ? data.core[fieldKey]
      : data.attributes[fieldKey]

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

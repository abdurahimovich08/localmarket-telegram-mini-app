/**
 * Category Schema System - Type Definitions
 * 
 * This system defines field requirements, types, validation, and AI behavior
 * for each category in the marketplace.
 */

export type EntityType = 'product' | 'service'

export type FieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'multi_select'
  | 'date'
  | 'location'

export interface FieldSchema {
  key: string
  type: FieldType
  required: boolean
  label: string // Display label (Uzbek)
  placeholder?: string
  description?: string // Help text
  validation?: {
    min?: number
    max?: number
    pattern?: string
    minLength?: number
    maxLength?: number
  }
  enumOptions?: string[] // For enum/multi_select types
  aiQuestion?: string // Custom question for AI to ask
  aiExtraction?: string // Instructions for AI to extract this field
  defaultValue?: any
  dependsOn?: {
    field: string
    value: any
  } // Conditional field visibility
  // Normalization config (for 3-layer architecture)
  normalization?: {
    type: 'brand' | 'country' | 'number' | 'text' | 'price' | 'phone' | 'email'
    entityTable?: 'brands' | 'countries' | 'car_brands' | 'car_models'
    aliases?: string[] // Common aliases for this field
  }
}

export interface CategorySchema {
  entityType: EntityType
  category: string
  displayName: string // Uzbek display name
  emoji: string
  description?: string
  
  // Field definitions
  fields: FieldSchema[]
  
  // AI behavior
  aiInstructions?: {
    greeting?: string
    questionOrder?: string[] // Order of questions
    skipConditions?: {
      field: string
      condition: string
    }[]
  }
  
  // Validation rules
  validation?: {
    custom?: (data: any) => string | null // Returns error message or null
  }
}

/**
 * Unified AI output structure
 */
export interface UnifiedAIOutput {
  isFinished: boolean
  entityType: EntityType
  category: string
  core: {
    title: string
    description: string
    price?: number
    is_free?: boolean
    condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
    neighborhood?: string
    latitude?: number
    longitude?: number
  }
  attributes: Record<string, any> // Category-specific fields
  // Service-specific (only for services)
  serviceFields?: {
    priceType?: 'fixed' | 'hourly' | 'negotiable'
    price?: string
    tags?: string[]
  }
}

/**
 * Schema registry - all category schemas
 */
export type CategorySchemaRegistry = Record<string, CategorySchema>

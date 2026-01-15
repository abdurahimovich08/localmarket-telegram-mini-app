/**
 * Leaf-Level Field Profiling
 * 
 * Defines requiredFieldsOverride and suggestedFields for specific taxonomy leaves
 * This allows AI to ask more targeted questions based on the exact item type
 */

import type { TaxonNode } from './clothing.uz'

/**
 * Get field profile for a taxonomy node
 * Returns override fields if available, otherwise null
 */
export function getLeafFieldProfile(node: TaxonNode): {
  requiredFieldsOverride?: string[]
  suggestedFields?: string[]
} | null {
  // Use node's own profiling if available
  if (node.requiredFieldsOverride || node.suggestedFields) {
    return {
      requiredFieldsOverride: node.requiredFieldsOverride,
      suggestedFields: node.suggestedFields,
    }
  }
  
  // Pattern-based profiling (fallback)
  const id = node.id
  
  // Running shoes → terrain, size_eu
  if (id.includes('krossovka_yugurish') || id.includes('krossovka_yugurish')) {
    return {
      requiredFieldsOverride: ['brand', 'size', 'condition', 'price'],
      suggestedFields: ['terrain', 'size_eu', 'color', 'material'],
    }
  }
  
  // Evening dress → size, material, occasion, color
  if (id.includes('koylak_oqshom') || id.includes('libos') || id.includes('vecherniy')) {
    return {
      requiredFieldsOverride: ['brand', 'size', 'condition', 'price'],
      suggestedFields: ['material', 'color', 'occasion', 'length'],
    }
  }
  
  // Sport items → brand, size, condition
  if (id.includes('sport')) {
    return {
      requiredFieldsOverride: ['brand', 'size', 'condition', 'price'],
      suggestedFields: ['material', 'color', 'activity_type'],
    }
  }
  
  // Shoes → size, brand, condition
  if (node.segment === 'oyoq_kiyim') {
    return {
      requiredFieldsOverride: ['brand', 'size', 'condition', 'price'],
      suggestedFields: ['size_eu', 'color', 'material'],
    }
  }
  
  // Clothing → brand, size, condition
  if (node.segment === 'kiyim') {
    return {
      requiredFieldsOverride: ['brand', 'size', 'condition', 'price'],
      suggestedFields: ['color', 'material', 'season'],
    }
  }
  
  return null
}

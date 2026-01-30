/**
 * Clothing Taxonomy Registry
 * 
 * Separates UI configuration from taxonomy data
 * Makes it easy to add new categories (Avto, Elektronika, etc.) without rewriting Step 1
 */

import { CLOTHING_TAXONOMY, TaxonNode, Audience, Segment } from './clothing.uz'
import type { Icons8 } from '../utils/icons8'

export interface TaxonomyOption {
  value: Audience | Segment | string
  label: string
  iconName?: keyof typeof Icons8
  order?: number // For custom ordering
}

export interface TaxonomyRegistry {
  category: 'clothing' | 'car' | 'electronics' | 'realestate' | 'food' // Extendable
  audiences: TaxonomyOption[]
  segments: TaxonomyOption[]
  popularItems: string[] // IDs of popular items
  searchSynonyms?: Record<string, string[]> // Additional search terms
}

/**
 * Clothing Taxonomy Registry Configuration
 */
export const clothingTaxonomyRegistry: TaxonomyRegistry = {
  category: 'clothing',
  
  audiences: [
    { value: 'erkaklar', label: 'Erkaklar', iconName: 'product', order: 1 },
    { value: 'ayollar', label: 'Ayollar', iconName: 'product', order: 2 },
    { value: 'bolalar', label: 'Bolalar', iconName: 'product', order: 3 },
    { value: 'unisex', label: 'Unisex', iconName: 'product', order: 4 },
  ],
  
  segments: [
    { value: 'kiyim', label: 'Kiyim', iconName: 'product', order: 1 },
    { value: 'oyoq_kiyim', label: 'Oyoq kiyim', iconName: 'product', order: 2 },
    { value: 'aksessuar', label: 'Aksessuar', iconName: 'shoppingBag', order: 3 },
    { value: 'ichki_kiyim', label: 'Ichki kiyim', iconName: 'product', order: 4 },
    { value: 'sport', label: 'Sport kiyim', iconName: 'product', order: 5 },
    { value: 'milliy', label: 'Milliy kiyim', iconName: 'product', order: 6 },
  ],
  
  popularItems: [
    'krossovka',
    'koylak',
    'kurtka',
    'jinsi',
    'sumka',
    'sport_kostyum',
  ],
  
  searchSynonyms: {
    'krossovka': ['krasofka', 'krosovka', 'sneakers'],
    'koylak': ['ko\'ylak', 'rubashka'],
    'kurtka': ['kurtka', 'jacket'],
  },
}

/**
 * Get taxonomy registry by category
 */
export function getTaxonomyRegistry(category: string): TaxonomyRegistry | null {
  switch (category) {
    case 'clothing':
      return clothingTaxonomyRegistry
    // Future: case 'car': return carTaxonomyRegistry
    // Future: case 'electronics': return electronicsTaxonomyRegistry
    default:
      return null
  }
}

/**
 * Get popular items from registry
 */
export function getPopularItems(registry: TaxonomyRegistry): TaxonNode[] {
  return registry.popularItems
    .map(id => CLOTHING_TAXONOMY.find(n => n.id === id))
    .filter((n): n is TaxonNode => !!n)
}

/**
 * Get available segments for audience from registry
 */
export function getSegmentsForAudience(
  registry: TaxonomyRegistry,
  audience: Audience
): TaxonomyOption[] {
  const segments = new Set<Segment>()
  CLOTHING_TAXONOMY
    .filter(t => t.audience === audience)
    .forEach(t => segments.add(t.segment))
  
  return registry.segments
    .filter(s => segments.has(s.value as Segment))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

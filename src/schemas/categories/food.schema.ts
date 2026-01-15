/**
 * Food/Restaurant Category Schema
 * Fields specific to food items and restaurant listings
 */

import { createCategorySchema } from './base'
import type { CategorySchema, FieldSchema } from './types'

const foodFields: FieldSchema[] = [
  {
    key: 'cuisine_type',
    type: 'enum',
    required: false,
    label: 'Taom turi',
    enumOptions: ['uzbek', 'european', 'asian', 'fast_food', 'dessert', 'drinks', 'other'],
    aiQuestion: 'Qanday taom? (o\'zbek, yevropa, osiyo, fast-food, shirinlik, ichimlik)',
    aiExtraction: 'Determine cuisine type'
  },
  {
    key: 'ingredients',
    type: 'array',
    required: false,
    label: 'Tarkibiy qismlar',
    placeholder: 'Masalan: go\'sht, sabzi, piyoz',
    aiQuestion: 'Tarkibiy qismlar nima?',
    aiExtraction: 'Extract ingredients as array'
  },
  {
    key: 'allergens',
    type: 'array',
    required: false,
    label: 'Allergenlar',
    placeholder: 'Masalan: gluten, sut, yong\'oq',
    aiQuestion: 'Allergenlar bormi? (masalan: gluten, sut, yong\'oq)',
    aiExtraction: 'Extract allergens as array - important for safety'
  },
  {
    key: 'spicy_level',
    type: 'enum',
    required: false,
    label: 'Achchiqlik darajasi',
    enumOptions: ['none', 'mild', 'medium', 'hot', 'very_hot'],
    aiQuestion: 'Achchiqmi? (yo\'q, yengil, o\'rtacha, achchiq, juda achchiq)',
    aiExtraction: 'Determine spicy level'
  },
  {
    key: 'serving_size',
    type: 'string',
    required: false,
    label: 'Porsiya o\'lchami',
    placeholder: 'Masalan: 1 kishilik, 2 kishilik',
    aiQuestion: 'Porsiya o\'lchami qanday?',
    aiExtraction: 'Extract serving size'
  },
  {
    key: 'delivery_available',
    type: 'boolean',
    required: true,
    label: 'Yetkazib berish mavjud',
    defaultValue: false,
    aiQuestion: 'Yetkazib berish mumkinmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean'
  },
  {
    key: 'delivery_fee',
    type: 'number',
    required: false,
    label: 'Yetkazib berish narxi',
    placeholder: '0',
    validation: {
      min: 0
    },
    dependsOn: {
      field: 'delivery_available',
      value: true
    },
    aiQuestion: 'Yetkazib berish narxi qanday?',
    aiExtraction: 'Extract delivery fee'
  },
  {
    key: 'delivery_time_minutes',
    type: 'number',
    required: false,
    label: 'Yetkazib berish vaqti (daqiqa)',
    placeholder: '0',
    validation: {
      min: 0
    },
    dependsOn: {
      field: 'delivery_available',
      value: true
    },
    aiQuestion: 'Yetkazib berish qancha vaqt oladi? (daqiqada)',
    aiExtraction: 'Extract delivery time in minutes'
  },
  {
    key: 'preparation_time_minutes',
    type: 'number',
    required: false,
    label: 'Tayyorlash vaqti (daqiqa)',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Tayyorlash qancha vaqt oladi? (daqiqada)',
    aiExtraction: 'Extract preparation time'
  },
  {
    key: 'stock_qty',
    type: 'number',
    required: false,
    label: 'Mavjud miqdor',
    placeholder: 'Cheksiz',
    validation: {
      min: 0
    },
    aiQuestion: 'Nechta porsiya mavjud? (yoki "cheksiz")',
    aiExtraction: 'Extract stock quantity, null if unlimited'
  },
  {
    key: 'halal',
    type: 'boolean',
    required: false,
    label: 'Halol',
    defaultValue: false,
    aiQuestion: 'Halolmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean'
  },
  {
    key: 'vegetarian',
    type: 'boolean',
    required: false,
    label: 'Vegetarian',
    defaultValue: false,
    aiQuestion: 'Vegetarianmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean'
  }
]

export const foodSchema: CategorySchema = createCategorySchema(
  {
    entityType: 'product',
    category: 'food',
    displayName: 'Ovqat',
    emoji: '🍕',
    description: 'Taomlar, ichimliklar, restoranlar',
    aiInstructions: {
      greeting: 'Salom! Ovqat e\'lonini yaratishga yordam beraman. Qanday taom sotmoqchisiz?',
      questionOrder: ['title', 'description', 'cuisine_type', 'ingredients', 'price', 'delivery_available', 'stock_qty']
    },
    validation: {
      custom: (data) => {
        // Safety: Allergens are critical for food safety
        if (data.attributes?.allergens && !Array.isArray(data.attributes.allergens)) {
          return 'Allergens must be an array'
        }
        return null
      }
    }
  },
  foodFields
)

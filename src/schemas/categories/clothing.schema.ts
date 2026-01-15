/**
 * Clothing Category Schema
 * Fields specific to clothing items
 */

import { createCategorySchema } from './base'
import type { CategorySchema, FieldSchema } from './types'

const clothingFields: FieldSchema[] = [
  {
    key: 'brand',
    type: 'string',
    required: false,
    label: 'Brend',
    placeholder: 'Masalan: Nike, Adidas',
    aiQuestion: 'Brend nima?',
    aiExtraction: 'Extract brand name if mentioned',
    normalization: {
      type: 'brand',
      entityTable: 'brands',
    }
  },
  {
    key: 'country_of_origin',
    type: 'string',
    required: false,
    label: 'Ishlab chiqarilgan mamlakati',
    placeholder: 'Masalan: O\'zbekiston, Xitoy, Turkiya',
    aiQuestion: 'Ishlab chiqarilgan mamlakati qaysi?',
    aiExtraction: 'Extract country of origin',
    normalization: {
      type: 'country',
      entityTable: 'countries',
    }
  },
  {
    key: 'year',
    type: 'number',
    required: false,
    label: 'Ishlab chiqarilgan yili',
    placeholder: 'Masalan: 2023',
    validation: {
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    aiQuestion: 'Qaysi yilda ishlab chiqarilgan?',
    aiExtraction: 'Extract manufacturing year'
  },
  {
    key: 'sizes',
    type: 'multi_select',
    required: true,
    label: 'O\'lchamlar',
    enumOptions: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
    aiQuestion: 'Qanday o\'lchamlar mavjud? (masalan: M, L, XL yoki 42, 43, 44)',
    aiExtraction: 'Extract available sizes as array'
  },
  {
    key: 'colors',
    type: 'array',
    required: true,
    label: 'Ranglar',
    placeholder: 'Masalan: qora, oq, qizil',
    aiQuestion: 'Qanday ranglar mavjud?',
    aiExtraction: 'Extract colors as array of strings'
  },
  {
    key: 'material',
    type: 'string',
    required: false,
    label: 'Material',
    placeholder: 'Masalan: paxta, poliester',
    aiQuestion: 'Material nima? (masalan: paxta, poliester, teri)',
    aiExtraction: 'Extract material type'
  },
  {
    key: 'season',
    type: 'enum',
    required: false,
    label: 'Mavsum',
    enumOptions: ['bahor', 'yoz', 'kuz', 'qish', 'yil_davomida'],
    aiQuestion: 'Qaysi mavsum uchun? (bahor, yoz, kuz, qish, yil davomida)',
    aiExtraction: 'Determine season'
  },
  {
    key: 'delivery_available',
    type: 'boolean',
    required: false,
    label: 'Yetkazib berish mavjudmi?',
    defaultValue: false,
    aiQuestion: 'Yetkazib berish bormi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean for delivery availability'
  },
  {
    key: 'delivery_days',
    type: 'number',
    required: false,
    label: 'Yetkazib berish muddati (kun)',
    placeholder: 'Masalan: 1-3 kun',
    validation: {
      min: 0
    },
    dependsOn: {
      field: 'delivery_available',
      value: true
    },
    aiQuestion: 'Qancha vaqtda yetkazib beriladi? (kunlarda)',
    aiExtraction: 'Extract delivery time in days'
  },
  {
    key: 'delivery_conditions',
    type: 'string',
    required: false,
    label: 'Yetkazib berish shartlari',
    placeholder: 'Masalan: Faqat shahar ichida, minimal buyurtma 100,000 so\'m',
    dependsOn: {
      field: 'delivery_available',
      value: true
    },
    aiQuestion: 'Yetkazib berish shartlari qanday? (ixtiyoriy)',
    aiExtraction: 'Extract delivery conditions'
  },
  {
    key: 'discount_available',
    type: 'boolean',
    required: false,
    label: 'Aksiya mavjudmi?',
    defaultValue: false,
    aiQuestion: 'Aksiya bormi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean for discount availability'
  },
  {
    key: 'discount_original_price',
    type: 'number',
    required: false,
    label: 'Asl narx (aksiya)',
    placeholder: '0',
    validation: {
      min: 0
    },
    dependsOn: {
      field: 'discount_available',
      value: true
    },
    aiQuestion: 'Agar aksiya bo\'lsa, asl narx qanday?',
    aiExtraction: 'Extract original price if discount available'
  },
  {
    key: 'discount_days',
    type: 'number',
    required: false,
    label: 'Aksiya muddati (kun)',
    placeholder: 'Masalan: 7 kun',
    validation: {
      min: 0
    },
    dependsOn: {
      field: 'discount_available',
      value: true
    },
    aiQuestion: 'Aksiya qancha vaqt davom etadi? (kunlarda)',
    aiExtraction: 'Extract discount duration in days'
  },
  {
    key: 'discount_reason',
    type: 'string',
    required: true,
    label: 'Aksiya sababi',
    placeholder: 'Masalan: Mavsumiy aksiya, Yangi kolleksiya',
    dependsOn: {
      field: 'discount_available',
      value: true
    },
    aiQuestion: 'Aksiya sababi nima? (majburiy)',
    aiExtraction: 'Extract discount reason'
  },
  {
    key: 'discount_conditions',
    type: 'string',
    required: false,
    label: 'Aksiya shartlari',
    placeholder: 'Masalan: Faqat naqd pul, Minimal buyurtma 200,000 so\'m',
    dependsOn: {
      field: 'discount_available',
      value: true
    },
    aiQuestion: 'Aksiya shartlari qanday? (ixtiyoriy)',
    aiExtraction: 'Extract discount conditions'
  }
]

export const clothingSchema: CategorySchema = createCategorySchema(
  {
    entityType: 'product',
    category: 'clothing',
    displayName: 'Kiyim-kechak',
    emoji: '👕',
    description: 'Kiyim, oyoq kiyim, aksessuarlar',
    aiInstructions: {
      greeting: 'Salom! Kiyim-kechak e\'lonini yaratishga yordam beraman. Qanday kiyim sotmoqchisiz?',
      questionOrder: [
        'brand', 
        'country_of_origin', 
        'year', 
        'sizes', 
        'colors', 
        'material', 
        'price', 
        'discount_available',
        'delivery_available',
        'condition'
      ]
    }
  },
  clothingFields
)

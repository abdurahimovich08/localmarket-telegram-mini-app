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
    aiExtraction: 'Extract brand name if mentioned'
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
    key: 'gender',
    type: 'enum',
    required: false,
    label: 'Jins',
    enumOptions: ['men', 'women', 'unisex', 'kids'],
    aiQuestion: 'Kimlar uchun? (erkak, ayol, uniseks, bolalar)',
    aiExtraction: 'Determine gender target'
  },
  {
    key: 'season',
    type: 'enum',
    required: false,
    label: 'Mavsum',
    enumOptions: ['spring', 'summer', 'autumn', 'winter', 'all_season'],
    aiQuestion: 'Qaysi mavsum uchun? (bahor, yoz, kuz, qish, yil davomida)',
    aiExtraction: 'Determine season'
  },
  {
    key: 'stock_qty',
    type: 'number',
    required: true,
    label: 'Mavjud miqdor',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Nechta dona mavjud?',
    aiExtraction: 'Extract stock quantity'
  },
  {
    key: 'old_price',
    type: 'number',
    required: false,
    label: 'Eski narx (aksiya)',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Agar aksiya bo\'lsa, eski narx qanday?',
    aiExtraction: 'Extract old price if discount mentioned'
  },
  {
    key: 'discount_percent',
    type: 'number',
    required: false,
    label: 'Chegirma foizi',
    placeholder: '0',
    validation: {
      min: 0,
      max: 100
    },
    aiExtraction: 'Calculate discount percentage from old_price and price'
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
      questionOrder: ['title', 'description', 'brand', 'sizes', 'colors', 'material', 'price', 'stock_qty', 'condition']
    }
  },
  clothingFields
)

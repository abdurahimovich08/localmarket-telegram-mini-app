/**
 * Base Category Schema
 * Common fields shared across all categories
 */

import type { CategorySchema, FieldSchema } from './types'

/**
 * Common core fields for products
 */
export const productCoreFields: FieldSchema[] = [
  {
    key: 'title',
    type: 'string',
    required: true,
    label: 'Sarlavha',
    placeholder: 'Mahsulot nomi',
    validation: {
      minLength: 3,
      maxLength: 80
    },
    aiQuestion: 'Mahsulot nomi nima?',
    aiExtraction: 'Extract product title from user description'
  },
  {
    key: 'description',
    type: 'string',
    required: true,
    label: 'Tavsif',
    placeholder: 'Batafsil ma\'lumot',
    validation: {
      minLength: 10,
      maxLength: 500
    },
    aiQuestion: 'Mahsulot haqida batafsil ma\'lumot bering',
    aiExtraction: 'Create detailed description with emojis'
  },
  {
    key: 'price',
    type: 'number',
    required: false,
    label: 'Narx',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Narx qanday? (yoki "bepul" deb ayting)',
    aiExtraction: 'Extract price as number, or set is_free=true if free'
  },
  {
    key: 'is_free',
    type: 'boolean',
    required: false,
    label: 'Bepul',
    defaultValue: false,
    aiExtraction: 'Set to true if user says "bepul" or "free"'
  },
  {
    key: 'condition',
    type: 'enum',
    required: true,
    label: 'Holati',
    enumOptions: ['yangi', 'yangi_kabi', 'yaxshi', 'o\'rtacha', 'eski'],
    aiQuestion: 'Mahsulot holati qanday? (yangi, yangi kabi, yaxshi, o\'rtacha, eski)',
    aiExtraction: 'Map condition from user description (uzbek: yangi, yangi_kabi, yaxshi, o\'rtacha, eski)'
  },
  {
    key: 'neighborhood',
    type: 'string',
    required: false,
    label: 'Mahalla',
    placeholder: 'Masalan: Yunusobod',
    aiQuestion: 'Qayerda joylashgan? (mahalla nomi)',
    aiExtraction: 'Extract location/neighborhood name'
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
    key: 'stock_qty',
    type: 'number',
    required: false,
    label: 'Mavjud miqdor',
    placeholder: 'Cheksiz',
    validation: {
      min: 0
    },
    aiQuestion: 'Nechta dona mavjud? (yoki "cheksiz")',
    aiExtraction: 'Extract stock quantity, null if unlimited'
  }
]

/**
 * Common core fields for services
 */
export const serviceCoreFields: FieldSchema[] = [
  {
    key: 'title',
    type: 'string',
    required: true,
    label: 'Sarlavha',
    placeholder: 'Xizmat nomi',
    validation: {
      minLength: 3,
      maxLength: 100
    },
    aiQuestion: 'Qanday xizmat ko\'rsatasiz?',
    aiExtraction: 'Extract service title from user description'
  },
  {
    key: 'description',
    type: 'string',
    required: true,
    label: 'Tavsif',
    placeholder: 'Batafsil ma\'lumot',
    validation: {
      minLength: 10,
      maxLength: 500
    },
    aiQuestion: 'Xizmat haqida batafsil ma\'lumot bering',
    aiExtraction: 'Create detailed description with emojis'
  },
  {
    key: 'category',
    type: 'string',
    required: true,
    label: 'Kategoriya',
    placeholder: 'Masalan: Dasturlash',
    aiQuestion: 'Xizmat kategoriyasi nima?',
    aiExtraction: 'Extract or suggest category name'
  },
  {
    key: 'priceType',
    type: 'enum',
    required: true,
    label: 'Narx turi',
    enumOptions: ['fixed', 'hourly', 'negotiable'],
    aiQuestion: 'Narx qanday? (belgilangan, soatlik, yoki kelishiladi)',
    aiExtraction: 'Determine price type from user description'
  },
  {
    key: 'price',
    type: 'string',
    required: true,
    label: 'Narx',
    placeholder: 'Masalan: 100000 so\'m',
    aiQuestion: 'Narx qanday?',
    aiExtraction: 'Extract price as string (can include text like "soatlik 50000 so\'m")'
  },
  {
    key: 'tags',
    type: 'array',
    required: true,
    label: 'Teglar',
    placeholder: 'Masalan: web-development, react-js',
    validation: {
      minLength: 3,
      maxLength: 7
    },
    aiQuestion: 'Xizmatni tavsiflovchi teglar (3-7 ta)',
    aiExtraction: 'Generate 3-7 lowercase, hyphen-separated tags in latin alphabet'
  }
]

/**
 * Helper to merge base fields with category-specific fields
 */
export function createCategorySchema(
  base: Partial<CategorySchema>,
  categoryFields: FieldSchema[]
): CategorySchema {
  const coreFields = base.entityType === 'product' 
    ? productCoreFields 
    : serviceCoreFields

  return {
    ...base,
    fields: [
      ...coreFields,
      ...categoryFields
    ]
  } as CategorySchema
}

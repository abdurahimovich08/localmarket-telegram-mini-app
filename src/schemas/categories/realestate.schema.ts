/**
 * Real Estate Category Schema
 * Fields specific to real estate listings
 */

import { createCategorySchema } from './base'
import type { CategorySchema, FieldSchema } from './types'

const realestateFields: FieldSchema[] = [
  {
    key: 'property_type',
    type: 'enum',
    required: true,
    label: 'Uy turi',
    enumOptions: ['apartment', 'house', 'commercial', 'land', 'office', 'warehouse'],
    aiQuestion: 'Qanday uy? (kvartira, uy, tijorat, yer, ofis, ombor)',
    aiExtraction: 'Determine property type'
  },
  {
    key: 'area_sqm',
    type: 'number',
    required: true,
    label: 'Maydon (m²)',
    placeholder: '0',
    validation: {
      min: 1
    },
    aiQuestion: 'Maydon qancha? (kvadrat metr)',
    aiExtraction: 'Extract area in square meters'
  },
  {
    key: 'rooms',
    type: 'number',
    required: false,
    label: 'Xonalar soni',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Nechta xona?',
    aiExtraction: 'Extract number of rooms'
  },
  {
    key: 'floor',
    type: 'number',
    required: false,
    label: 'Qavat',
    placeholder: '0',
    aiQuestion: 'Qaysi qavatda?',
    aiExtraction: 'Extract floor number'
  },
  {
    key: 'total_floors',
    type: 'number',
    required: false,
    label: 'Jami qavatlar',
    placeholder: '0',
    validation: {
      min: 1
    },
    aiQuestion: 'Uy necha qavatli?',
    aiExtraction: 'Extract total floors'
  },
  {
    key: 'documents',
    type: 'enum',
    required: false,
    label: 'Hujjatlar',
    enumOptions: ['ready', 'in_process', 'missing'],
    aiQuestion: 'Hujjatlar holati qanday? (tayyor, jarayonda, yo\'q)',
    aiExtraction: 'Determine document status - NEVER invent legal status, only ask user'
  },
  {
    key: 'mortgage_available',
    type: 'boolean',
    required: false,
    label: 'Ipoteka mavjud',
    defaultValue: false,
    aiQuestion: 'Ipoteka mumkinmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean - NEVER invent credit terms'
  },
  {
    key: 'installment_available',
    type: 'boolean',
    required: false,
    label: 'Bo\'lib to\'lash mumkin',
    defaultValue: false,
    aiQuestion: 'Bo\'lib to\'lash mumkinmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean - NEVER invent installment terms'
  },
  {
    key: 'installment_terms',
    type: 'string',
    required: false,
    label: 'Bo\'lib to\'lash shartlari',
    placeholder: 'Masalan: 12 oy, 0% foiz',
    dependsOn: {
      field: 'installment_available',
      value: true
    },
    aiQuestion: 'Bo\'lib to\'lash shartlari qanday? (faqat haqiqiy ma\'lumot, ixtiro qilma)',
    aiExtraction: 'Extract terms as free text - NEVER invent percentages or legal terms'
  },
  {
    key: 'furnished',
    type: 'boolean',
    required: false,
    label: 'Mebellangan',
    defaultValue: false,
    aiQuestion: 'Mebellanganmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean'
  },
  {
    key: 'parking',
    type: 'boolean',
    required: false,
    label: 'Avtoturargoh',
    defaultValue: false,
    aiQuestion: 'Avtoturargoh bormi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean'
  },
  {
    key: 'elevator',
    type: 'boolean',
    required: false,
    label: 'Lift',
    defaultValue: false,
    aiQuestion: 'Lift bormi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean'
  }
]

export const realestateSchema: CategorySchema = createCategorySchema(
  {
    entityType: 'product',
    category: 'realestate',
    displayName: 'Ko\'chmas mulk',
    emoji: '🏠',
    description: 'Kvartira, uy, yer, tijorat binolar',
    aiInstructions: {
      greeting: 'Salom! Ko\'chmas mulk e\'lonini yaratishga yordam beraman. Qanday uy sotmoqchisiz?',
      questionOrder: ['title', 'property_type', 'area_sqm', 'rooms', 'floor', 'price', 'documents', 'neighborhood']
    },
    validation: {
      custom: (data) => {
        // Safety: Never allow AI to invent legal/financial terms
        if (data.attributes?.installment_terms && !data.attributes?.installment_available) {
          return 'Installment terms require installment_available to be true'
        }
        return null
      }
    }
  },
  realestateFields
)

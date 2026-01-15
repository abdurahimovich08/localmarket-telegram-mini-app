/**
 * Car/Automotive Category Schema
 * Fields specific to vehicle listings
 */

import { createCategorySchema } from './base'
import type { CategorySchema, FieldSchema } from './types'

const carFields: FieldSchema[] = [
  {
    key: 'brand',
    type: 'string',
    required: true,
    label: 'Brend',
    placeholder: 'Masalan: Toyota, Chevrolet',
    aiQuestion: 'Mashina brendi nima?',
    aiExtraction: 'Extract car brand'
  },
  {
    key: 'model',
    type: 'string',
    required: true,
    label: 'Model',
    placeholder: 'Masalan: Camry, Malibu',
    aiQuestion: 'Model nima?',
    aiExtraction: 'Extract car model'
  },
  {
    key: 'year',
    type: 'number',
    required: true,
    label: 'Yil',
    placeholder: '2020',
    validation: {
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    aiQuestion: 'Ishlab chiqarilgan yili?',
    aiExtraction: 'Extract year as number'
  },
  {
    key: 'mileage_km',
    type: 'number',
    required: true,
    label: 'Yurgan masofa (km)',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Necha kilometr yurgan?',
    aiExtraction: 'Extract mileage in kilometers'
  },
  {
    key: 'engine',
    type: 'string',
    required: false,
    label: 'Dvigatel',
    placeholder: 'Masalan: 2.0L, 1.6L',
    aiQuestion: 'Dvigatel hajmi? (masalan: 2.0L)',
    aiExtraction: 'Extract engine size'
  },
  {
    key: 'transmission',
    type: 'enum',
    required: false,
    label: 'Uzatmalar qutisi',
    enumOptions: ['manual', 'automatic', 'cvt'],
    aiQuestion: 'Uzatmalar qutisi qanday? (mexanik, avtomat, CVT)',
    aiExtraction: 'Determine transmission type'
  },
  {
    key: 'fuel_type',
    type: 'enum',
    required: false,
    label: 'Yoqilg\'i turi',
    enumOptions: ['petrol', 'diesel', 'electric', 'hybrid', 'gas'],
    aiQuestion: 'Qanday yoqilg\'i? (benzin, dizel, elektr, gibrid, gaz)',
    aiExtraction: 'Determine fuel type'
  },
  {
    key: 'color',
    type: 'string',
    required: false,
    label: 'Rang',
    placeholder: 'Masalan: qora, oq',
    aiQuestion: 'Rang nima?',
    aiExtraction: 'Extract color'
  },
  {
    key: 'accident_history',
    type: 'enum',
    required: false,
    label: 'Avariya tarixi',
    enumOptions: ['none', 'minor', 'major', 'unknown'],
    aiQuestion: 'Avariya bo\'lganmi? (yo\'q, kichik, katta, noma\'lum)',
    aiExtraction: 'Determine accident history - NEVER invent, only ask user'
  },
  {
    key: 'credit_available',
    type: 'boolean',
    required: false,
    label: 'Kredit mavjud',
    defaultValue: false,
    aiQuestion: 'Kredit mumkinmi? (ha/yo\'q)',
    aiExtraction: 'Extract boolean - NEVER invent credit terms'
  },
  {
    key: 'credit_terms',
    type: 'string',
    required: false,
    label: 'Kredit shartlari',
    placeholder: 'Masalan: 12 oy, 0% foiz',
    dependsOn: {
      field: 'credit_available',
      value: true
    },
    aiQuestion: 'Kredit shartlari qanday? (faqat haqiqiy ma\'lumot, ixtiro qilma)',
    aiExtraction: 'Extract terms as free text - NEVER invent percentages or legal terms'
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
    placeholder: 'Masalan: 6 oy, 0% foiz',
    dependsOn: {
      field: 'installment_available',
      value: true
    },
    aiQuestion: 'Bo\'lib to\'lash shartlari qanday? (faqat haqiqiy ma\'lumot, ixtiro qilma)',
    aiExtraction: 'Extract terms as free text - NEVER invent percentages or legal terms'
  }
]

export const carSchema: CategorySchema = createCategorySchema(
  {
    entityType: 'product',
    category: 'automotive',
    displayName: 'Avtomobil',
    emoji: '🚗',
    description: 'Yengil avtomobillar, yuk mashinalari, mototsikllar',
    aiInstructions: {
      greeting: 'Salom! Avtomobil e\'lonini yaratishga yordam beraman. Qanday mashina sotmoqchisiz?',
      questionOrder: ['title', 'brand', 'model', 'year', 'mileage_km', 'engine', 'price', 'condition']
    },
    validation: {
      custom: (data) => {
        // Safety: Never allow AI to invent legal/financial terms
        if (data.attributes?.credit_terms && !data.attributes?.credit_available) {
          return 'Credit terms require credit_available to be true'
        }
        if (data.attributes?.installment_terms && !data.attributes?.installment_available) {
          return 'Installment terms require installment_available to be true'
        }
        return null
      }
    }
  },
  carFields
)

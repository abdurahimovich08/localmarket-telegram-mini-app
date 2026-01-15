/**
 * Service Category Schema
 * Fields specific to service offerings
 * This is the existing service schema, adapted to the new system
 */

import { createCategorySchema, serviceCoreFields } from './base'
import type { CategorySchema, FieldSchema } from './types'

// Services use the base serviceCoreFields, no additional fields needed
// But we can add service-specific optional fields
const serviceFields: FieldSchema[] = [
  {
    key: 'duration',
    type: 'string',
    required: false,
    label: 'Davomiyligi',
    placeholder: 'Masalan: 1 soat, 2 kun',
    aiQuestion: 'Xizmat qancha vaqt oladi?',
    aiExtraction: 'Extract service duration'
  },
  {
    key: 'experience_years',
    type: 'number',
    required: false,
    label: 'Tajriba (yil)',
    placeholder: '0',
    validation: {
      min: 0
    },
    aiQuestion: 'Necha yillik tajriba?',
    aiExtraction: 'Extract years of experience'
  },
  {
    key: 'availability',
    type: 'enum',
    required: false,
    label: 'Mavjudlik',
    enumOptions: ['full_time', 'part_time', 'on_demand', 'weekends_only'],
    aiQuestion: 'Qachon mavjud? (to\'liq, qisman, talab bo\'yicha, faqat dam olish kunlari)',
    aiExtraction: 'Determine availability'
  },
  {
    key: 'location_type',
    type: 'enum',
    required: false,
    label: 'Ishlash joyi',
    enumOptions: ['remote', 'on_site', 'hybrid'],
    aiQuestion: 'Qayerda ishlaysiz? (masofadan, joyida, aralash)',
    aiExtraction: 'Determine location type'
  }
]

export const serviceSchema: CategorySchema = createCategorySchema(
  {
    entityType: 'service',
    category: 'service',
    displayName: 'Xizmat',
    emoji: '🛠️',
    description: 'Har xil xizmatlar: dasturlash, dizayn, konsultatsiya',
    aiInstructions: {
      greeting: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz?',
      questionOrder: ['title', 'description', 'category', 'priceType', 'price', 'tags', 'duration', 'experience_years']
    }
  },
  serviceFields
)

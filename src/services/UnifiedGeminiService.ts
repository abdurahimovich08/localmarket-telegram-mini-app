/**
 * Unified Gemini AI Service
 *
 * Refactored to support BOTH products and services
 * with schema-driven questioning and validation
 */

import { TAG_RULES } from '../lib/tagUtils'
import { getTagSuggestionsForAI } from '../lib/tagAnalytics'
import type { CategorySchema, UnifiedAIOutput } from '../schemas/categories/types'
import { getCategorySchema, getRequiredFields, validateRequiredFields } from '../schemas/categories'
import { processAIOutput } from './DataPostProcessing'

interface ChatMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

interface UnifiedChatSession {
  entityType: 'product' | 'service'
  category: string
  schema: CategorySchema
  chatHistory: ChatMessage[]
  filledData: {
    core: Record<string, any>
    attributes: Record<string, any>
  }
}

// Store sessions in memory (per user session)
const chatSessions = new Map<string, UnifiedChatSession>()

/**
 * Safely stringify small context values for prompt (avoid huge / circular)
 */
function safeText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

/**
 * Generate system prompt based on schema
 */
async function generateSystemPrompt(
  entityType: 'product' | 'service',
  category: string,
  schema: CategorySchema,
  context?: Record<string, any>
): Promise<string> {
  // Tag suggestions for services
  let tagSuggestions = ''
  if (entityType === 'service') {
    try {
      const suggestions = await getTagSuggestionsForAI()
      if (suggestions?.topTags?.length) {
        tagSuggestions = `
📊 PLATFORM TAG STATISTICS:
Top performing tags: ${suggestions.topTags.slice(0, 5).join(', ')}
Trending tags: ${suggestions.trendingTags.slice(0, 5).join(', ')}
⚠️ AVOID: ${suggestions.avoidTags.slice(0, 3).join(', ')}
`
      }
    } catch (error) {
      // non-blocking
      console.warn('Could not fetch tag analytics:', error)
    }
  }

  const entityName = entityType === 'product' ? 'mahsulot' : 'xizmat'
  const categoryName = schema.displayName

  // Required fields list for prompt
  getRequiredFields(schema) // (kept for semantic clarity, even if not used directly)

  const requiredFieldDescriptions = schema.fields
    .filter(f => f.required)
    .map(f => `- ${f.label} (${f.key}): ${f.aiQuestion || f.description || 'Majburiy maydon'}`)
    .join('\n')

  // Field extraction instructions (3-layer architecture)
  const fieldExtractionInstructions = `
MA'LUMOTLARNI 3 QATLAMDA QAYTARING:

1. RAW: User yozgani to'g'ridan-to'g'ri (o'zgartirmasdan)
2. NORMALIZED: Tozalangan (lowercase, trim, special chars olib tashlangan)
3. CANONICAL: Platforma bilgan haqiqat (entity ID, agar topilsa)

MISOL - Brand:
User: "Bu nIIIkE sport kiyimi"

Siz qaytarasiz:
{
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": "brand_001",  // Agar topilsa
  "brand_display": "Nike",
  "brand_confidence": 0.85
}

Agar brand topilmasa:
{
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": null,
  "brand_confidence": 0.3
}

MISOL - Country:
User: "Rossiya"

Siz qaytarasiz:
{
  "country_raw": "Rossiya",
  "country_norm": "russia",
  "country_id": "country_002",
  "country_display": "Rossiya",
  "country_confidence": 0.95
}

QOIDALAR:
- Har bir field uchun: raw, norm, _id (agar entity bo'lsa), _display, _confidence
- Confidence: 0.9-1.0 (yuqori), 0.7-0.9 (o'rtacha), <0.7 (past)
- Agar entity topilmasa: _id = null, confidence < 0.7
- Number fields (price, stock): faqat normalized number qaytaring

MAYDONLAR:
${schema.fields
  .map(f => {
    const base = `- ${f.key}: ${f.aiExtraction || f.description || 'Extract from user message'}`
    // Add normalization hint for specific fields
    if (f.key === 'brand' || f.key.includes('brand')) {
      return `${base}\n  → Normalize: brand name (lowercase, no spaces)\n  → Canonical: brand_id from brands table`
    }
    if (f.key === 'country' || f.key.includes('country')) {
      return `${base}\n  → Normalize: country name\n  → Canonical: country_id from countries table`
    }
    if (f.type === 'number' || f.key.includes('price') || f.key.includes('qty')) {
      return `${base}\n  → Normalize: number (remove currency, spaces, convert to number)`
    }
    return base
  })
  .join('\n')}
`

  // Taxonomy context (clothing)
  let taxonomyContext = ''
  if (context?.taxonomy) {
    const t: any = context.taxonomy

    taxonomyContext = `
TAXONOMY TANLANGAN (KATEGORIYA ALLAQACHON TANLANGAN):
- Auditoriya: ${safeText(t.audienceUz || t.audience || '')}
- Segment: ${safeText(t.segmentUz || t.segment || '')}
- Tanlangan tur: ${safeText(t.leafUz || t.leaf || t.pathUz || t.path || '')}

QOIDALAR:
- Umumiy savol BERMANG ("qanday kiyim sotmoqchisiz?").
- Shu tanlov asosida aniq savol bering: brend, o'lcham, holat, narx, stock, discount, rang.
`
  }

  const questionOrder =
    schema.aiInstructions?.questionOrder?.map((key, i) => `${i + 1}. ${key}`).join('\n   ') ||
    "Schema bo'yicha"

  const attributesExample = schema.fields
    .filter(
      f =>
        ![
          'title',
          'description',
          'price',
          'is_free',
          'condition',
          'neighborhood',
          'old_price',
          'stock_qty',
          'priceType',
          'tags',
          'category',
        ].includes(f.key)
    )
    .map(f => {
      const val =
        f.type === 'number'
          ? '0'
          : f.type === 'boolean'
            ? 'false'
            : f.type === 'array'
              ? '[]'
              : '""'
      return `"${f.key}": ${val}`
    })
    .join(',\n    ')

  const productCoreExample = `
    "price": 0,
    "is_free": false,
    "condition": "new" | "like_new" | "good" | "fair" | "poor",
    "neighborhood": "...",
    "old_price": 0,
    "stock_qty": 0`

  const serviceCoreExample = `
    "priceType": "fixed" | "hourly" | "negotiable",
    "price": "...",
    "tags": ["tag1", "tag2", "tag3"]`

  const basePrompt = `
Sen - SOQQA ilovasining professional AI yordamchisiz.
Vazifang: foydalanuvchi bilan o'zbek tilida samimiy suhbatlashib, ${entityName} e'lonini yaratishga yordam berish.

KATEGORIYA: ${categoryName} ${schema.emoji}
ENTITY TYPE: ${entityType}
${taxonomyContext}

QOIDALAR:
1) Faqat o'zbek tilida gaplash.
2) Bitta xabarda faqat BITTA savol ber.
3) Savollar tartibi:
   ${questionOrder}

4) MAJBURIY MAYDONLAR (to'ldirish shart):
${requiredFieldDescriptions}

5) XAVFSIZLIK (MUHIM):
- Kredit foizlari, ipoteka shartlari yoki moliyaviy/yuridik ma'lumotlarni IXTRO QILMA.
- Faqat foydalanuvchi aytganini qaytar.
- "kredit mumkin" bo'lsa: faqat mavjud/yo'q (boolean), foiz ixtiro qilma.
- Hujjatlar holati: faqat foydalanuvchi aytgani.

6) Ma'lumot yetarli bo'lganda (barcha majburiy maydonlar to'ldirilganda),
suhbatni to'xtat va FAQAT quyidagi JSON formatda qaytar:

{
  "isFinished": true,
  "entityType": "${entityType}",
  "category": "${category}",
  "core": {
    "title": "...",
    "description": "...",${entityType === 'product' ? productCoreExample : serviceCoreExample}
  },
  "attributes": {
    ${attributesExample}
  }
}

7) MAYDONLARNI QAYTARISH QOIDALARI:
${fieldExtractionInstructions}

${
  entityType === 'service'
    ? `
8) TEGLAR QOIDALARI (QATTIQ):
- Teglar soni: ${TAG_RULES.MIN}-${TAG_RULES.MAX} ta
- Format: lotin (a-z, 0-9), kichik harf, defis (-)
- Har bir teg: ${TAG_RULES.MIN_LENGTH}-${TAG_RULES.MAX_LENGTH} belgi
${tagSuggestions}
`
    : ''
}

9) JAVOB FORMATI:
- Agar ma'lumot yetarli bo'lmasa: oddiy matn bilan davom et.
- Agar yetarli bo'lsa: faqat JSON qaytar.

O'zbek tilida javob ber.
`

  return basePrompt
}

/**
 * Start a new unified chat session
 */
export async function startUnifiedChatSession(
  sessionId: string,
  entityType: 'product' | 'service',
  category: string,
  context?: Record<string, any>
): Promise<{ sessionId: string; greeting: string }> {
  const schema = getCategorySchema(category)
  if (!schema) throw new Error(`Category schema not found: ${category}`)
  if (schema.entityType !== entityType) {
    throw new Error(`Category ${category} is not for entity type ${entityType}`)
  }

  const systemPrompt = await generateSystemPrompt(entityType, category, schema, context)

  const session: UnifiedChatSession = {
    entityType,
    category,
    schema,
    chatHistory: [{ role: 'user', parts: [{ text: systemPrompt }] }],
    filledData: { core: {}, attributes: {} },
  }

  chatSessions.set(sessionId, session)

  // Generate taxonomy-aware greeting
  let greeting = ''
  
  if (context?.taxonomy) {
    const t: any = context.taxonomy
    
    // Build path: Erkaklar → Sport → Fitness kiyim
    const pathParts: string[] = []
    if (t.audienceUz || t.audience) pathParts.push(t.audienceUz || t.audience)
    if (t.segmentUz || t.segment) pathParts.push(t.segmentUz || t.segment)
    if (t.leafUz || t.leaf || t.pathUz || t.path) {
      const leaf = t.leafUz || t.leaf || t.pathUz || t.path
      pathParts.push(leaf)
    }
    const pathUz = pathParts.join(' → ')

    // Get first required field from profiling or schema
    let firstField = 'brand' // default
    const profile = context.taxonomyNode?.requiredFieldsOverride?.[0]
    if (profile) {
      firstField = profile
    } else if (schema.aiInstructions?.questionOrder?.[0]) {
      firstField = schema.aiInstructions.questionOrder[0]
    } else {
      // Find first required field from schema
      const firstRequired = schema.fields.find(f => f.required)
      if (firstRequired) {
        firstField = firstRequired.key
      }
    }

    // Field labels in Uzbek
    const fieldLabels: Record<string, string> = {
      brand: 'brendi',
      country: 'ishlab chiqarilgan mamlakati',
      condition: 'holati',
      size: 'o\'lchami',
      sizes: 'o\'lchamlari',
      price: 'narxi',
      colors: 'ranglari',
      material: 'materiali',
      stock_qty: 'miqdori',
    }

    const fieldLabel = fieldLabels[firstField] || firstField
    const leafLabel = (t.leafUz || t.leaf || t.pathUz || t.path || '').toLowerCase()

    greeting = `✅ Tanlandi: ${pathUz}

Zo'r 👍  
Endi aniqlashtiramiz.

Iltimos, ushbu ${leafLabel}ning **${fieldLabel}**ni kiriting.
Agar bilmasangiz, ayting — birga aniqlaymiz 🙂`
  } else {
    // Fallback: no taxonomy
    greeting =
      schema.aiInstructions?.greeting ||
      `Salom! ${schema.displayName} ${schema.emoji} e'lonini yaratishga yordam beraman.`
  }

  session.chatHistory.push({ role: 'model', parts: [{ text: greeting }] })

  return { sessionId, greeting }
}

/**
 * Send message in unified chat session
 */
export async function sendUnifiedMessage(
  sessionId: string,
  message: string
): Promise<{ isFinished: boolean; data?: UnifiedAIOutput; message: string }> {
  const session = chatSessions.get(sessionId)
  if (!session) throw new Error('Chat session not found')

  session.chatHistory.push({ role: 'user', parts: [{ text: message }] })

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      // send history without current message (the API merges message separately)
      chatHistory: session.chatHistory.slice(0, -1),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to get response from Gemini API')
  }

  const data = await response.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  session.chatHistory.push({ role: 'model', parts: [{ text }] })

  // Parse JSON if AI finished
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0])

      if (jsonData?.isFinished === true && jsonData?.entityType && jsonData?.category) {
        const core = jsonData.core || {}
        const attributes = jsonData.attributes || {}

        // Clothing extra guard (if needed)
        const isClothing = jsonData.category === 'clothing'
        if (isClothing) {
          const missing: string[] = []
          if (!core.brand && !attributes.brand) missing.push('brend')
          if (!core.condition) missing.push('holati')
          if (!core.price && !core.is_free && core.price !== 0) missing.push('narxi')

          if (missing.length) {
            return {
              isFinished: false,
              message: `Iltimos, ${missing.join(', ')}ni ham ayting. ${text}`,
            }
          }
        }

        // Schema-based validation
        const validation = validateRequiredFields(session.schema, { core, attributes })
        if (!validation.valid) {
          return {
            isFinished: false,
            message: `Iltimos, quyidagi maydonlarni ham to'ldiring: ${validation.missing.join(', ')}. ${text}`,
          }
        }

        const output: UnifiedAIOutput = {
          isFinished: true,
          entityType: jsonData.entityType,
          category: jsonData.category,
          core,
          attributes,
          ...(jsonData.entityType === 'service'
            ? {
                serviceFields: {
                  priceType: core?.priceType || jsonData?.serviceFields?.priceType,
                  price: core?.price || jsonData?.serviceFields?.price,
                  tags: core?.tags || jsonData?.serviceFields?.tags || [],
                },
              }
            : {}),
        }

        // Post-process AI output: enrich with canonical entities (3-layer architecture)
        try {
          const processed = await processAIOutput(output, session.category)
          
          // Merge processed data back into output
          const finalOutput: UnifiedAIOutput = {
            ...output,
            core: processed.core,
            attributes: {
              ...output.attributes,
              ...processed.attributes,
            },
          }
          
          return { isFinished: true, data: finalOutput, message: text }
        } catch (error) {
          // If post-processing fails, return original output
          console.error('Error in post-processing:', error)
          return { isFinished: true, data: output, message: text }
        }
      }
    }
  } catch {
    // ignore JSON parse errors: treat as normal chat
  }

  return { isFinished: false, message: text }
}

/**
 * Get current session data
 */
export function getSessionData(sessionId: string): UnifiedChatSession | null {
  return chatSessions.get(sessionId) || null
}

/**
 * Clear session
 */
export function clearSession(sessionId: string): void {
  chatSessions.delete(sessionId)
}

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
 * Generate system prompt based on schema
 */
async function generateSystemPrompt(
  entityType: 'product' | 'service',
  category: string,
  schema: CategorySchema
): Promise<string> {
  // Get tag suggestions for services
  let tagSuggestions = ''
  if (entityType === 'service') {
    try {
      const suggestions = await getTagSuggestionsForAI()
      if (suggestions.topTags.length > 0) {
        tagSuggestions = `
📊 PLATFORM TAG STATISTICS:
Top performing tags: ${suggestions.topTags.slice(0, 5).join(', ')}
Trending tags: ${suggestions.trendingTags.slice(0, 5).join(', ')}
⚠️ AVOID: ${suggestions.avoidTags.slice(0, 3).join(', ')}
`
      }
    } catch (error) {
      console.warn('Could not fetch tag analytics:', error)
    }
  }

  const entityName = entityType === 'product' ? 'mahsulot' : 'xizmat'
  const categoryName = schema.displayName

  // Get required fields
  const requiredFields = getRequiredFields(schema)
  const requiredFieldDescriptions = schema.fields
    .filter(f => f.required)
    .map(f => `- ${f.label} (${f.key}): ${f.aiQuestion || f.description || 'Required field'}`)
    .join('\n')

  // Build field extraction instructions
  const fieldExtractionInstructions = schema.fields
    .map(f => {
      if (f.aiExtraction) {
        return `- ${f.key}: ${f.aiExtraction}`
      }
      return null
    })
    .filter(Boolean)
    .join('\n')

  const basePrompt = `
Sen - SOQQA ilovasining professional AI yordamchisiz.
Vazifang: Foydalanuvchi bilan o'zbek tilida samimiy suhbatlashib, ${entityName} e'lonini yaratishga yordam berish.

KATEGORIYA: ${categoryName} ${schema.emoji}
ENTITY TYPE: ${entityType}

QOIDALAR:
1. Faqat o'zbek tilida gaplash.
2. Bitta xabarda faqat BITTA savol ber.
3. Savollar tartibini quyidagicha bo'lishi kerak:
   ${schema.aiInstructions?.questionOrder?.map((key, i) => `${i + 1}. ${key}`).join('\n   ') || 'Schema bo\'yicha'}
4. MAJBURIY MAYDONLAR (to'ldirish shart):
${requiredFieldDescriptions}

5. XAVFSIZLIK QOIDALARI (MUHIM):
   - Kredit foizlarini, ipoteka shartlarini, yoki boshqa moliyaviy ma'lumotlarni IXTRO QILMA
   - Faqat foydalanuvchi aytgan ma'lumotlarni qaytar
   - Agar foydalanuvchi "kredit mumkin" deb aytgan bo'lsa, faqat boolean qaytar, foizlarni ixtiro qilma
   - Hujjatlar holati, yuridik ma'lumotlar - faqat foydalanuvchi aytganini qaytar

6. Ma'lumot yetarli bo'lganda (barcha majburiy maydonlar to'ldirilganda), suhbatni to'xtat va FAQAT quyidagi JSON formatda javob qaytar:
{
  "isFinished": true,
  "entityType": "${entityType}",
  "category": "${category}",
  "core": {
    "title": "...",
    "description": "...",
    ${entityType === 'product' ? `
    "price": 0,
    "is_free": false,
    "condition": "new" | "like_new" | "good" | "fair" | "poor",
    "neighborhood": "...",
    "old_price": 0,
    "stock_qty": 0
    ` : `
    "priceType": "fixed" | "hourly" | "negotiable",
    "price": "...",
    "tags": ["tag1", "tag2", "tag3"]
    `}
  },
  "attributes": {
    ${schema.fields
      .filter(f => !['title', 'description', 'price', 'is_free', 'condition', 'neighborhood', 'old_price', 'stock_qty', 'priceType', 'tags', 'category'].includes(f.key))
      .map(f => `"${f.key}": ${f.type === 'number' ? '0' : f.type === 'boolean' ? 'false' : f.type === 'array' ? '[]' : '""'}`)
      .join(',\n    ')}
  }
}

7. MAYDONLARNI QAYTARISH QOIDALARI:
${fieldExtractionInstructions}

${entityType === 'service' ? `
8. TEGLAR UCHUN QATTIQ QOIDALAR:
- Teglar soni: ${TAG_RULES.MIN}-${TAG_RULES.MAX} ta
- Format: FAQAT lotin alifbosi (a-z, 0-9), kichik harflar, defis (-)
- Har bir teg: ${TAG_RULES.MIN_LENGTH}-${TAG_RULES.MAX_LENGTH} belgi
- Intent-based: Aniq, maqsadli teglar
${tagSuggestions}
` : ''}

9. JAVOB FORMATI:
- Agar hali ma'lumot yetarli emas bo'lsa: Oddiy matn javob qaytar
- Agar barcha majburiy maydonlar to'ldirilgan bo'lsa: JSON formatda qaytar

O'zbek tilida javob bering.
`

  return basePrompt
}

/**
 * Start a new unified chat session
 */
export async function startUnifiedChatSession(
  sessionId: string,
  entityType: 'product' | 'service',
  category: string
): Promise<{ sessionId: string; greeting: string }> {
  // Get schema
  const schema = getCategorySchema(category)
  if (!schema) {
    throw new Error(`Category schema not found: ${category}`)
  }

  if (schema.entityType !== entityType) {
    throw new Error(`Category ${category} is not for entity type ${entityType}`)
  }

  // Generate system prompt
  const systemPrompt = await generateSystemPrompt(entityType, category, schema)

  // Initialize session
  const session: UnifiedChatSession = {
    entityType,
    category,
    schema,
    chatHistory: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
    ],
    filledData: {
      core: {},
      attributes: {},
    },
  }

  chatSessions.set(sessionId, session)

  // Generate greeting
  const greeting = schema.aiInstructions?.greeting || 
    `Salom! ${schema.displayName} ${schema.emoji} e'lonini yaratishga yordam beraman.`

  // Add greeting to history
  session.chatHistory.push({
    role: 'model',
    parts: [{ text: greeting }],
  })

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
  if (!session) {
    throw new Error('Chat session not found')
  }

  // Add user message to history
  session.chatHistory.push({
    role: 'user',
    parts: [{ text: message }],
  })

  // Call Gemini API
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      chatHistory: session.chatHistory.slice(0, -1), // Send history without current message
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to get response from Gemini API')
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Add model response to history
  session.chatHistory.push({
    role: 'model',
    parts: [{ text }],
  })

  // Try to parse JSON response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0])
      if (jsonData.isFinished === true && jsonData.entityType && jsonData.category) {
        // Validate required fields
        const validation = validateRequiredFields(session.schema, {
          core: jsonData.core || {},
          attributes: jsonData.attributes || {},
        })

        if (!validation.valid) {
          // Missing required fields, continue conversation
          return {
            isFinished: false,
            message: `Iltimos, quyidagi maydonlarni ham to'ldiring: ${validation.missing.join(', ')}. ${text}`,
          }
        }

        // All required fields filled
        const output: UnifiedAIOutput = {
          isFinished: true,
          entityType: jsonData.entityType,
          category: jsonData.category,
          core: jsonData.core || {},
          attributes: jsonData.attributes || {},
          ...(jsonData.entityType === 'service' ? {
            serviceFields: {
              priceType: jsonData.core?.priceType || jsonData.serviceFields?.priceType,
              price: jsonData.core?.price || jsonData.serviceFields?.price,
              tags: jsonData.core?.tags || jsonData.serviceFields?.tags || [],
            },
          } : {}),
        }

        return {
          isFinished: true,
          data: output,
          message: text,
        }
      }
    }
  } catch (e) {
    // Not a JSON response, continue normally
  }

  return {
    isFinished: false,
    message: text,
  }
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

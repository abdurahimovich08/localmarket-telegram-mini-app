import type { VercelRequest, VercelResponse } from '@vercel/node'

interface UserContext {
  hasStore: boolean
  hasServices: boolean
  hasListings: boolean
  storeId?: string
  storeName?: string
  serviceIds?: string[]
}

interface ConversationMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

interface IntentResponse {
  intent: 'buyer' | 'seller' | 'store_create' | 'store_view' | 'store_edit' | 'service_create' | 'service_edit' | 'listing_create' | 'unknown'
  confidence: number
  route?: string
  message: string
}

/**
 * Gemini AI Conversation Handler
 * Detects user intent and provides routing guidance
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

  if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set')
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const { message, chatHistory = [], userContext } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Build system prompt with user context
    const systemPrompt = buildSystemPrompt(userContext)
    
    // Build conversation history
    const contents: ConversationMessage[] = [
      {
        role: 'model',
        parts: [{ text: systemPrompt }]
      },
      ...(chatHistory || []),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ]

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return res.status(response.status).json({ error: 'Gemini API error', details: errorText })
    }

    const data = await response.json()
    
    // Extract response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Kechirasiz, javob olishda xatolik yuz berdi.'
    
    // Parse intent from response (if structured)
    const intent = parseIntentFromResponse(responseText, userContext)

    res.status(200).json({
      message: responseText,
      intent: intent.intent,
      confidence: intent.confidence,
      route: intent.route
    })
  } catch (error) {
    console.error('Error in Gemini chat:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(userContext?: UserContext): string {
  let contextInfo = ''
  
  if (userContext) {
    if (userContext.hasStore) {
      contextInfo += `Foydalanuvchida do'kon mavjud. Do'kon ID: ${userContext.storeId}, Nomi: ${userContext.storeName}.\n`
    }
    if (userContext.hasServices) {
      contextInfo += `Foydalanuvchida ${userContext.serviceIds?.length || 0} ta xizmat mavjud.\n`
    }
    if (userContext.hasListings) {
      contextInfo += `Foydalanuvchida e'lonlar mavjud.\n`
    }
  }

  return `Siz LocalMarket Telegram botining yordamchi AI asistentisiz. Sizning vazifangiz foydalanuvchining maqsadini aniqlab, uni kerakli joyga yo'naltirish.

${contextInfo}

**Foydalanuvchi maqsadlari:**

1. **Xaridor (Buyer)**: Mahsulot yoki xizmat sotib olishni xohlaydi
   - Route: "/" (bosh sahifa)

2. **Sotuvchi - Do'kon yaratish**: Yangi do'kon yaratmoqchi
   - Route: "/create-store"

3. **Sotuvchi - Do'kon kuzatish**: Mavjud do'konini ko'rish
   - Route: "/store/:id" (agar do'kon bor bo'lsa)

4. **Sotuvchi - Do'kon tahrirlash**: Do'konini tahrirlamoqchi
   - Route: "/store/:id/edit" (agar do'kon bor bo'lsa)

5. **Sotuvchi - Xizmat yaratish**: Yangi xizmat yaratmoqchi
   - Route: "/create-service"

6. **Sotuvchi - Xizmat tahrirlash**: Mavjud xizmatni tahrirlamoqchi
   - Route: "/service/:id/edit" (agar xizmat bor bo'lsa)

7. **Sotuvchi - E'lon yaratish**: Yangi e'lon yaratmoqchi
   - Route: "/create"

**Javob berish qoidalari:**
- Qisqa, tushunarli va do'stona javob bering
- Foydalanuvchining maqsadini aniqlang
- Agar foydalanuvchida do'kon/xizmat bor bo'lsa, uni eslatib o'ting
- Javob oxirida route'ni JSON formatda qo'shing: {"intent": "...", "route": "..."}

**Intent turlari:**
- "buyer" - Xaridor
- "store_create" - Do'kon yaratish
- "store_view" - Do'kon kuzatish
- "store_edit" - Do'kon tahrirlash
- "service_create" - Xizmat yaratish
- "service_edit" - Xizmat tahrirlash
- "listing_create" - E'lon yaratish
- "unknown" - Aniqlanmadi

O'zbek tilida javob bering.`
}

/**
 * Parse intent from AI response
 */
function parseIntentFromResponse(responseText: string, userContext?: UserContext): IntentResponse {
  const lowerText = responseText.toLowerCase()
  
  // Check for JSON in response
  const jsonMatch = responseText.match(/\{[\s\S]*"intent"[\s\S]*"route"[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        intent: parsed.intent || 'unknown',
        confidence: 0.9,
        route: parsed.route,
        message: responseText
      }
    } catch (e) {
      console.error('Error parsing JSON from response:', e)
    }
  }

  // Intent detection based on keywords
  if (lowerText.includes('sotib olish') || lowerText.includes('xarid') || lowerText.includes('mahsulot') || lowerText.includes('xizmat') && !lowerText.includes('yaratish')) {
    return {
      intent: 'buyer',
      confidence: 0.8,
      route: '/',
      message: responseText
    }
  }

  if (lowerText.includes('do\'kon yaratish') || lowerText.includes('do\'kon yaratmoq')) {
    return {
      intent: 'store_create',
      confidence: 0.9,
      route: '/create-store',
      message: responseText
    }
  }

  if (lowerText.includes('do\'kon ko\'rish') || lowerText.includes('do\'konni ko\'rish') || lowerText.includes('mening do\'konim')) {
    if (userContext?.hasStore && userContext.storeId) {
      return {
        intent: 'store_view',
        confidence: 0.9,
        route: `/store/${userContext.storeId}`,
        message: responseText
      }
    }
    return {
      intent: 'store_create',
      confidence: 0.7,
      route: '/create-store',
      message: responseText
    }
  }

  if (lowerText.includes('do\'kon tahrirlash') || lowerText.includes('do\'konni tahrirlash')) {
    if (userContext?.hasStore && userContext.storeId) {
      return {
        intent: 'store_edit',
        confidence: 0.9,
        route: `/store/${userContext.storeId}/edit`,
        message: responseText
      }
    }
    return {
      intent: 'store_create',
      confidence: 0.7,
      route: '/create-store',
      message: responseText
    }
  }

  if (lowerText.includes('xizmat yaratish') || lowerText.includes('xizmat ko\'rsatish')) {
    return {
      intent: 'service_create',
      confidence: 0.9,
      route: '/create-service',
      message: responseText
    }
  }

  if (lowerText.includes('xizmat tahrirlash') || lowerText.includes('xizmatni tahrirlash')) {
    if (userContext?.hasServices && userContext.serviceIds && userContext.serviceIds.length > 0) {
      return {
        intent: 'service_edit',
        confidence: 0.8,
        route: `/service/${userContext.serviceIds[0]}/edit`,
        message: responseText
      }
    }
    return {
      intent: 'service_create',
      confidence: 0.7,
      route: '/create-service',
      message: responseText
    }
  }

  if (lowerText.includes('e\'lon yaratish') || lowerText.includes('e\'lon yaratmoq') || lowerText.includes('sotish')) {
    return {
      intent: 'listing_create',
      confidence: 0.8,
      route: '/create',
      message: responseText
    }
  }

  return {
    intent: 'unknown',
    confidence: 0.5,
    message: responseText
  }
}

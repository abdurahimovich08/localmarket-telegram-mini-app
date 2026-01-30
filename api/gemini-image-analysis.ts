import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ImageAnalysisRequest {
  category: {
    id: string
    labelUz: string
    audience: string
    segment: string
  }
  images: string[] // base64 strings (without data:image/...;base64, prefix)
  userHint?: string // Optional user hint (e.g., "Nike sport kurtka")
  language: 'uz'
}

interface ImageAnalysisResponse {
  title: string
  description: string
  brand: string | null
  material: string | null
  condition: 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha' | null
}

/**
 * Gemini AI Image Analysis Handler
 * Analyzes product images and category to generate listing details
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
    return res.status(500).json({ 
      error: 'API key not configured',
      details: 'Missing VITE_GEMINI_API_KEY or GEMINI_API_KEY environment variable'
    })
  }

  try {
    const { category, images, userHint, language }: ImageAnalysisRequest = req.body

    if (!category || !images || images.length === 0) {
      return res.status(400).json({ error: 'Category and images are required' })
    }

    // Limit to first 3 images to reduce payload size
    const imagesToAnalyze = images.slice(0, 3)

    // Build system prompt with user hint if provided
    const hintContext = userHint ? `\n⚠️ FOYDALANUVCHI HINT: "${userHint}" - bu ma'lumotni e'tiborga oling!` : ''
    
    const systemPrompt = `Siz O'zbekistondagi kiyim-kechak bozori uchun mahsulot e'lon yordamchisisiz.

Berilgan ma'lumotlar:
- Kategoriya: ${category.labelUz} (${category.audience}, ${category.segment})${hintContext}
- Mahsulot rasmlari (base64)

⚠️ MUHIM QOIDALAR:
1. TELEFON RAQAM, MANZIL, ISM yoki boshqa shaxsiy ma'lumotlarni description yoki title'ga KIRITMA!
2. Faqat mahsulot haqida yozing.
3. "AI", "generatsiya qilingan" kabi so'zlarni yozmang.

O'zbek tilida generatsiya qiling:
1. Sarlavha: Qisqa, SEO-uchun mos (maksimal 80 belgi)${userHint ? ' - user hint\'ni e\'tiborga oling!' : ''}
2. Tavsif: Marketplace uchun optimallashtirilgan (maksimal 500 belgi):
   - Holati (yangi/yangi kabi/yaxshi/o'rtacha)
   - O'lcham (agar rasmdan ko'rinib turgan bo'lsa)
   - Rang (agar ko'rinib turgan bo'lsa)
   - Mavsum (qish/yoz/kuz/bahor - agar mos bo'lsa)
   - Kimga mos (${category.audience})
   - Yetkazib berish/kelishish (optional, agar ko'rinib turgan bo'lsa)
   - Jozibali va sotuvga yo'naltirilgan
3. Brend: Rasmlardan yoki user hint'dan aniqlang yoki null qoldiring
4. Material: Bu kategoriya uchun keng tarqalgan materiallar yoki null
5. Holati: Rasmlardan baholash (yangi/yangi_kabi/yaxshi/o'rtacha) - agar aniqlay olmasangiz null qoldiring

FAQAT quyidagi JSON formatda qaytaring (boshqa matn qo'shmang):
{
  "title": "...",
  "description": "...",
  "brand": "..." | null,
  "material": "..." | null,
  "condition": "yangi" | "yangi_kabi" | "yaxshi" | "o'rtacha" | null
}`

    // Prepare image parts for Gemini (images already have prefix removed)
    const imageParts = imagesToAnalyze.map(base64Data => {
      return {
        inlineData: {
          data: base64Data, // Already without prefix
          mimeType: 'image/jpeg' // Assume JPEG after compression
        }
      }
    })

    // Build request body for Gemini API
    const contents = [
      {
        role: 'model',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'user',
        parts: [
          { text: `Quyidagi rasmlarni tahlil qiling va mahsulot ma'lumotlarini generatsiya qiling:\n\nKategoriya: ${category.labelUz}\nAudience: ${category.audience}\nSegment: ${category.segment}${userHint ? `\n\n⚠️ FOYDALANUVCHI HINT: "${userHint}" - bu ma'lumotni e'tiborga oling!` : ''}` },
          ...imageParts
        ]
      }
    ]

    // 8. Observability: Log request
    const requestStartTime = Date.now()
    const requestSize = JSON.stringify({ contents }).length
    console.log('[AI API Request]', {
      taxonomy: category.id,
      imagesCount: imagesToAnalyze.length,
      requestSizeKB: Math.round(requestSize / 1024),
      hasHint: !!userHint,
      timestamp: new Date().toISOString()
    })

    // 2. Timeout: Create AbortController for backend timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s backend timeout

    // Call Gemini API with vision support (with timeout)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeoutId))

    const latency = Date.now() - requestStartTime

    if (!response.ok) {
      const errorText = await response.text()
      
      // 8. Observability: Log error
      console.error('[AI API Error]', {
        status: response.status,
        error: errorText.substring(0, 200),
        latency: latency + 'ms',
        timestamp: new Date().toISOString()
      })
      
      // 4. Rate limit handling
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: 'AI hozir band. Iltimos, keyinroq urinib ko\'ring.'
        })
      }
      
      // Try gemini-2.0-flash if flash-exp fails
      if (response.status === 404) {
        const fallbackResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents }),
            signal: controller.signal,
          }
        )
        
        if (!fallbackResponse.ok) {
          const fallbackError = await fallbackResponse.text()
          console.error('[AI API Fallback Error]', {
            status: fallbackResponse.status,
            error: fallbackError.substring(0, 200),
            latency: Date.now() - requestStartTime + 'ms'
          })
          return res.status(fallbackResponse.status).json({ 
            error: 'Gemini API error', 
            details: fallbackError 
          })
        }
        
        const fallbackData = await fallbackResponse.json()
        const responseText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || ''
        
        // Parse JSON from response
        const parsed = parseAIResponse(responseText)
        
        // 8. Observability: Log success
        console.log('[AI API Success]', {
          model: 'gemini-2.0-flash (fallback)',
          latency: Date.now() - requestStartTime + 'ms',
          timestamp: new Date().toISOString()
        })
        
        return res.status(200).json(parsed)
      }
      
      return res.status(response.status).json({ 
        error: 'Gemini API error', 
        details: errorText 
      })
    }

    const data = await response.json()
    
    // Extract response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Parse JSON from response
    const parsed = parseAIResponse(responseText)
    
    // 8. Observability: Log success
    console.log('[AI API Success]', {
      model: 'gemini-2.0-flash-exp',
      latency: latency + 'ms',
      responseSize: JSON.stringify(parsed).length,
      timestamp: new Date().toISOString()
    })
    
    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Error in Gemini image analysis:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

/**
 * Parse AI response and extract JSON with strict validation
 */
function parseAIResponse(responseText: string): ImageAnalysisResponse {
  if (!responseText || typeof responseText !== 'string') {
    console.error('Invalid response text')
    return getDefaultResponse()
  }

  // Try multiple JSON extraction patterns
  let jsonText = responseText
  
  // Pattern 1: Remove markdown code blocks
  jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
  
  // Pattern 2: Find JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    jsonText = jsonMatch[0]
  }
  
  try {
    const parsed = JSON.parse(jsonText)
    
    // Strict validation
    if (!parsed || typeof parsed !== 'object') {
      console.error('Parsed response is not an object')
      return getDefaultResponse()
    }
    
    // Validate and normalize response
    const title = String(parsed.title || '').trim().substring(0, 80)
    const description = String(parsed.description || '').trim().substring(0, 500)
    const brand = parsed.brand && String(parsed.brand).trim() ? String(parsed.brand).trim() : null
    const material = parsed.material && String(parsed.material).trim() ? String(parsed.material).trim() : null
    // 5. Condition mapping: null instead of default if invalid (premium UX)
    const condition = validateCondition(parsed.condition) // Returns null if invalid
    
    return {
      title,
      description,
      brand,
      material,
      condition: condition || null // Explicit null instead of default
    }
  } catch (e) {
    console.error('Failed to parse AI JSON response:', e, 'Response text:', responseText.substring(0, 200))
    return getDefaultResponse()
  }
}

/**
 * Get default response
 */
function getDefaultResponse(): ImageAnalysisResponse {
  return {
    title: '',
    description: '',
    brand: null,
    material: null,
    condition: 'yangi'
  }
}

/**
 * Validate condition value
 */
function validateCondition(condition: any): 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha' | null {
  const validConditions = ['yangi', 'yangi_kabi', 'yaxshi', 'o\'rtacha']
  if (typeof condition === 'string' && validConditions.includes(condition)) {
    return condition as 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha'
  }
  return null
}

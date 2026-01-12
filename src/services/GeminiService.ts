// Secure Gemini Service - Uses Vercel API route instead of direct API calls
import { TAG_RULES } from '../lib/tagUtils'
import { getTagSuggestionsForAI } from '../lib/tagAnalytics'

// Dynamic system prompt with tag suggestions
async function getSystemPrompt(): Promise<string> {
  // Get tag analytics (non-blocking, with fallback)
  let tagSuggestions = ''
  try {
    const suggestions = await getTagSuggestionsForAI()
    
    if (suggestions.topTags.length > 0 || suggestions.trendingTags.length > 0) {
      tagSuggestions = `

📊 PLATFORM TAG STATISTICS (AI Self-Improvement):
Top performing tags this week: ${suggestions.topTags.slice(0, 5).join(', ')}
Trending tags: ${suggestions.trendingTags.slice(0, 5).join(', ')}
Effective tags (high match rate): ${suggestions.effectiveTags.slice(0, 5).join(', ')}

⚠️ AVOID generic tags (low match rate): ${suggestions.avoidTags.slice(0, 3).join(', ')}
💡 TIP: Use specific, intent-based tags like the top performers above.
`
    }
  } catch (error) {
    // If analytics fetch fails, continue without suggestions
    console.warn('Could not fetch tag analytics for AI prompt:', error)
  }

  const basePrompt = `
Sen - men SOQQA ilovasining professional HR va Marketing mutaxassisisan. 
Vazifang: Foydalanuvchi bilan o'zbek tilida samimiy suhbatlashib, uning xizmatlari haqida ma'lumot olish.

QOIDALAR:
1. Faqat o'zbek tilida gaplash.
2. Bitta xabarda faqat BITTA savol ber.
3. Suhbat tartibi:
   - Salomlash va kasbini so'rash.
   - Tajribasi va ustunliklarini so'rash.
   - Narx va ishlash hududini so'rash.
4. Ma'lumot yetarli bo'lganda, suhbatni to'xtat va FAQAT quyidagi JSON formatda javob qaytar:
{
  "isFinished": true,
  "data": {
    "title": "Jalb qiluvchi sarlavha",
    "description": "Sotuvchi tavsif (emojilar bilan)",
    "category": "Kategoriya",
    "priceType": "fixed" | "hourly" | "negotiable",
    "price": "Narx (string)",
    "tags": ["tag1", "tag2", "tag3"]
  }
}

⚠️ TEGLAR UCHUN QATTIQ QOIDALAR (MUHIM):
- Teglar soni: ${TAG_RULES.MIN}-${TAG_RULES.MAX} ta (kamida ${TAG_RULES.MIN}, ko'pi bilan ${TAG_RULES.MAX})
- Format: FAQAT lotin alifbosi (a-z, 0-9), kichik harflar, defis (-) bilan so'zlarni ajratish
- Har bir teg uzunligi: ${TAG_RULES.MIN_LENGTH}-${TAG_RULES.MAX_LENGTH} belgi
- Dublikat: Bir xil teg ikki marta yozilmaydi
- Intent-based: Umumiy so'zlar o'rniga aniq, maqsadli teglar
  ✅ YAXSHI: ["web-development", "react-js", "responsive-design", "fast-delivery"]
  ❌ YOMON: ["web", "design", "shop", "market"] (juda umumiy)
- Masalan: ["logo-design", "brand-identity", "minimalist", "professional"] ✅
- XATO: ["Логотип", "DESIGN", "telegram bot arzon", "Puthon"] ❌
- To'g'ri: ["logo-design", "telegram-bot", "python", "web-development"] ✅
- Kirill, arab, yoki boshqa alifbolar QAT'IY TAVSIYA ETILMAYDI
- Katta harflar QAT'IY TAVSIYA ETILMAYDI (barchasi kichik)
- So'zlar orasida bo'shliq o'rniga defis (-) ishlatiladi
`

export interface ServiceData {
  title: string
  description: string
  category: string
  priceType: 'fixed' | 'hourly' | 'negotiable'
  price: string
  tags: string[]
}

export interface ChatResponse {
  isFinished: boolean
  data?: ServiceData
  message?: string
}

interface ChatMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

// Chat history stored in memory (per session)
// Will be initialized with dynamic prompt in startChatSession
let chatHistory: ChatMessage[] = []

export async function startChatSession() {
  // Reset chat history for new session
  chatHistory = [
    {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }],
    },
    {
      role: 'model',
      parts: [{ text: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz? (Masalan: dasturlash, dizayn, tushuntirish va h.k.)' }],
    },
  ]
  return { history: chatHistory }
}

export async function sendMessage(chat: any, message: string): Promise<ChatResponse> {
  try {
    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: message }],
    })

    // Get updated system prompt (in case tag analytics changed)
    const systemPrompt = await getSystemPrompt()
    
    // Update first message in history with latest system prompt
    if (chatHistory.length > 0 && chatHistory[0].role === 'user') {
      chatHistory[0].parts[0].text = systemPrompt
    }

    // Call our secure API route
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chatHistory: chatHistory.slice(0, -1), // Send history without the current message
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to get response from Gemini API')
    }

    const data = await response.json()

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Add model response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text }],
    })

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0])
        if (jsonData.isFinished === true) {
          return {
            isFinished: true,
            data: jsonData.data,
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
  } catch (error) {
    console.error('Error sending message to Gemini:', error)
    throw new Error('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
  }
}

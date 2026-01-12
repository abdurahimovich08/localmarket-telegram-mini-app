// Secure Gemini Service - Uses Vercel API route instead of direct API calls

const SYSTEM_PROMPT = `
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
- Teglar soni: 3-7 ta (kamida 3, ko'pi bilan 7)
- Format: FAQAT lotin alifbosi (a-z), kichik harflar
- Dublikat: Bir xil teg ikki marta yozilmaydi
- Masalan: ["logo", "design", "branding", "minimalist"] ✅
- XATO: ["Логотип", "DESIGN", "telegram bot arzon", "Puthon"] ❌
- To'g'ri: ["logo", "design", "telegram", "python"] ✅
- Har bir teg bitta so'z yoki qisqa ibora (2-3 so'z, lekin lotin alifbosi)
- Kirill, arab, yoki boshqa alifbolar QAT'IY TAVSIYA ETILMAYDI
- Katta harflar QAT'IY TAVSIYA ETILMAYDI (barchasi kichik)
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
let chatHistory: ChatMessage[] = [
  {
    role: 'user',
    parts: [{ text: SYSTEM_PROMPT }],
  },
  {
    role: 'model',
    parts: [{ text: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz? (Masalan: dasturlash, dizayn, tushuntirish va h.k.)' }],
  },
]

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

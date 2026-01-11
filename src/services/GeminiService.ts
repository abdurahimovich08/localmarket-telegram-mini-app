import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY or VITE_GOOGLE_API_KEY is not set in environment variables')
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

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
    "tags": ["tag1", "tag2"]
  }
}
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

export async function startChatSession() {
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' })
  
  // Start chat with system prompt
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'Salom! SOQQA ilovasiga xush kelibsiz! Men sizning xizmatlaringizni yaratishga yordam beraman. Boshlash uchun, qanday xizmat ko\'rsatasiz? (Masalan: dasturlash, dizayn, tushuntirish va h.k.)' }],
      },
    ],
  })

  return chat
}

export async function sendMessage(chat: any, message: string): Promise<ChatResponse> {
  if (!genAI) {
    throw new Error('Gemini API key is not configured.')
  }

  try {
    const result = await chat.sendMessage(message)
    const response = await result.response
    const text = response.text()

    // Try to parse JSON response
    try {
      // Look for JSON in the response
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

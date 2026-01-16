import { GoogleGenerativeAI } from '@google/generative-ai'

// Get API key - this file can be used both client-side and server-side
// In Vite client: import.meta.env.VITE_GEMINI_API_KEY
// In Node/Vercel: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
const API_KEY = typeof process !== 'undefined' && process.env
  ? (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '')
  : (typeof import !== 'undefined' && import.meta?.env?.VITE_GEMINI_API_KEY || '')

if (!API_KEY) {
  console.warn('GEMINI_API_KEY not found. Tag generation will fail.')
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

export async function generateTags(data: {
  brand: string
  country_of_origin: string
  year?: string
  material: string
  purpose: string
  taxonomy?: string
}): Promise<string[]> {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured')
    }

    const { brand, country_of_origin, year, material, purpose, taxonomy } = data

    if (!brand || !country_of_origin || !material || !purpose) {
      throw new Error('Missing required fields')
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Siz professional e-commerce tag generatsiya mutaxassisisan.

Quyidagi maxsulot ma'lumotlariga asoslanib, imloviy xatolarsiz, to'g'ri teglar generatsiya qiling:

Maxsulot ma'lumotlari:
- Brend: ${brand}
- Ishlab chiqarilgan mamlakat: ${country_of_origin}
- Yil: ${year || 'Noma\'lum'}
- Material: ${material}
- Maqsad: ${purpose}
- Taxonomiya: ${taxonomy || 'Noma\'lum'}

TEGLAR QOIDALARI:
1. Teglar lotin alifbosi bilan yozilishi kerak
2. Kichik harflar ishlatiladi
3. Bo'shliq o'rniga defis (-) ishlatiladi
4. Imloviy xatolarsiz, to'g'ri yozilishi kerak
5. 5-10 ta teg generatsiya qiling
6. Teglar maxsulotning asosiy xususiyatlarini aks ettirishi kerak

FAQAT JSON formatda javob qaytaring:
{
  "tags": ["tag1", "tag2", "tag3", ...]
}

Masalan:
{
  "tags": ["nike", "sport-shoes", "running", "men", "2024", "cotton", "uzbekistan"]
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.tags || []
    }

    throw new Error('Failed to parse AI response')
  } catch (error: any) {
    console.error('Tag generation error:', error)
    throw error
  }
}

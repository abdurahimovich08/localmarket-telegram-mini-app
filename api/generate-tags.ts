import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

  if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables')
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const { brand, country_of_origin, year, material, purpose, taxonomy } = req.body

    if (!brand || !country_of_origin || !material || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

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

    // Build the request body for Gemini API (same pattern as api/gemini.ts)
    const requestBody: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    }

    // Use gemini-2.0-flash (same as api/gemini.ts)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return res.status(response.status).json({ error: 'Gemini API error', details: errorText })
    }

    const data = await response.json()
    
    // Extract text from Gemini response (same pattern as other API routes)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return res.status(200).json({ tags: parsed.tags || [] })
    }

    return res.status(500).json({ error: 'Failed to parse AI response' })
  } catch (error) {
    console.error('Error in tag generation API route:', error)
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' })
  }
}

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
    const { message, chatHistory } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Build the request body for Gemini API
    const requestBody: any = {
      contents: [
        ...(chatHistory || []),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ],
    }

    // Use gemini-1.5-flash (faster, cheaper, better for frontend)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
    res.status(200).json(data)
  } catch (error) {
    console.error('Error in Gemini API route:', error)
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' })
  }
}

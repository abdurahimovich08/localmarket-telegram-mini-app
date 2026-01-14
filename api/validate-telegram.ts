import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

/**
 * Validate Telegram WebApp initData
 * 
 * This ensures that the initData hasn't been tampered with
 * and was actually sent by Telegram
 */
export function validateTelegramData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    
    if (!hash) {
      return false
    }
    
    // Remove hash from params
    urlParams.delete('hash')
    
    // Create data check string (sorted key-value pairs)
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()
    
    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')
    
    // Compare hashes
    return calculatedHash === hash
  } catch (error) {
    console.error('Error validating Telegram data:', error)
    return false
  }
}

/**
 * Extract user data from validated initData
 */
export function extractUserFromInitData(initData: string): {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
} | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const userParam = urlParams.get('user')
    
    if (!userParam) {
      return null
    }
    
    const user = JSON.parse(decodeURIComponent(userParam))
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
    }
  } catch (error) {
    console.error('Error extracting user from initData:', error)
    return null
  }
}

/**
 * API endpoint to validate Telegram session
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { initData } = req.body
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN

  if (!initData) {
    return res.status(400).json({ error: 'initData is required' })
  }

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set')
    return res.status(500).json({ error: 'Bot token not configured' })
  }

  // Validate initData
  const isValid = validateTelegramData(initData, botToken)

  if (!isValid) {
    return res.status(401).json({ 
      error: 'Invalid Telegram session',
      details: 'initData validation failed'
    })
  }

  // Extract user data
  const user = extractUserFromInitData(initData)

  if (!user) {
    return res.status(400).json({ error: 'Could not extract user data' })
  }

  return res.status(200).json({
    valid: true,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
    }
  })
}

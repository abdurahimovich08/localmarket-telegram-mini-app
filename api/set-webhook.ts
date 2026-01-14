// Vercel Serverless Function to set Telegram webhook
// Call this once after deployment: https://your-app.vercel.app/api/set-webhook

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN
  const webhookUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/telegram-bot`
    : req.query.url as string || 'https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot'

  if (!token) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not found' })
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
    const data = await response.json()
    
    return res.status(200).json({
      success: data.ok,
      message: data.description || 'Webhook set successfully',
      webhookUrl,
      webhookInfo: data
    })
  } catch (error) {
    console.error('Error setting webhook:', error)
    return res.status(500).json({ 
      error: 'Failed to set webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

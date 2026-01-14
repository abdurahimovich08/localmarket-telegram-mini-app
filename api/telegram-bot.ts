// Vercel Serverless Function for Telegram Bot
// This handles webhook requests from Telegram

import type { VercelRequest, VercelResponse } from '@vercel/node'

// Initialize bot with token from environment
const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN
const miniAppUrl = process.env.MINI_APP_URL || process.env.VITE_MINI_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://localmarket-telegram-mini-app-q1vp.vercel.app')

// Lazy load TelegramBot to avoid issues in serverless environment
let TelegramBot: any = null
let bot: any = null

function getBot() {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not found in environment variables')
    return null
  }
  
  if (!TelegramBot) {
    try {
      TelegramBot = require('node-telegram-bot-api')
    } catch (e) {
      console.error('Failed to load node-telegram-bot-api:', e)
      return null
    }
  }
  
  if (!bot && TelegramBot) {
    bot = new TelegramBot(token, { polling: false }) // Webhook mode
  }
  
  return bot
}

// Handle /start command with deep links
function handleStartCommand(msg: any) {
  const botInstance = getBot()
  if (!botInstance) return

  const chatId = msg.chat.id
  const text = msg.text || ''
  
  // Extract payload from /start command
  // Format: /start store_<ID> or /start service_<ID>
  const payload = text.replace('/start', '').trim()
  
  let appUrl = miniAppUrl
  let welcomeMessage = `🏪 Welcome to LocalMarket!\n\nBuy and sell items in your neighborhood, all within Telegram!\n\nTap the button below to open the Mini App:`
  let buttonText = '🚀 Open LocalMarket'
  
  // Parse deep link payloads: store_<ID> or service_<ID>
  if (payload) {
    if (payload.startsWith('store_')) {
      const storeId = payload.replace('store_', '')
      appUrl = `${miniAppUrl}/?ctx=store:${storeId}`
      welcomeMessage = `🏪 Do'konni ko'rish uchun quyidagi tugmani bosing:`
      buttonText = '🛍 Do\'konni Ochish'
    } else if (payload.startsWith('service_')) {
      const serviceId = payload.replace('service_', '')
      appUrl = `${miniAppUrl}/?ctx=service:${serviceId}`
      welcomeMessage = `🛠 Xizmatni ko'rish uchun quyidagi tugmani bosing:`
      buttonText = '🚀 Xizmatni Ochish'
    }
  }
  
  botInstance.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [[
        { text: buttonText, web_app: { url: appUrl } }
      ]]
    }
  }).catch((error) => {
    console.error('Error sending message:', error)
  })
}

// Handle /sell command
function handleSellCommand(msg: any) {
  const botInstance = getBot()
  if (!botInstance) return
  
  const chatId = msg.chat.id
  botInstance.sendMessage(chatId, 'Create a new listing:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '➕ Create Listing', web_app: { url: `${miniAppUrl}/create` } }
      ]]
    }
  }).catch(err => console.error('Error:', err))
}

// Handle /mysales command
function handleMySalesCommand(msg: any) {
  const botInstance = getBot()
  if (!botInstance) return
  
  const chatId = msg.chat.id
  botInstance.sendMessage(chatId, 'View your listings:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '📦 My Listings', web_app: { url: `${miniAppUrl}/my-listings` } }
      ]]
    }
  }).catch(err => console.error('Error:', err))
}

// Handle /help command
function handleHelpCommand(msg: any) {
  const botInstance = getBot()
  if (!botInstance) return
  
  const chatId = msg.chat.id
  botInstance.sendMessage(chatId, `🛡️ Safety Tips for LocalMarket:

✅ Meet in public places
✅ Check items before paying
✅ Don't share personal information
✅ Trust your instincts
✅ Report suspicious activity

💡 Tips:
• Take clear photos of your items
• Write detailed descriptions
• Set fair prices
• Respond to messages quickly
• Leave honest reviews`).catch(err => console.error('Error:', err))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!token) {
    console.error('Bot not initialized - missing TELEGRAM_BOT_TOKEN')
    return res.status(500).json({ error: 'Bot not configured' })
  }

  try {
    const update = req.body

    // Handle message updates
    if (update.message) {
      const msg = update.message
      const text = msg.text || ''

      // Handle /start command
      if (text.startsWith('/start')) {
        handleStartCommand(msg)
      }
      // Handle /sell command
      else if (text.startsWith('/sell')) {
        handleSellCommand(msg)
      }
      // Handle /mysales command
      else if (text.startsWith('/mysales')) {
        handleMySalesCommand(msg)
      }
      // Handle /help command
      else if (text.startsWith('/help')) {
        handleHelpCommand(msg)
      }
    }

    // Always return 200 OK to Telegram
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return res.status(200).json({ ok: true }) // Still return 200 to avoid retries
  }
}

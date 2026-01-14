// Vercel Serverless Function for Telegram Bot
// This handles webhook requests from Telegram

import type { VercelRequest, VercelResponse } from '@vercel/node'
import TelegramBot from 'node-telegram-bot-api'

// Initialize bot with token from environment
const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN
const miniAppUrl = process.env.MINI_APP_URL || process.env.VITE_MINI_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://localmarket-telegram-mini-app-q1vp.vercel.app')

// Create bot instance (webhook mode, not polling)
let bot: TelegramBot | null = null

function getBot(): TelegramBot | null {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not found in environment variables')
    return null
  }
  
  if (!bot) {
    try {
      bot = new TelegramBot(token, { polling: false }) // Webhook mode
    } catch (e) {
      console.error('Failed to create TelegramBot instance:', e)
      return null
    }
  }
  
  return bot
}

// Track referral in backend
async function trackReferral(userTelegramId: number, referralCode: string): Promise<{ success: boolean; store_id?: string; store_name?: string }> {
  const apiUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/track-referral`
    : `${miniAppUrl}/api/track-referral`
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_telegram_id: userTelegramId,
        referral_code: referralCode
      })
    })
    
    if (!response.ok) {
      console.error('Failed to track referral:', response.statusText)
      return { success: false }
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error tracking referral:', error)
    return { success: false }
  }
}

// Handle /start command with deep links
async function handleStartCommand(msg: any) {
  const botInstance = getBot()
  if (!botInstance) return

  const chatId = msg.chat.id
  const telegramUserId = msg.from?.id
  const text = msg.text || ''
  
  // Extract payload from /start command
  // Format: /start store_<ID> or /start service_<ID> or /start <REFERRAL_CODE>
  const payload = text.replace('/start', '').trim()
  
  let appUrl = miniAppUrl
  let welcomeMessage = `🏪 LocalMarket - Mahalliy Bozor Ilovasi!\n\n` +
    `📱 **Nimalar qila olasiz:**\n\n` +
    `🛍️ **Sotib olish:**\n` +
    `• Mahalliy e'lonlarni ko'rish\n` +
    `• Kategoriya bo'yicha qidirish\n` +
    `• Narx va masofa bo'yicha filtrlash\n` +
    `• Sevimlilarga qo'shish\n` +
    `• Sotuvchi bilan bevosita chat\n\n` +
    `💰 **Sotish:**\n` +
    `• E'lon yaratish (rasm bilan)\n` +
    `• Do'kon yaratish va boshqarish\n` +
    `• Xizmatlar ko'rsatish\n` +
    `• Buyurtmalarni kuzatish\n\n` +
    `⭐ **Qo'shimcha imkoniyatlar:**\n` +
    `• Reyting va sharhlar\n` +
    `• Joylashuv asosida qidirish\n` +
    `• Shaxsiy profil va statistika\n` +
    `• Savat va buyurtmalar\n\n` +
    `👇 **Ilovani ochish uchun quyidagi tugmani bosing:**`
  let buttonText = '🚀 LocalMarket\'ni Ochish'
  let referralCode: string | null = null
  let storeId: string | null = null
  
  // Parse deep link payloads
  if (payload) {
    if (payload.startsWith('store_')) {
      // Old format: store_<UUID>
      storeId = payload.replace('store_', '')
      appUrl = `${miniAppUrl}/?ctx=store:${storeId}`
      welcomeMessage = `🏪 Do'konni ko'rish uchun quyidagi tugmani bosing:\n\n` +
        `📱 **Do'konda nimalar bor:**\n` +
        `• Mahsulotlar va xizmatlar\n` +
        `• Narxlar va tavsiflar\n` +
        `• Buyurtma berish imkoniyati\n` +
        `• Do'kon egasi bilan chat\n\n` +
        `👇 **Tugmani bosing:**`
      buttonText = '🛍 Do\'konni Ochish'
    } else if (payload.startsWith('service_')) {
      // Service format: service_<UUID>
      const serviceId = payload.replace('service_', '')
      appUrl = `${miniAppUrl}/?ctx=service:${serviceId}`
      welcomeMessage = `🛠 Xizmatni ko'rish uchun quyidagi tugmani bosing:\n\n` +
        `📱 **Xizmat haqida:**\n` +
        `• Xizmat tavsifi va narxi\n` +
        `• Xizmat ko'rsatuvchi profil\n` +
        `• Buyurtma berish imkoniyati\n` +
        `• Xizmat ko'rsatuvchi bilan chat\n\n` +
        `👇 **Tugmani bosing:**`
      buttonText = '🚀 Xizmatni Ochish'
    } else {
      // New format: referral code directly (e.g., a9xK2)
      referralCode = payload
      // Backend'ga referral tracking yuborish
      if (telegramUserId && referralCode) {
        const trackingResult = await trackReferral(telegramUserId, referralCode)
        if (trackingResult.success && trackingResult.store_id) {
          storeId = trackingResult.store_id
          appUrl = `${miniAppUrl}/?ctx=store:${storeId}`
          welcomeMessage = `🏪 ${trackingResult.store_name || 'Do\'kon'} do'koniga ulandingiz!\n\n` +
            `📱 **Do'konda nimalar bor:**\n` +
            `• Mahsulotlar va xizmatlar\n` +
            `• Narxlar va tavsiflar\n` +
            `• Buyurtma berish imkoniyati\n` +
            `• Do'kon egasi bilan chat\n\n` +
            `👇 **Do'konni ko'rish uchun quyidagi tugmani bosing:**`
          buttonText = '🛍 Do\'konni Ochish'
        } else {
          // Invalid referral code - still show welcome but don't track
          console.warn('Invalid referral code:', referralCode)
        }
      }
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
  // Debug logging
  console.log('=== Telegram Bot Webhook Called ===')
  console.log('Method:', req.method)
  console.log('Headers:', JSON.stringify(req.headers))
  console.log('Body keys:', Object.keys(req.body || {}))
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Rejected: Method not allowed')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!token) {
    console.error('Bot not initialized - missing TELEGRAM_BOT_TOKEN')
    return res.status(500).json({ error: 'Bot not configured' })
  }

  try {
    const update = req.body
    console.log('Update received:', JSON.stringify(update).substring(0, 200))

    // Handle message updates
    if (update.message) {
      const msg = update.message
      const text = msg.text || ''
      console.log('Message text:', text)
      console.log('Chat ID:', msg.chat?.id)
      console.log('User ID:', msg.from?.id)

      // Handle /start command
      if (text.startsWith('/start')) {
        console.log('Handling /start command')
        await handleStartCommand(msg)
      }
      // Handle /sell command
      else if (text.startsWith('/sell')) {
        console.log('Handling /sell command')
        handleSellCommand(msg)
      }
      // Handle /mysales command
      else if (text.startsWith('/mysales')) {
        console.log('Handling /mysales command')
        handleMySalesCommand(msg)
      }
      // Handle /help command
      else if (text.startsWith('/help')) {
        console.log('Handling /help command')
        handleHelpCommand(msg)
      } else {
        console.log('Unknown command:', text)
      }
    } else {
      console.log('No message in update')
    }

    // Always return 200 OK to Telegram
    console.log('Returning 200 OK')
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return res.status(200).json({ ok: true }) // Still return 200 to avoid retries
  }
}

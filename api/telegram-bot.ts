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

// Get user context for AI
async function getUserContext(telegramUserId: number): Promise<any> {
  // Always use production URL to avoid Vercel deployment protection
  const apiUrl = `${miniAppUrl}/api/user-context`
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_user_id: telegramUserId })
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('Failed to get user context:', response.status, response.statusText, errorText)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error getting user context:', error)
    return null
  }
}

// Call Gemini AI for conversation
async function callGeminiAI(message: string, chatHistory: any[] = [], userContext: any = null): Promise<any> {
  // Always use production URL to avoid Vercel deployment protection
  const apiUrl = `${miniAppUrl}/api/gemini-chat`
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatHistory, userContext })
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('Failed to call Gemini AI:', response.status, response.statusText, errorText)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error calling Gemini AI:', error)
    return null
  }
}

// Track referral in backend
async function trackReferral(userTelegramId: number, referralCode: string): Promise<{ success: boolean; store_id?: string; store_name?: string }> {
  // Always use production URL to avoid Vercel deployment protection
  const apiUrl = `${miniAppUrl}/api/track-referral`
  
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

// Handle /start command with AI conversation
async function handleStartCommand(msg: any) {
  const botInstance = getBot()
  if (!botInstance) return

  const chatId = msg.chat.id
  const telegramUserId = msg.from?.id
  const text = msg.text || ''
  
  // Extract payload from /start command
  // Format: /start store_<ID> or /start service_<ID> or /start <REFERRAL_CODE>
  const payload = text.replace('/start', '').trim()
  
  // If there's a payload (deep link), handle it directly without AI
  if (payload && (payload.startsWith('store_') || payload.startsWith('service_') || payload.length > 0 && !payload.includes(' '))) {
    // Handle deep links and referral codes (existing logic)
    let appUrl = miniAppUrl
    let welcomeMessage = ''
    let buttonText = '🚀 LocalMarket\'ni Ochish'
    let referralCode: string | null = null
    let storeId: string | null = null
    
    if (payload.startsWith('store_')) {
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
      // Referral code
      referralCode = payload
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
        }
      }
    }
    
    if (welcomeMessage) {
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
    return
  }
  
  // No payload - start AI conversation
  if (!telegramUserId) {
    console.error('No telegram user ID')
    return
  }
  
  // Get user context
  try {
    console.log('Getting user context for /start command, user:', telegramUserId)
    const userContext = await getUserContext(telegramUserId)
    console.log('User context retrieved:', { 
      hasStore: userContext?.hasStore, 
      hasServices: userContext?.hasServices,
      hasListings: userContext?.hasListings 
    })
    
    // Start AI conversation
    const initialMessage = "Salom! LocalMarket'ga xush kelibsiz! Siz nima qilmoqchisiz?"
    console.log('Calling Gemini AI for /start command')
    const aiResponse = await callGeminiAI(initialMessage, [], userContext)
    console.log('AI response received:', { hasResponse: !!aiResponse, hasMessage: !!aiResponse?.message, intent: aiResponse?.intent })
    
    if (!aiResponse || !aiResponse.message) {
      // Fallback to default message
      console.warn('AI response is empty, using fallback message')
      const defaultMessage = `🏪 LocalMarket - Mahalliy Bozor Ilovasi!\n\n` +
        `Siz nima qilmoqchisiz?\n\n` +
        `🛍️ Mahsulot sotib olishni xohlayman\n` +
        `💰 Mahsulot sotishni xohlayman\n` +
        `🏪 Do'kon yaratmoqchiman\n` +
        `🛠 Xizmat ko'rsatmoqchiman\n\n` +
        `👇 Ilovani ochish uchun quyidagi tugmani bosing:`
      
      await botInstance.sendMessage(chatId, defaultMessage, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 LocalMarket\'ni Ochish', web_app: { url: miniAppUrl } }
          ]]
        }
      })
      console.log('Fallback message sent for /start')
      return
    }
    
    // Send AI response
    const responseMessage = aiResponse.message
    const intent = aiResponse.intent || 'unknown'
    const route = aiResponse.route || '/'
    
    // Build app URL based on intent
    let appUrl = miniAppUrl
    if (route && route !== '/') {
      appUrl = `${miniAppUrl}${route}`
    }
    
    // Create keyboard with options based on intent
    const keyboard: any[] = []
    
    if (intent === 'buyer') {
      keyboard.push([{ text: '🛍️ Bozorni Ko\'rish', web_app: { url: `${miniAppUrl}/` } }])
    } else if (intent === 'store_create') {
      keyboard.push([{ text: '🏪 Do\'kon Yaratish', web_app: { url: `${miniAppUrl}/create-store` } }])
    } else if (intent === 'store_view' && userContext?.storeId) {
      keyboard.push([{ text: '🏪 Do\'konni Ko\'rish', web_app: { url: `${miniAppUrl}/store/${userContext.storeId}` } }])
    } else if (intent === 'store_edit' && userContext?.storeId) {
      keyboard.push([{ text: '✏️ Do\'konni Tahrirlash', web_app: { url: `${miniAppUrl}/store/${userContext.storeId}/edit` } }])
    } else if (intent === 'service_create') {
      keyboard.push([{ text: '🛠 Xizmat Yaratish', web_app: { url: `${miniAppUrl}/create-service` } }])
    } else if (intent === 'listing_create') {
      keyboard.push([{ text: '📦 E\'lon Yaratish', web_app: { url: `${miniAppUrl}/create` } }])
    } else {
      // Default: show main app
      keyboard.push([{ text: '🚀 LocalMarket\'ni Ochish', web_app: { url: appUrl } }])
    }
    
    console.log('Sending AI response for /start:', { messageLength: responseMessage.length, intent, hasKeyboard: keyboard.length > 0 })
    await botInstance.sendMessage(chatId, responseMessage, {
      reply_markup: {
        inline_keyboard: keyboard
      },
      parse_mode: 'Markdown'
    })
    console.log('AI response sent successfully for /start')
  } catch (error) {
    console.error('Error in /start AI conversation:', error)
    // Fallback message on error
    try {
      await botInstance.sendMessage(chatId, 
        `🏪 LocalMarket - Mahalliy Bozor Ilovasi!\n\n` +
        `Siz nima qilmoqchisiz?\n\n` +
        `🛍️ Mahsulot sotib olish\n` +
        `💰 Mahsulot sotish\n` +
        `🏪 Do'kon yaratish\n` +
        `🛠 Xizmat ko'rsatish\n\n` +
        `👇 Ilovani ochish uchun quyidagi tugmani bosing:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀 LocalMarket\'ni Ochish', web_app: { url: miniAppUrl } }
            ]]
          }
        }
      )
      console.log('Error fallback message sent')
    } catch (sendError) {
      console.error('Error sending fallback message:', sendError)
    }
  }
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
        console.log('Handling /start command with AI')
        await handleStartCommand(msg)
      }
      // Handle regular messages (for AI conversation continuation)
      else if (msg.text && !msg.text.startsWith('/')) {
        console.log('Handling regular message for AI conversation')
        const botInstance = getBot()
        if (!botInstance) {
          console.error('Bot instance not available')
          return
        }
        
        // Store conversation state in memory (simple implementation)
        // In production, use Redis or database for conversation state
        const chatId = msg.chat.id
        const telegramUserId = msg.from?.id
        
        if (!telegramUserId) {
          console.error('No telegram user ID found')
          return
        }

        try {
          // Get user context
          console.log('Getting user context for user:', telegramUserId)
          const userContext = await getUserContext(telegramUserId)
          console.log('User context retrieved:', { 
            hasStore: userContext?.hasStore, 
            hasServices: userContext?.hasServices,
            hasListings: userContext?.hasListings 
          })
          
          // Call AI with user message
          console.log('Calling Gemini AI with message:', msg.text.substring(0, 50))
          const aiResponse = await callGeminiAI(msg.text, [], userContext)
          console.log('AI response received:', { 
            hasResponse: !!aiResponse, 
            hasMessage: !!aiResponse?.message,
            intent: aiResponse?.intent 
          })
          
          if (aiResponse && aiResponse.message) {
            const responseMessage = aiResponse.message
            const intent = aiResponse.intent || 'unknown'
            const route = aiResponse.route || '/'
            
            // Build app URL based on intent
            let appUrl = miniAppUrl
            if (route && route !== '/') {
              appUrl = `${miniAppUrl}${route}`
            }
            
            // Create keyboard
            const keyboard: any[] = []
            if (intent === 'buyer') {
              keyboard.push([{ text: '🛍️ Bozorni Ko\'rish', web_app: { url: `${miniAppUrl}/` } }])
            } else if (intent === 'store_create') {
              keyboard.push([{ text: '🏪 Do\'kon Yaratish', web_app: { url: `${miniAppUrl}/create-store` } }])
            } else if (intent === 'store_view' && userContext?.storeId) {
              keyboard.push([{ text: '🏪 Do\'konni Ko\'rish', web_app: { url: `${miniAppUrl}/store/${userContext.storeId}` } }])
            } else if (intent === 'store_edit' && userContext?.storeId) {
              keyboard.push([{ text: '✏️ Do\'konni Tahrirlash', web_app: { url: `${miniAppUrl}/store/${userContext.storeId}/edit` } }])
            } else if (intent === 'service_create') {
              keyboard.push([{ text: '🛠 Xizmat Yaratish', web_app: { url: `${miniAppUrl}/create-service` } }])
            } else if (intent === 'listing_create') {
              keyboard.push([{ text: '📦 E\'lon Yaratish', web_app: { url: `${miniAppUrl}/create` } }])
            } else {
              keyboard.push([{ text: '🚀 LocalMarket\'ni Ochish', web_app: { url: appUrl } }])
            }
            
            console.log('Sending AI response to user:', { messageLength: responseMessage.length, intent, hasKeyboard: keyboard.length > 0 })
            await botInstance.sendMessage(chatId, responseMessage, {
              reply_markup: {
                inline_keyboard: keyboard
              },
              parse_mode: 'Markdown'
            })
            console.log('AI response sent successfully')
          } else {
            // Fallback message if AI response is empty
            console.warn('AI response is empty or invalid, sending fallback message')
            const fallbackMessage = `🤖 Salom! LocalMarket botiga xush kelibsiz!\n\n` +
              `Men sizga yordam bera olaman:\n\n` +
              `🛍️ **Sotib olish** - mahsulot va xizmatlarni topish\n` +
              `💰 **Sotish** - e'lon, do'kon yoki xizmat yaratish\n\n` +
              `Nima qilmoqchisiz?`
            
            await botInstance.sendMessage(chatId, fallbackMessage, {
              reply_markup: {
                inline_keyboard: [[
                  { text: '🛍️ Bozorni Ko\'rish', web_app: { url: `${miniAppUrl}/` } },
                  { text: '💰 Sotish', web_app: { url: `${miniAppUrl}/create` } }
                ]]
              },
              parse_mode: 'Markdown'
            })
            console.log('Fallback message sent')
          }
        } catch (error) {
          console.error('Error in AI conversation handler:', error)
          // Send error message to user
          try {
            await botInstance.sendMessage(chatId, 
              '😔 Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki /start buyrug\'ini yuboring.',
              {
                reply_markup: {
                  inline_keyboard: [[
                    { text: '🔄 Qayta Boshlash', web_app: { url: miniAppUrl } }
                  ]]
                }
              }
            )
          } catch (sendError) {
            console.error('Error sending error message:', sendError)
          }
        }
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

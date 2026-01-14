// Telegram Bot for LocalMarket
// Run with: node bot/telegram-bot.js
// Or use: npm run bot

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Bot commands
bot.setMyCommands([
  { command: 'start', description: 'Welcome message + launch Mini App' },
  { command: 'sell', description: 'Quick shortcut to create listing' },
  { command: 'mysales', description: 'View my active listings' },
  { command: 'help', description: 'Show help and safety tips' },
]);

// /start command - supports deep links for stores and services
bot.onText(/\/start(.*)/, (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const miniAppUrl = process.env.MINI_APP_URL || 'https://your-app-url.com';
    
    console.log('Received /start command');
    console.log('Match:', match);
    console.log('Message text:', msg.text);
    
    // Get payload - match[1] could be undefined or empty string
    let payload = '';
    if (match && match[1]) {
      payload = match[1].trim();
      console.log('Payload:', payload);
    }
    
    let appUrl = miniAppUrl;
    let welcomeMessage = `🏪 Welcome to LocalMarket!\n\nBuy and sell items in your neighborhood, all within Telegram!\n\nTap the button below to open the Mini App:`;
    let buttonText = '🚀 Open LocalMarket';
    
    // Parse deep link payloads: store_<ID> or service_<ID>
    if (payload) {
      if (payload.startsWith('store_')) {
        const storeId = payload.replace('store_', '');
        appUrl = `${miniAppUrl}/?ctx=store:${storeId}`;
        welcomeMessage = `🏪 Do'konni ko'rish uchun quyidagi tugmani bosing:`;
        buttonText = '🛍 Do\'konni Ochish';
        console.log('Store link detected, storeId:', storeId);
      } else if (payload.startsWith('service_')) {
        const serviceId = payload.replace('service_', '');
        appUrl = `${miniAppUrl}/?ctx=service:${serviceId}`;
        welcomeMessage = `🛠 Xizmatni ko'rish uchun quyidagi tugmani bosing:`;
        buttonText = '🚀 Xizmatni Ochish';
        console.log('Service link detected, serviceId:', serviceId);
      }
    }
    
    console.log('Sending message to chatId:', chatId);
    console.log('App URL:', appUrl);
    console.log('Button text:', buttonText);
    
    bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [[
          { text: buttonText, web_app: { url: appUrl } }
        ]]
      }
    }).then(() => {
      console.log('Message sent successfully');
    }).catch((error) => {
      console.error('Error sending message:', error);
      // Try sending without button as fallback
      bot.sendMessage(chatId, welcomeMessage + '\n\n' + appUrl).catch(err => {
        console.error('Fallback message also failed:', err);
      });
    });
  } catch (error) {
    console.error('Error in /start handler:', error);
  }
});

// /sell command
bot.onText(/\/sell/, (msg) => {
  const chatId = msg.chat.id;
  const miniAppUrl = process.env.MINI_APP_URL || 'https://your-app-url.com';
  
  bot.sendMessage(chatId, 'Create a new listing:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '➕ Create Listing', web_app: { url: `${miniAppUrl}/create` } }
      ]]
    }
  });
});

// /mysales command
bot.onText(/\/mysales/, (msg) => {
  const chatId = msg.chat.id;
  const miniAppUrl = process.env.MINI_APP_URL || 'https://your-app-url.com';
  
  bot.sendMessage(chatId, 'View your listings:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '📦 My Listings', web_app: { url: `${miniAppUrl}/my-listings` } }
      ]]
    }
  });
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `
🛡️ Safety Tips for LocalMarket:

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
• Leave honest reviews

Need help? Contact @your_support_username
  `);
});

// Handle callback queries (button clicks)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  // Handle different callback queries here
  bot.answerCallbackQuery(query.id);
});

// Handle messages about listings
bot.on('message', (msg) => {
  // This can be used to handle notifications when users message about listings
  // You can integrate with your database to track messages
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 LocalMarket Telegram Bot is running...');
console.log('Bot username:', bot.getMe().then(me => console.log(`@${me.username}`)));

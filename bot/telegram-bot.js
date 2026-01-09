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

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const miniAppUrl = process.env.MINI_APP_URL || 'https://your-app-url.com';
  
  bot.sendMessage(chatId, `
🏪 Welcome to LocalMarket!

Buy and sell items in your neighborhood, all within Telegram!

Tap the button below to open the Mini App:
  `, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🚀 Open LocalMarket', web_app: { url: miniAppUrl } }
      ]]
    }
  });
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

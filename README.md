# LocalMarket - Telegram Mini App

A hyperlocal marketplace Telegram Mini App where users can buy and sell secondhand items within their neighborhood.

## Features

- 🔐 Telegram native authentication (no signup needed)
- 📱 Create and manage listings with photos
- 🔍 Search and filter listings by category, price, distance
- 💬 Native Telegram messaging integration
- ⭐ Reviews and ratings system
- ❤️ Favorites and saved items
- 📍 Location-based listings
- 💰 Telegram Stars payment integration
- 🚀 Boost listings feature

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Telegram Bot Setup

1. Create bot via @BotFather
2. Set Mini App URL as Menu Button
3. Configure bot commands:
   - `/start` - Welcome message + launch Mini App
   - `/sell` - Quick shortcut to create listing
   - `/mysales` - View my active listings
   - `/help` - Show help and safety tips

## Database Setup

See `database/schema.sql` for database schema.

## License

MIT

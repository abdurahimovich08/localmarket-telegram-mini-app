# LocalMarket Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Telegram account
- A Supabase account (free tier works)
- A Telegram Bot (created via @BotFather)

## Step 1: Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Save the bot token you receive
5. Set up bot commands:
   ```
   /setcommands
   ```
   Then paste:
   ```
   start - Welcome message + launch Mini App
   sell - Quick shortcut to create listing
   mysales - View my active listings
   help - Show help and safety tips
   ```
6. Set Menu Button:
   ```
   /newapp
   ```
   Select your bot, then provide:
   - App title: LocalMarket
   - App description: Buy & sell locally
   - App URL: (your deployed app URL)
   - App icon: (upload an icon)

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the SQL from `database/schema.sql`
4. Go to Settings > API and copy:
   - Project URL
   - Anon/public key

## Step 3: Install Dependencies

```bash
cd localmarket-telegram-mini-app
npm install
```

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

## Step 5: Set Up Image Storage (Optional)

### Option A: Supabase Storage

1. In Supabase, go to Storage
2. Create a bucket named `listings`
3. Set it to public
4. Update the image upload code in `CreateListing.tsx` to use Supabase Storage

### Option B: Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name and upload preset
3. Add to `.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```

## Step 6: Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 7: Test in Telegram

1. Use a tool like [ngrok](https://ngrok.com) to expose your local server:
   ```bash
   ngrok http 3000
   ```
2. Update your bot's Menu Button URL to the ngrok URL
3. Open your bot in Telegram and tap the Menu Button

## Step 8: Deploy

### Frontend (Vercel/Netlify)

1. Push your code to GitHub
2. Connect to Vercel or Netlify
3. Add environment variables
4. Deploy

### Bot (Railway/Render)

1. Go to `bot/` directory
2. Install dependencies: `npm install`
3. Deploy to Railway or Render
4. Set environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `MINI_APP_URL` (your deployed frontend URL)

## Step 9: Update Bot Configuration

1. Update your bot's Menu Button URL to your deployed app URL
2. Test all bot commands
3. Verify Mini App opens correctly

## Troubleshooting

### Mini App not opening
- Ensure your URL uses HTTPS
- Check that the URL is set correctly in BotFather
- Verify the app is accessible in a browser

### Database errors
- Check Supabase connection
- Verify schema is created correctly
- Check RLS (Row Level Security) policies if needed

### Image upload not working
- Verify storage bucket is set up
- Check upload permissions
- Verify environment variables

## Next Steps

- Set up image compression
- Configure Telegram Stars payments
- Set up bot notifications
- Add analytics
- Configure error tracking

# Quick Start Guide

Follow these steps in order to get LocalMarket running:

## ✅ Step 1: Install Dependencies (DONE)
Dependencies are already installed. If you need to reinstall:
```powershell
cd localmarket-telegram-mini-app
npm install
```

## 📝 Step 2: Set Up Supabase Database

1. **Create Supabase account**: https://supabase.com
2. **Create new project** (wait 2-3 minutes)
3. **Run database schema**:
   - Go to SQL Editor in Supabase
   - Copy contents of `database/schema.sql`
   - Paste and run
4. **Get API credentials**:
   - Settings → API
   - Copy Project URL and anon key
5. **Set up storage**:
   - Storage → Create bucket named `listings`
   - Make it public
   - Add policies (see DATABASE_SETUP.md)

**Add to `.env` file:**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 🤖 Step 3: Create Telegram Bot

1. **Open Telegram**, search `@BotFather`
2. **Send `/newbot`** and follow prompts
3. **Save the bot token** you receive
4. **Set commands**: Send `/setcommands` to BotFather
5. **Create Mini App**: Send `/newapp` to BotFather
   - Use placeholder URL for now (we'll update after deployment)

**Add to `.env` file:**
```
VITE_TELEGRAM_BOT_TOKEN=123456789:ABCdef...
```

## 🖼️ Step 4: Set Up Image Storage (Optional)

### Option A: Use Supabase Storage (Recommended)
Already set up in Step 2! No additional config needed.

### Option B: Use Cloudinary
1. Sign up at https://cloudinary.com
2. Get cloud name and upload preset
3. Add to `.env`:
```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## 🚀 Step 5: Run Development Server

```powershell
npm run dev
```

The app will start at `http://localhost:3000`

## 🧪 Step 6: Test Locally with ngrok

Since Telegram requires HTTPS, use ngrok for local testing:

1. **Install ngrok**: https://ngrok.com/download
2. **Start ngrok**:
   ```powershell
   ngrok http 3000
   ```
3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
4. **Update bot Menu Button**:
   - Chat with @BotFather
   - Send `/newapp`
   - Select your bot
   - Update App URL to ngrok URL
5. **Test in Telegram**:
   - Open your bot
   - Tap Menu Button
   - Mini App should open!

## 📦 Step 7: Deploy to Production

### Frontend (Vercel - Recommended)

1. **Push to GitHub**:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repo
   - Add environment variables from `.env`
   - Deploy!

3. **Update bot Menu Button**:
   - Use your Vercel URL (e.g., `https://localmarket.vercel.app`)
   - Update via @BotFather `/newapp`

### Bot (Railway/Render - Optional)

Only needed if you want bot notifications:

1. **Deploy `bot/` folder**:
   - Railway: Connect repo, set env vars, deploy
   - Render: Create Web Service, set env vars, deploy

2. **Set environment variables**:
   - `TELEGRAM_BOT_TOKEN`
   - `MINI_APP_URL` (your deployed frontend URL)

## ✅ Checklist

- [ ] Supabase project created
- [ ] Database schema run successfully
- [ ] Supabase credentials in `.env`
- [ ] Storage bucket created and configured
- [ ] Telegram bot created
- [ ] Bot token in `.env`
- [ ] Bot commands set up
- [ ] Mini App created in BotFather
- [ ] Development server running
- [ ] Tested locally with ngrok
- [ ] Deployed to production
- [ ] Bot Menu Button updated with production URL

## 🆘 Need Help?

- **Database issues**: See `DATABASE_SETUP.md`
- **Bot setup**: See `BOT_SETUP.md`
- **General setup**: See `SETUP.md`

## 🎉 You're Done!

Your LocalMarket Telegram Mini App is ready! Users can now:
- Browse local listings
- Create their own listings
- Message sellers via Telegram
- Save favorites
- Leave reviews

Start sharing your bot and grow your local marketplace! 🚀

# Telegram Bot Setup Guide

## Step 1: Create Bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. BotFather will ask for a name:
   - Enter: `LocalMarket` (or any name you like)
4. BotFather will ask for a username:
   - Enter: `YourLocalMarketBot` (must end with "bot", e.g., `localmarket_bot`)
   - If taken, try variations like `localmarket123_bot`
5. BotFather will give you a **token** - **SAVE THIS!**
   - Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   - Add this to your `.env` file as `VITE_TELEGRAM_BOT_TOKEN`

## Step 2: Set Bot Commands

1. Still in chat with @BotFather, send:
   ```
   /setcommands
   ```
2. Select your bot from the list
3. Paste these commands:
   ```
   start - Welcome message + launch Mini App
   sell - Quick shortcut to create listing
   mysales - View my active listings
   help - Show help and safety tips
   ```
4. Click **Send** or press Enter

## Step 3: Set Menu Button (Mini App)

1. In chat with @BotFather, send:
   ```
   /newapp
   ```
2. Select your bot from the list
3. BotFather will ask for:
   - **App title**: `LocalMarket`
   - **App description**: `Buy & sell items in your neighborhood`
   - **App URL**: (For now, use a placeholder like `https://your-app-url.com` - we'll update this after deployment)
   - **App icon**: (Optional - upload a square image/icon)
4. BotFather will confirm the app is created

## Step 4: Test Bot Commands

1. Open your bot in Telegram (search for the username you created)
2. Send `/start` - should show welcome message
3. Send `/help` - should show safety tips
4. Send `/sell` - should show create listing button

## Step 5: Deploy Bot (Optional - for notifications)

The bot code is in `bot/telegram-bot.js`. To deploy:

1. Install bot dependencies:
   ```bash
   cd bot
   npm install
   ```

2. Create `bot/.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   MINI_APP_URL=https://your-deployed-app-url.com
   ```

3. Deploy to Railway/Render:
   - Railway: Connect GitHub repo, set environment variables, deploy
   - Render: Create new Web Service, set environment variables, deploy

## Step 6: Update Menu Button URL (After Deployment)

Once your app is deployed:

1. In chat with @BotFather, send:
   ```
   /newapp
   ```
2. Select your bot
3. Update the **App URL** to your deployed URL (e.g., `https://localmarket.vercel.app`)
4. The Menu Button will now open your Mini App!

## Testing the Mini App

1. Open your bot in Telegram
2. Tap the **Menu Button** (or send `/start` and tap the button)
3. The Mini App should open in Telegram
4. Test all features:
   - Browse listings
   - Create a listing
   - View profile
   - Search items

## Troubleshooting

### Bot not responding
- Check that token is correct in `.env`
- Make sure bot is not stopped (check with @BotFather: `/mybots`)

### Menu Button not showing
- Make sure you ran `/newapp` and set the URL
- Try restarting Telegram app
- Check that URL is HTTPS (required)

### Mini App not opening
- URL must be HTTPS
- URL must be accessible (not localhost)
- Use ngrok for local testing: `ngrok http 3000`

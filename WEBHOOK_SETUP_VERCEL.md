# 🔗 Telegram Bot Webhook Sozlash - Vercel

## ✅ Vercel URL
```
https://localmarket-telegram-mini-app-q1vp.vercel.app
```

## 📋 Qadamlar

### 1. Vercel'da Environment Variables Qo'shish

Vercel Dashboard > Settings > Environment Variables ga kiring va quyidagilarni qo'shing:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
```

Yoki:

```
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
```

**Muhim:** Environment variables qo'shgandan keyin **qayta deploy** qiling!

### 2. Webhook O'rnatish

#### Usul 1: PowerShell Script (Tavsiya etiladi)

```powershell
.\setup-webhook.ps1
```

#### Usul 2: Browser orqali

Browser'da oching:
```
https://localmarket-telegram-mini-app-q1vp.vercel.app/api/set-webhook
```

#### Usul 3: Terminal orqali

```powershell
$BOT_TOKEN = "your_bot_token_here"
$WEBHOOK_URL = "https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$([System.Web.HttpUtility]::UrlEncode($WEBHOOK_URL))" -Method Post
```

#### Usul 4: curl orqali

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot"
```

### 3. Webhook'ni Tekshirish

```powershell
$BOT_TOKEN = "your_bot_token_here"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Yoki browser'da:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## ✅ Tekshirish

1. **Webhook URL to'g'ri ekanligini tekshiring:**
   - `https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot`

2. **Bot'ga /start yuborib test qiling**

3. **Vercel logs'ni ko'ring:**
   - Vercel Dashboard > Deployments > Functions > telegram-bot

## 🆘 Muammo Hal Qilish

### Bot javob bermayapti?

1. **Environment variables to'g'ri qo'shilganligini tekshiring:**
   - Vercel Dashboard > Settings > Environment Variables
   - `TELEGRAM_BOT_TOKEN` yoki `VITE_TELEGRAM_BOT_TOKEN` mavjudligini tekshiring

2. **Qayta deploy qiling:**
   - Environment variables qo'shgandan keyin har doim qayta deploy qilish kerak!

3. **Webhook to'g'ri sozlanganligini tekshiring:**
   ```powershell
   $BOT_TOKEN = "your_bot_token_here"
   Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
   ```

4. **Vercel function deploy bo'lganligini tekshiring:**
   - Vercel Dashboard > Deployments > Functions
   - `api/telegram-bot` function mavjudligini tekshiring

### Webhook xatolik ko'rsatayapti?

1. **Vercel function logs'ni ko'ring:**
   - Vercel Dashboard > Deployments > Functions > telegram-bot > Logs

2. **Function code'ni tekshiring:**
   - `api/telegram-bot.ts` fayli mavjudligini tekshiring
   - `node-telegram-bot-api` package install qilinganligini tekshiring

3. **HTTPS URL ishlatilayotganligini tekshiring:**
   - Telegram faqat HTTPS webhook'larini qabul qiladi

## 📝 Eslatmalar

- **Local development:** `bot/telegram-bot.js` ni ishga tushiring (polling rejim)
- **Production:** Vercel webhook ishlatadi
- **Environment variables:** Qo'shgandan keyin har doim qayta deploy qiling!

## 🎯 Keyingi Qadamlar

1. ✅ Environment variables qo'shing
2. ✅ Qayta deploy qiling
3. ✅ Webhook o'rnating
4. ✅ Bot'ga /start yuborib test qiling
5. ✅ Deep link'lar ishlayotganligini tekshiring

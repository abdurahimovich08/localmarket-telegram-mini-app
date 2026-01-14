# 🔗 Telegram Bot Webhook Sozlash (Vercel uchun)

## Muammo
Bot javob bermayapti chunki Vercel'da bot polling rejimda ishlamaydi. Webhook sozlash kerak.

## Yechim: Vercel Serverless Function

Bot endi `api/telegram-bot.ts` orqali Vercel'da ishlaydi.

## Qadamlar

### 1. Vercel'ga Deploy Qilish

1. GitHub'ga push qiling (agar qilinmagan bo'lsa)
2. Vercel'ga deploy qiling

### 2. Environment Variables Qo'shish

Vercel Dashboard'da quyidagi environment variables qo'shing:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
MINI_APP_URL=https://your-vercel-app.vercel.app
```

Yoki:

```
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_MINI_APP_URL=https://your-vercel-app.vercel.app
```

### 3. Webhook Sozlash

Deploy bo'lgandan keyin, webhook URL'ni oling:

```
https://your-vercel-app.vercel.app/api/telegram-bot
```

### 4. Telegram'ga Webhook O'rnatish

**Usul 1: Bot kod orqali (tavsiya etiladi)**

Yangi fayl yaratamiz: `api/set-webhook.ts`

Yoki terminal'da:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-vercel-app.vercel.app/api/telegram-bot"
```

**Usul 2: BotFather orqali**

BotFather'da webhook sozlash imkoniyati yo'q, shuning uchun API orqali qilish kerak.

### 5. Webhook'ni Tekshirish

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Muammo Hal Qilish

### Bot javob bermayapti?

1. Webhook to'g'ri sozlanganligini tekshiring:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

2. Vercel'da environment variables borligini tekshiring

3. Vercel logs'ni ko'ring (Vercel Dashboard > Deployments > Functions)

### Webhook xatolik ko'rsatayapti?

1. `api/telegram-bot.ts` fayli mavjudligini tekshiring
2. `node-telegram-bot-api` package install qilinganligini tekshiring
3. Vercel'da function deploy bo'lganligini tekshiring

## Local Development

Local'da ishlatish uchun `bot/telegram-bot.js` ni ishga tushiring (polling rejim):

```powershell
cd bot
npm start
```

Production'da Vercel webhook ishlatadi.

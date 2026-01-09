# 🤖 Bot'ni Ishga Tushirish

## 1️⃣ Vercel URL'ni Olish

Agar Vercel'ga deploy qilgan bo'lsangiz:
1. Vercel dashboard'ga kiring: https://vercel.com
2. Project'ingizni oching
3. URL'ni ko'chiring (masalan: `https://localmarket-telegram-mini-app.vercel.app`)

## 2️⃣ .env Faylga MINI_APP_URL Qo'shish

`.env` faylga quyidagini qo'shing:

```
MINI_APP_URL=https://your-vercel-url.vercel.app
```

**Masalan:**
```
MINI_APP_URL=https://localmarket-telegram-mini-app.vercel.app
```

## 3️⃣ Bot'ni Ishga Tushirish

Terminal'da:

```powershell
cd bot
npm start
```

## 4️⃣ Test Qilish

Telegram'da bot'ingizga `/start` yuboring va button'ni bosing!

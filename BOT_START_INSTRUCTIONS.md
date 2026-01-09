# 🤖 Bot'ni Ishga Tushirish - Qadamlar

## ⚠️ MUHIM: Vercel URL'ni .env Faylga Qo'shing!

### 1. Vercel URL'ni Olish

Agar Vercel'ga deploy qilgan bo'lsangiz:
1. https://vercel.com ga kiring
2. Project'ingizni oching
3. URL'ni ko'chiring (masalan: `https://localmarket-telegram-mini-app-xxxxx.vercel.app`)

### 2. .env Faylga MINI_APP_URL Qo'shish

Root papkadagi `.env` faylga quyidagini qo'shing:

```
MINI_APP_URL=https://your-vercel-url.vercel.app
```

**Masalan:**
```
MINI_APP_URL=https://localmarket-telegram-mini-app.vercel.app
```

---

## 🚀 Bot'ni Ishga Tushirish

**Yangi terminal oching** va quyidagilarni bajaring:

```powershell
cd C:\localmarket-telegram-mini-app\bot
npm start
```

Yoki root papkadan:

```powershell
cd bot
npm start
```

---

## ✅ Muvaffaqiyatli Ishga Tushirish

Agar hammasi to'g'ri bo'lsa, terminal'da ko'rinadi:

```
🤖 LocalMarket Telegram Bot is running...
Bot username: @your_bot_username
```

---

## 🧪 Bot'ni Test Qilish

1. Telegram'da bot'ingizga kiring
2. `/start` buyrug'ini yuboring
3. "🚀 Open LocalMarket" button'ni bosing
4. Mini App ochilishi kerak! 🎉

### Qo'shimcha Testlar:

- `/sell` - Create listing button
- `/mysales` - My listings button
- `/help` - Help va safety tips

---

## ⚠️ Muammolar

### Bot ishlamayapti?

1. `.env` faylda `TELEGRAM_BOT_TOKEN` borligini tekshiring
2. Token to'g'ri ekanligini tekshiring
3. `MINI_APP_URL` qo'shilganligini tekshiring

### Mini App ochilmayapti?

1. `MINI_APP_URL` to'g'ri ekanligini tekshiring
2. URL HTTPS ekanligini tekshiring (http:// emas!)
3. Vercel'da app deploy bo'lganligini tekshiring
4. Browser'da URL'ni ochib tekshiring

---

## 📝 Eslatma

Bot'ni doimiy ishga tushirish uchun terminal oynasini yopmang! Yoki production'ga deploy qiling (Railway/Render).

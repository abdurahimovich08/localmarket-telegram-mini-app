# 🤖 Bot'ni Ishga Tushirish va Test Qilish

## 1️⃣ .env Faylini To'ldirish

Bot ishlashi uchun `.env` faylda `MINI_APP_URL` qo'shish kerak (Vercel URL).

Agar Vercel URL'ni olgan bo'lsangiz, `.env` faylga qo'shing:

```
MINI_APP_URL=https://your-app.vercel.app
```

**Masalan:**
```
MINI_APP_URL=https://localmarket-telegram-mini-app.vercel.app
```

---

## 2️⃣ Bot'ni Ishga Tushirish

### Terminal'da:

```powershell
cd bot
npm start
```

Yoki root papkadan:

```powershell
cd bot
node telegram-bot.js
```

### Natija:

Agar hammasi to'g'ri bo'lsa, terminal'da ko'rinadi:

```
🤖 LocalMarket Telegram Bot is running...
Bot username: @your_bot_username
```

---

## 3️⃣ Bot'ni Test Qilish

### Telegram'da Bot'ga Kiring:

1. Telegram'da bot'ingizni toping
2. `/start` buyrug'ini yuboring
3. "🚀 Open LocalMarket" button'ni bosing
4. Mini App ochilishi kerak! 🎉

### Qo'shimcha Testlar:

- `/sell` - Create listing button
- `/mysales` - My listings button  
- `/help` - Help va safety tips

---

## 4️⃣ BotFather'da Menu Button Sozlash

Agar Menu Button'ni sozlamagan bo'lsangiz:

1. Telegram'da **@BotFather** ga kiring
2. `/newapp` buyrug'ini yuboring
3. Bot'ingizni tanlang
4. **App URL** ga Vercel URL'ni kiriting
5. Save qiling

Endi bot'da Menu Button paydo bo'ladi!

---

## ⚠️ Muammolar

### Bot ishlamayapti?

1. `.env` faylda `TELEGRAM_BOT_TOKEN` borligini tekshiring
2. Token to'g'ri ekanligini tekshiring
3. Bot'ni to'xtatib qayta ishga tushiring

### Mini App ochilmayapti?

1. `MINI_APP_URL` to'g'ri ekanligini tekshiring
2. URL HTTPS ekanligini tekshiring
3. Vercel'da app deploy bo'lganligini tekshiring

---

## 🚀 Production Deploy (Ixtiyoriy)

Agar bot'ni 24/7 ishlatishni xohlasangiz, Railway yoki Render'ga deploy qiling:

1. `bot/` papkasini deploy qiling
2. Environment variables qo'shing:
   - `TELEGRAM_BOT_TOKEN`
   - `MINI_APP_URL`

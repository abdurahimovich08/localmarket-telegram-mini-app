# 🔧 Vercel Muammolarni Hal Qilish - To'liq Qo'llanma

## ❌ Muammo: Unauthorized Errors

API endpoints `Unauthorized` qaytaryapti. Bu environment variables muammosi.

---

## ✅ Hal Qilish: Environment Variables Qo'shish

### 1. Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. Project'ni tanlang: `localmarket-telegram-mini-app`
3. **Settings** > **Environment Variables** ga kiring

### 2. Quyidagi BARCHA Variables'larni Qo'shing

#### A. Supabase Variables (user-context.ts uchun)

```
Name: VITE_SUPABASE_URL
Value: https://hqshycfuvkrspqoeneqq.supabase.co
Environment: ✅ Production, ✅ Preview, ✅ Development
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_7fTSIgf0uEX-_chKArE6Fw_BqyZKcpu
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Yoki alternativ nomlar:**

```
Name: SUPABASE_URL
Value: https://hqshycfuvkrspqoeneqq.supabase.co
Environment: ✅ Production, ✅ Preview, ✅ Development
```

```
Name: SUPABASE_ANON_KEY
Value: sb_publishable_7fTSIgf0uEX-_chKArE6Fw_BqyZKcpu
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### B. Gemini API Key (gemini-chat.ts uchun)

```
Name: VITE_GEMINI_API_KEY
Value: AIzaSyB-GT2ilX_Qay4TAoR5Ei7S0ag7CdavbUM
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Yoki alternativ nom:**

```
Name: GEMINI_API_KEY
Value: AIzaSyB-GT2ilX_Qay4TAoR5Ei7S0ag7CdavbUM
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### C. Telegram Bot Token (telegram-bot.ts uchun)

```
Name: TELEGRAM_BOT_TOKEN
Value: 7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Yoki alternativ nom:**

```
Name: VITE_TELEGRAM_BOT_TOKEN
Value: 7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### D. Mini App URL

```
Name: MINI_APP_URL
Value: https://localmarket-telegram-mini-app-q1vp.vercel.app
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Yoki alternativ nom:**

```
Name: VITE_MINI_APP_URL
Value: https://localmarket-telegram-mini-app-q1vp.vercel.app
Environment: ✅ Production, ✅ Preview, ✅ Development
```

---

## ⚠️ MUHIM: Qayta Deploy Qiling!

Barcha variables qo'shgandan keyin:

1. **Vercel Dashboard** > **Deployments** ga kiring
2. Eng so'nggi deployment'ni toping
3. **...** (uch nuqta) tugmasini bosing
4. **Redeploy** ni tanlang
5. **Redeploy** tugmasini bosing

Yoki avtomatik rebuild bo'lishi uchun 2-3 daqiqa kutib turing.

---

## 🧪 Test Qilish

### 1. Bot'ga Test Xabar Yuborish

1. Telegram'da bot'ingizga kiring
2. `/start` yuboring
3. Yoki oddiy xabar yuboring (masalan: "Salom")

### 2. Vercel Logs'ni Tekshirish

1. **Vercel Dashboard** > **Deployments** > **Functions** ga kiring
2. `api/telegram-bot` function'ni tanlang
3. Logs'ni ko'ring

Agar hali ham `Unauthorized` ko'rsatilsa:
- Environment variables to'g'ri qo'shilganligini tekshiring
- Qayta deploy qiling
- 2-3 daqiqa kutib turing

---

## 🔍 Debug Qilish

### Environment Variables Tekshirish

Vercel'da environment variables'ni tekshirish uchun:

1. **Settings** > **Environment Variables** ga kiring
2. Har bir variable'ni tekshiring:
   - ✅ Name to'g'rimi?
   - ✅ Value to'g'rimi?
   - ✅ Environment (Production/Preview/Development) tanlanganmi?

### API Endpoints Test Qilish

Browser'da test qilish:

```
https://localmarket-telegram-mini-app-q1vp.vercel.app/api/user-context
```

POST request yuborish kerak (Postman yoki curl bilan).

---

## ✅ Muvaffaqiyatli Bo'lganda

Agar hammasi to'g'ri bo'lsa, logs'da ko'rinadi:

```
[info] Handling regular message for AI conversation
[info] User context retrieved successfully
[info] Gemini AI response received
[info] Returning 200 OK
```

---

## 🆘 Hali ham Muammo?

Agar hali ham muammo bo'lsa:

1. Barcha environment variables'ni qayta tekshiring
2. Qayta deploy qiling
3. 5-10 daqiqa kutib turing (Vercel cache bo'lishi mumkin)
4. Logs'ni to'liq ko'ring

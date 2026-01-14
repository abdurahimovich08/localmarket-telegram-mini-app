# 🔐 Vercel Environment Variables - To'liq Ro'yxat

## ⚠️ MUHIM: Vercel Dashboard'ga Kirib, Quyidagi Barcha Variables'larni Qo'shing!

Vercel Dashboard > Settings > Environment Variables > Add New

---

## 📋 Environment Variables Ro'yxati

Quyidagi **BARCHA** variables'larni Vercel'ga qo'shing:

### 1. Supabase Configuration

```
VITE_SUPABASE_URL=https://hqshycfuvkrspqoeneqq.supabase.co
```

```
VITE_SUPABASE_ANON_KEY=sb_publishable_7fTSIgf0uEX-_chKArE6Fw_BqyZKcpu
```

### 2. Telegram Bot Configuration

```
TELEGRAM_BOT_TOKEN=7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
```

**Yoki:**

```
VITE_TELEGRAM_BOT_TOKEN=7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM
```

### 3. Mini App URL

```
MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
```

**Yoki:**

```
VITE_MINI_APP_URL=https://localmarket-telegram-mini-app-q1vp.vercel.app
```

### 4. Gemini API (Agar ishlatilsa)

```
VITE_GEMINI_API_KEY=AIzaSyB-GT2ilX_Qay4TAoR5Ei7S0ag7CdavbUM
```

**Yoki:**

```
GEMINI_API_KEY=AIzaSyB-GT2ilX_Qay4TAoR5Ei7S0ag7CdavbUM
```

### 5. Bot Username

```
VITE_BOT_USERNAME=UZCHAT24BOT
```

**Eslatma:** `.env` faylida `https://t.me/UZCHAT24BOT` ko'rinishida, lekin faqat `UZCHAT24BOT` qo'shish kifoya.

---

## 📝 Qo'shish Qadamlar

1. **Vercel Dashboard'ga kiring**: https://vercel.com/dashboard
2. **Project'ni tanlang**: `localmarket-telegram-mini-app`
3. **Settings** > **Environment Variables** ga kiring
4. **Har bir variable uchun:**
   - **Name** ni kiriting (masalan: `TELEGRAM_BOT_TOKEN`)
   - **Value** ni kiriting (masalan: `7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM`)
   - **Environment** ni tanlang:
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**
   - **Add** tugmasini bosing

---

## ⚠️ MUHIM Eslatmalar

1. **Barcha variables'larni qo'shgandan keyin QAYTA DEPLOY qiling!**
   - Vercel Dashboard > Deployments > ... > Redeploy

2. **Ikkala variantni ham qo'shish tavsiya etiladi:**
   - `TELEGRAM_BOT_TOKEN` (serverless function uchun)
   - `VITE_TELEGRAM_BOT_TOKEN` (frontend uchun, agar kerak bo'lsa)

3. **MINI_APP_URL to'g'ri ekanligini tekshiring:**
   - `https://localmarket-telegram-mini-app-q1vp.vercel.app`

---

## ✅ Tekshirish

Barcha variables qo'shgandan keyin:

1. **Qayta deploy qiling**
2. **Webhook'ni tekshiring:**
   ```powershell
   $BOT_TOKEN = "7638342196:AAG26Me3-81ui8KTxKVq_EyLxmajeR4DAvM"
   Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
   ```

3. **Bot'ga /start yuborib test qiling**

---

## 🔗 Webhook URL

Webhook URL avtomatik sozlangan:
```
https://localmarket-telegram-mini-app-q1vp.vercel.app/api/telegram-bot
```

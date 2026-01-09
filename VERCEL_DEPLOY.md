# 🚀 Vercel'ga Deploy - Keyingi Qadamlar

## ✅ GitHub'ga Push - TAYYOR!

Kod muvaffaqiyatli GitHub'ga push qilindi:
- Repo: https://github.com/abdurahimovich08/localmarket-telegram-mini-app

---

## 📦 Vercel'ga Deploy Qilish

### 1. Vercel'ga Kirish

1. **https://vercel.com** ga kiring
2. **"Sign Up"** tugmasini bosing
3. **"Continue with GitHub"** ni tanlang (eng oson)
4. GitHub bilan login qiling

### 2. Project Import

1. **"Add New Project"** tugmasini bosing
2. **"Import Git Repository"** bo'limida
3. **GitHub** ni tanlang (agar birinchi marta bo'lsa, GitHub'ni ulash kerak)
4. `abdurahimovich08/localmarket-telegram-mini-app` repo'ni tanlang
5. **"Import"** tugmasini bosing

### 3. Project Sozlash

**Framework Preset:** Vite (avtomatik aniqlanishi kerak)

**Root Directory:** `.` (default - o'zgartirish shart emas)

**Build Command:** `npm run build` (default)

**Output Directory:** `dist` (default)

### 4. Environment Variables Qo'shish ⚠️ MUHIM!

**"Environment Variables"** bo'limiga kirib, quyidagilarni qo'shing:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://hqshycfuvkrspqoeneqq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_7fTSIgf0uEX-_chKArE6Fw_BqyZKcpu` |

**Environment** uchun: ✅ **Production**, ✅ **Preview**, ✅ **Development** (hamma uchun belgilang)

**"Add"** tugmasini bosing har bir variable uchun

### 5. Deploy!

1. **"Deploy"** tugmasini bosing
2. 2-3 daqiqa kutib turing
3. Deploy muvaffaqiyatli bo'lgach, sizga **URL beriladi**!

**Masalan:** `https://localmarket-telegram-mini-app.vercel.app`

---

## 🔗 BotFather'da URL'ni Sozlash

Deploy bo'lgandan keyin:

1. Telegram'da **@BotFather** ga kiring
2. `/newapp` buyrug'ini yuboring
3. Bot'ingizni tanlang
4. **App URL** ga Vercel URL'ni kiriting:
   ```
   https://localmarket-telegram-mini-app.vercel.app
   ```
   *(Yoki Vercel bergan URL'ni)*
5. Save qiling

---

## ✅ Test Qilish

1. Telegram'da bot'ingizga kiring
2. Menu Button'ni bosing
3. Mini App ochilishi kerak! 🎉

---

## 🎯 Afzalliklari

✅ **Doimiy URL** - o'zgarmaydi  
✅ **HTTPS** - Telegram talab qiladi  
✅ **Auto-deploy** - GitHub'ga push qilsangiz, avtomatik deploy  
✅ **Tez va bepul** - Vercel free tier kifoya qiladi  
✅ **Ngrok kerak emas** - boshqa dasturlar kerak emas

---

## 📝 Keyingi Deploy'lar

Har safar GitHub'ga push qilsangiz, Vercel avtomatik deploy qiladi!

```powershell
git add .
git commit -m "Your commit message"
git push
```

---

## 🆘 Muammo Bo'lsa?

Agar muammo bo'lsa, yozing - yechamiz!

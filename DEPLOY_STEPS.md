# 🚀 Production'ga Deploy - Qadamlar

Ngrok bilan muammo bo'lsa, **Vercel'ga deploy qilish** eng oson va tez usul!

---

## ⚡ Variant 1: Vercel (Tavsiya etiladi - 5 daqiqa)

### Qadam 1: GitHub'ga Push Qilish

#### 1.1. Git Init (agar qilinmagan bo'lsa)
```powershell
git init
```

#### 1.2. Barcha fayllarni qo'shish
```powershell
git add .
```

#### 1.3. Commit
```powershell
git commit -m "Initial commit - LocalMarket Telegram Mini App"
```

#### 1.4. GitHub'da yangi repo yarating
1. https://github.com ga kiring
2. "New repository" tugmasini bosing
3. Repo nomi: `localmarket-telegram-mini-app`
4. **Private** yoki **Public** tanlang
5. "Create repository" tugmasini bosing

#### 1.5. GitHub'ga Push
```powershell
git remote add origin https://github.com/YOUR_USERNAME/localmarket-telegram-mini-app.git
git branch -M main
git push -u origin main
```

*(YOUR_USERNAME o'rniga GitHub username'ingizni yozing)*

---

### Qadam 2: Vercel'ga Deploy

#### 2.1. Vercel'ga Kirish
1. https://vercel.com ga kiring
2. **"Sign Up"** tugmasini bosing
3. **GitHub** orqali login qiling (eng oson)

#### 2.2. Project Import
1. **"Add New Project"** tugmasini bosing
2. GitHub repo'ni tanlang: `localmarket-telegram-mini-app`
3. **"Import"** tugmasini bosing

#### 2.3. Environment Variables Qo'shish
**"Environment Variables"** bo'limiga kirib, quyidagilarni qo'shing:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://hqshycfuvkrspqoeneqq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_7fTSIgf0uEX-_chKArE6Fw_BqyZKcpu` |

**Environment** uchun: **Production, Preview, Development** (hamma uchun)

#### 2.4. Deploy!
1. **"Deploy"** tugmasini bosing
2. 2-3 daqiqa kutib turing
3. Deploy bo'lgach, **URL olasiz**!

**Masalan:** `https://localmarket-telegram-mini-app.vercel.app`

---

### Qadam 3: BotFather'da URL'ni Sozlash

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

## 🎯 Nima Yaxshiroq?

✅ **Doimiy URL** - o'zgarmaydi
✅ **HTTPS** - Telegram talab qiladi  
✅ **Tez deploy** - 2-3 daqiqa
✅ **Auto-deploy** - GitHub'ga push qilsangiz, avtomatik deploy
✅ **Ngrok kerak emas** - boshqa dasturlar kerak emas
✅ **Bepul** - Vercel free tier kifoya qiladi

---

## 📦 Variant 2: Netlify (Alternativ)

Agar Vercel ishlamasa:

1. https://netlify.com ga kiring
2. GitHub orqali login qiling
3. **"Add new site"** → **"Import an existing project"**
4. GitHub repo'ni tanlang
5. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Environment variables** qo'shing (Vercel kabi)
7. **Deploy site**!

---

## 🆘 Muammo Bo'lsa?

Agar muammo bo'lsa, yozing - yechamiz!

# 🚀 Production'ga Deploy - Tezkor Qo'llanma

Ngrok bilan muammo bo'lsa, production'ga deploy qilish **ancha oson va ishonchli**!

## ⚡ Eng Tezkor Usul: Vercel (5 daqiqa)

### 1. GitHub'ga Push Qilish

```powershell
# Git init (agar qilinmagan bo'lsa)
git init

# Barcha fayllarni qo'shish
git add .

# Commit
git commit -m "Initial commit - LocalMarket Telegram Mini App"

# GitHub'da yangi repo yarating, keyin:
git remote add origin https://github.com/YOUR_USERNAME/localmarket-telegram-mini-app.git
git branch -M main
git push -u origin main
```

### 2. Vercel'ga Deploy

1. **Vercel'ga kiring**: https://vercel.com
2. **Sign up** qiling (GitHub orqali oson)
3. **"Add New Project"** tugmasini bosing
4. GitHub repo'ni tanlang
5. **Environment Variables** qo'shing:
   - `VITE_SUPABASE_URL` = `https://hqshycfuvkrspqoeneqq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_7fTSIgf0uEX-_chKArE6Fw_BqyZKcpu`
6. **Deploy** tugmasini bosing!

### 3. BotFather'da URL'ni Yangilash

Deploy bo'lgandan keyin Vercel sizga URL beradi:
```
https://localmarket-telegram-mini-app.vercel.app
```

Bu URL'ni BotFather'da Mini App URL sifatida qo'shing:
- @BotFather ga kiring
- `/newapp`
- Bot'ingizni tanlang
- App URL ga Vercel URL'ni kiriting

---

## 🎯 Nima Yaxshiroq?

✅ **Production URL** - doimiy, o'zgarmaydi
✅ **HTTPS** - Telegram talab qiladi
✅ **Tez deploy** - 2-3 daqiqa
✅ **Auto-deploy** - GitHub'ga push qilsangiz, avtomatik deploy
✅ **Ngrok kerak emas** - boshqa dasturlar kerak emas

---

## 📦 Alternativ: Netlify

Agar Vercel ishlamasa, Netlify ham ishlatishingiz mumkin:

1. https://netlify.com ga kiring
2. GitHub repo'ni import qiling
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Environment variables qo'shing
6. Deploy!

---

## 🆘 Muammo?

Agar muammo bo'lsa, yozing - yechamiz!

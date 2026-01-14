# 🔑 Gemini API Key Muammosini Hal Qilish

## ❌ Muammo: API Key Leaked

Gemini API key leaked deb topilgan va 403 qaytaryapti:
```
"code": 403,
"message": "Your API key was reported as leaked. Please use another API key.",
"status": "PERMISSION_DENIED"
```

---

## ✅ Hal Qilish: Yangi API Key Olish

### 1. Google AI Studio'ga Kiring

1. **https://aistudio.google.com/apikey** ga kiring
2. Google account bilan login qiling

### 2. Yangi API Key Yaratish

1. **"Create API Key"** tugmasini bosing
2. Google Cloud Project tanlang (yoki yangi yarating)
3. **"Create API Key in new project"** yoki mavjud project'ni tanlang
4. API key yaratiladi va ko'rsatiladi

### 3. API Key'ni Nusxalash

⚠️ **MUHIM:** API key'ni darhol nusxalang - keyin ko'rsatilmaydi!

---

## 🔐 Vercel'ga Yangi API Key Qo'shish

### 1. Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. Project'ni tanlang: `localmarket-telegram-mini-app`
3. **Settings** > **Environment Variables** ga kiring

### 2. Eski API Key'ni O'chirish

1. `VITE_GEMINI_API_KEY` yoki `GEMINI_API_KEY` ni toping
2. **...** (uch nuqta) tugmasini bosing
3. **Delete** ni tanlang

### 3. Yangi API Key Qo'shish

```
Name: VITE_GEMINI_API_KEY
Value: [YANGI_API_KEY] (Google AI Studio'dan olingan)
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Yoki alternativ nom:**

```
Name: GEMINI_API_KEY
Value: [YANGI_API_KEY]
Environment: ✅ Production, ✅ Preview, ✅ Development
```

⚠️ **Tavsiya:** Ikkala nomni ham qo'shing (VITE_GEMINI_API_KEY va GEMINI_API_KEY)

---

## ⚠️ MUHIM: Qayta Deploy Qiling!

Barcha o'zgarishlardan keyin:

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

Agar hali ham 403 ko'rsatilsa:
- Yangi API key to'g'ri qo'shilganligini tekshiring
- Qayta deploy qiling
- 2-3 daqiqa kutib turing

---

## 🔒 Xavfsizlik Tavsiyalari

### API Key'ni Himoya Qilish

1. **GitHub'ga push qilmaslik:**
   - `.env` faylini `.gitignore` ga qo'shing
   - API key'ni kod ichida hardcode qilmaslik

2. **Vercel Environment Variables:**
   - Faqat Vercel Dashboard'da saqlash
   - Production, Preview, Development uchun alohida qo'yish mumkin

3. **API Key Rotation:**
   - Muntazam ravishda yangilash
   - Leaked bo'lsa, darhol o'zgartirish

---

## ✅ Muvaffaqiyatli Bo'lganda

Agar hammasi to'g'ri bo'lsa, logs'da ko'rinadi:

```
[info] Handling regular message for AI conversation
[info] User context retrieved successfully
[info] Gemini AI response received
[info] Returning 200 OK
```

Va bot AI javob beradi!

---

## 🆘 Hali ham Muammo?

Agar hali ham muammo bo'lsa:

1. Google AI Studio'da API key faol ekanligini tekshiring
2. API key'ni to'g'ri nusxalashganligini tekshiring (bo'sh joylar yo'q)
3. Vercel'da environment variable to'g'ri qo'shilganligini tekshiring
4. Qayta deploy qiling
5. 5-10 daqiqa kutib turing (Vercel cache bo'lishi mumkin)

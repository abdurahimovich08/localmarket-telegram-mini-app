# Keyingi Qadamlar - Next Steps

## ✅ Bajarilgan ishlar (Completed)

- ✅ `.env` fayli yaratildi va barcha credentials qo'shildi
- ✅ Frontend dependencies o'rnatildi
- ✅ Bot dependencies o'rnatildi

## 📋 Keyingi qadamlarning ro'yxati

### 1️⃣ Supabase Database Schema'ni ishga tushirish

**Qadamlar:**
1. https://supabase.com ga kiring
2. Dashboard'da SQL Editor'ni oching (chap sidebar)
3. `database/schema.sql` faylini oching va barcha kodni ko'chiring
4. SQL Editor'ga yopishtiring va **Run** tugmasini bosing
5. "Success" xabari ko'rsatilishi kerak

**Tekshirish:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
Quyidagi jadvallar ko'rinishi kerak:
- users
- listings
- favorites
- reviews
- transactions
- reports

---

### 2️⃣ Supabase Storage Bucket yaratish

**Qadamlar:**
1. Supabase Dashboard'da **Storage** bo'limiga o'ting
2. **Create bucket** tugmasini bosing
3. Bucket nomi: `listings`
4. **Public bucket** toggle'ni yoqing ✅
5. **Create bucket** tugmasini bosing

**Policies sozlash:**
1. Bucket yaratilgandan keyin **Policies** tabiga o'ting
2. **New Policy** → **For full customization**
3. **Policy name**: `Allow public uploads`
4. **Allowed operation**: `INSERT`
5. **Policy definition**: `true` (faqat `true` yozing)
6. **Save policy**
7. Xuddi shunday `SELECT` operatsiyasi uchun ham policy yarating

---

### 3️⃣ Development Server'ni ishga tushirish

**Terminal'da:**
```powershell
npm run dev
```

Server `http://localhost:5173` (yoki boshqa port) da ishga tushadi.

**Tekshirish:**
- Browser'da `http://localhost:5173` ni oching
- Xatolar bo'lmasligi kerak

---

### 4️⃣ Telegram Bot'ni test qilish

**Terminal'da (yangi terminal ochib):**
```powershell
cd bot
npm start
```

**Tekshirish:**
- Bot ishga tushgan xabari ko'rsatilishi kerak
- Telegram'da bot'ingizga `/start` yuborib test qiling

---

### 5️⃣ Telegram Mini App'ni test qilish (Local)

Telegram Mini App HTTPS talab qiladi, shuning uchun local testing uchun ngrok kerak:

**Qadamlar:**
1. **ngrok o'rnatish**: https://ngrok.com/download
2. **ngrok'ni ishga tushirish:**
   ```powershell
   ngrok http 5173
   ```
3. ngrok'dan berilgan HTTPS URL'ni oling (masalan: `https://abc123.ngrok.io`)
4. **@BotFather** ga borg:
   - `/newapp` buyrug'ini yubor
   - Bot'ingizni tanlang
   - **App URL** ga ngrok URL'ni kiriting
5. Telegram'da bot'ingizga kiring va Menu Button'ni bosing
6. Mini App ochilishi kerak!

---

### 6️⃣ Production'ga deploy qilish (Ixtiyoriy)

**Frontend (Vercel):**
1. GitHub'ga push qiling
2. https://vercel.com ga kiring
3. GitHub repo'ni import qiling
4. Environment variables'ni `.env` dan ko'chiring
5. Deploy!

**Bot (Railway/Render):**
1. `bot/` papkasini deploy qiling
2. Environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `MINI_APP_URL` (deployed frontend URL)

---

## 🔧 Muammolarni hal qilish

### Database xatoliklari
- SQL kod to'liq ko'chirilganligini tekshiring
- Supabase connection to'g'ri ekanligini tekshiring

### Storage xatoliklari
- Bucket public ekanligini tekshiring
- Policies to'g'ri sozlanganligini tekshiring

### Bot ishlamayapti
- `.env` faylda `TELEGRAM_BOT_TOKEN` borligini tekshiring
- Bot token to'g'ri ekanligini tekshiring

### Mini App ochilmayapti
- URL HTTPS ekanligini tekshiring
- BotFather'da Menu Button to'g'ri sozlanganligini tekshiring

---

## 📞 Yordam

Agar muammo bo'lsa:
- `DATABASE_SETUP.md` - Database setup uchun
- `BOT_SETUP.md` - Bot setup uchun
- `SETUP.md` - Umumiy setup uchun
- `QUICK_START.md` - Tezkor boshlanish uchun

---

**O'qish kerak bo'lgan fayllar:**
- `README.md` - Umumiy ma'lumot
- `QUICK_START.md` - Tezkor boshlanish

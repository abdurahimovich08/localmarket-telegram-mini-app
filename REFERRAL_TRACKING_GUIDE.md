# 🔗 Referral Tracking System - To'liq Qo'llanma

## ✅ Muammo Hal Qilindi

**Muammo:** Bot va WebApp orasida referral tracking yo'q edi. User qaysi shop orqali kelganini bilish mumkin emas edi.

**Yechim:** To'liq referral tracking system yaratildi.

---

## 📋 Qilingan Ishlar

### 1. Database Migration ✅

**Fayl:** `database/referral_tracking_migration.sql`

**Qo'shilgan:**
- `stores.referral_code` - Har bir store uchun unique referral code
- `user_referrals` jadvali - User qaysi shop orqali kelganini saqlaydi
- `generate_referral_code()` function - Referral code generate qilish
- `track_referral()` function - Referral tracking
- `get_user_store()` function - User'ning shop'ini olish
- Trigger - Store yaratilganda avtomatik referral_code generate qilinadi

**QADAMLAR:**
1. Supabase Dashboard > SQL Editor ga kiring
2. `database/referral_tracking_migration.sql` faylini oching
3. Barcha kodni copy qiling va RUN tugmasini bosing

### 2. Backend API ✅

**Fayl:** `api/track-referral.ts`

**Endpoint:** `POST /api/track-referral`

**Body:**
```json
{
  "user_telegram_id": 123456789,
  "referral_code": "a9xK2"
}
```

**Response:**
```json
{
  "success": true,
  "store_id": "uuid",
  "store_name": "Store Name"
}
```

### 3. Bot Integration ✅

**Fayl:** `api/telegram-bot.ts`

**Qo'shilgan:**
- Referral code'ni handle qilish (`/start <REFERRAL_CODE>`)
- Backend'ga referral tracking yuborish
- Store ID'ni olish va WebApp'ga yuborish

**Formatlar:**
- **Yangi:** `/start a9xK2` (referral code to'g'ridan-to'g'ri)
- **Eski:** `/start store_<UUID>` (backward compatibility)

### 4. WebApp Integration ✅

**Fayllar:**
- `src/lib/supabase.ts` - `getUserReferralStore()` function qo'shildi
- `src/App.tsx` - User referral store'ni aniqlash
- `src/components/PersonalLinks.tsx` - Referral code ishlatish
- `src/types/index.ts` - Store type'ga `referral_code` qo'shildi

---

## 🔄 To'liq Flow

### 1. Store Yaratilganda

```
1. User WebApp'da store yaratadi
2. Database trigger avtomatik referral_code generate qiladi
3. Store saqlanadi referral_code bilan
```

### 2. Referral Link Yaratilganda

```
1. Store owner profilida "Mijozlarga ulashish" bo'limida link ko'radi
2. Link format: https://t.me/BOT?start=<REFERRAL_CODE>
3. User linkni nusxalaydi va tarqatadi
```

### 3. Mijoz Linkni Bosganda

```
1. Telegram bot'ga /start <REFERRAL_CODE> keladi
2. Bot referral code'ni backend'ga yuboradi
3. Backend user'ni shop'ga bog'laydi (user_referrals jadvaliga yozadi)
4. Bot WebApp'ni ochadi store mode'da
```

### 4. WebApp Ochilganda

```
1. WebApp user'ning shop'ini database'dan o'qiy oladi
2. Agar URL'da ctx=store:<ID> bo'lsa, store mode'ga o'tadi
3. Agar yo'q bo'lsa, database'dan user'ning referral store'ini o'qiy oladi
```

---

## 📝 Database Schema

### Stores Table
```sql
ALTER TABLE stores 
ADD COLUMN referral_code TEXT UNIQUE;
```

### User Referrals Table
```sql
CREATE TABLE user_referrals (
  referral_id UUID PRIMARY KEY,
  user_telegram_id BIGINT REFERENCES users(telegram_user_id),
  store_id UUID REFERENCES stores(store_id),
  referral_code TEXT NOT NULL,
  referred_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, store_id)
);
```

---

## 🧪 Test Qilish

### 1. Database Migration

```sql
-- Supabase SQL Editor'da run qiling
-- database/referral_tracking_migration.sql
```

### 2. Store Yaratish

1. WebApp'da store yarating
2. Database'da store'ning `referral_code` maydoni to'ldirilganligini tekshiring

### 3. Referral Link

1. Profil > "Mijozlarga ulashish" bo'limiga kiring
2. Store linkini ko'ring (referral_code ishlatilgan bo'lishi kerak)

### 4. Referral Tracking

1. Bot'ga `/start <REFERRAL_CODE>` yuboring
2. Backend'ga request kelganligini tekshiring
3. `user_referrals` jadvalida yozuv paydo bo'lganligini tekshiring

### 5. WebApp

1. Referral link orqali WebApp'ni oching
2. Store mode'ga o'tganligini tekshiring
3. Database'dan user'ning shop'ini o'qiy olganligini tekshiring

---

## 🔍 Debug

### Referral Code Topilmadi?

```sql
-- Store'ning referral_code'ini tekshiring
SELECT store_id, name, referral_code FROM stores WHERE store_id = '...';
```

### User Referral Topilmadi?

```sql
-- User'ning referral'ini tekshiring
SELECT * FROM user_referrals WHERE user_telegram_id = 123456789;
```

### Backend API Xatolik?

1. Vercel logs'ni ko'ring
2. `api/track-referral.ts` function deploy bo'lganligini tekshiring
3. Environment variables to'g'ri ekanligini tekshiring

---

## ⚠️ Muhim Eslatmalar

1. **Backward Compatibility:** Eski `store_<UUID>` format hali ham ishlaydi
2. **Unique Referral Codes:** Har bir store uchun unique referral code generate qilinadi
3. **One Store Per User:** User bir necha marta bir xil shop'ga kelishi mumkin, lekin faqat birinchi marta qayd qilinadi
4. **Database Trigger:** Store yaratilganda avtomatik referral_code generate qilinadi

---

## ✅ Tugadi!

Endi referral tracking system to'liq ishlaydi:
- ✅ Store yaratilganda referral_code generate qilinadi
- ✅ Bot referral code'ni handle qiladi va backend'ga yozadi
- ✅ WebApp user'ning shop'ini database'dan o'qiy oladi
- ✅ Personal links referral code ishlatadi

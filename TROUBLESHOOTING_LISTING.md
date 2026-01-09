# 🔧 Listing Yaratish Muammolarini Hal Qilish

## ❌ Muammo: Listing yaratilmayapti

### 1️⃣ Browser Console'ni Tekshirish

Browser'da **Developer Tools** ochib (F12 yoki Right Click → Inspect), **Console** tab'ini tekshiring.

Xatoliklar quyida ko'rinadi:
- Photo upload xatoliklari
- Database connection xatoliklari
- Authentication xatoliklari

---

## 2️⃣ Muammolarni Tekshirish

### A. User Authentication Muammosi

**Tekshirish:**
1. Browser console'da `user` mavjudligini tekshiring
2. User database'da mavjudligini tekshiring

**Supabase'da tekshirish:**
```sql
SELECT * FROM users WHERE telegram_user_id = YOUR_TELEGRAM_ID;
```

**Yechim:**
- User avtomatik yaratilishi kerak (App.tsx da)
- Agar yaratilmagan bo'lsa, app'ni qayta yuklang

---

### B. Supabase RLS (Row Level Security) Muammosi

Agar Supabase'da RLS yoqilgan bo'lsa, policy'lar kerak.

**RLS'ni tekshirish:**
1. Supabase Dashboard → Authentication → Policies
2. `listings` jadvali uchun policy'lar mavjudligini tekshiring

**Policy qo'shish (agar kerak bo'lsa):**

```sql
-- Allow authenticated users to insert listings
CREATE POLICY "Users can insert listings"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to read all active listings
CREATE POLICY "Anyone can read active listings"
ON listings
FOR SELECT
TO authenticated
USING (status = 'active');
```

**Yoki RLS'ni o'chirish (development uchun):**
- Supabase Dashboard → Table Editor → `listings` → Settings → Disable RLS

---

### C. Storage Bucket Muammosi

**Tekshirish:**
1. Supabase Dashboard → Storage → `listings` bucket mavjudligini tekshiring
2. Bucket **public** ekanligini tekshiring
3. Policies mavjudligini tekshiring

**Policy qo'shish:**
1. Storage → `listings` bucket → Policies
2. **New Policy** → **For full customization**
3. **Policy name**: `Allow public uploads`
4. **Allowed operation**: `INSERT`
5. **Policy definition**: `true`
6. **Save**

Xuddi shunday `SELECT` uchun ham policy qo'shing.

---

### D. Database Connection Muammosi

**Tekshirish:**
1. Browser console'da Supabase connection xatoliklarini tekshiring
2. `.env` faylda credentials to'g'ri ekanligini tekshiring
3. Vercel'da environment variables to'g'ri sozlanganligini tekshiring

**Vercel'da tekshirish:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Quyidagilar mavjudligini tekshiring:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 3️⃣ Qo'shimcha Tekshirishlar

### Browser Console Logs

Listing yaratishga harakat qilganda, console'da quyidagilar ko'rinishi kerak:

```
Starting photo upload...
Uploading X photos...
Photos uploaded: [...]
Creating listing...
Listing created successfully: ...
```

Agar xatolik bo'lsa, aniq xatolik xabari ko'rinadi.

---

## 4️⃣ Qadamlab Tekshirish

1. **User mavjudligi:**
   - Browser console'da: `window.localStorage` ni tekshiring
   - Yoki Profile page'ga o'tib, user ma'lumotlarini ko'ring

2. **Photo upload:**
   - Photo yuklashga harakat qiling
   - Console'da xatoliklar mavjudligini tekshiring

3. **Database:**
   - Supabase Dashboard → Table Editor → `listings`
   - Listing yaratilganligini tekshiring

---

## 🆘 Yordam

Agar muammo davom etsa:
1. Browser console'da aniq xatolik xabarlarini yuboring
2. Supabase Dashboard'dan screenshot'lar yuboring
3. Network tab'da failed request'larni tekshiring

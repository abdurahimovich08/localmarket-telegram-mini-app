# 🔍 Storage va Database Tekshirish

## 1️⃣ Supabase Storage Bucket Tekshirish

### A. Bucket Mavjudligini Tekshirish

1. Supabase Dashboard'ga kiring: https://supabase.com/dashboard
2. Project'ingizni tanlang
3. **Storage** bo'limiga o'ting (chap sidebar)
4. `listings` bucket mavjudligini tekshiring

### B. Bucket Public Ekanligini Tekshirish

1. `listings` bucket'ni oching
2. **Settings** tab'iga o'ting
3. **Public bucket** toggle **ON** bo'lishi kerak ✅

### C. Storage Policies Tekshirish

1. `listings` bucket'da **Policies** tab'iga o'ting
2. Quyidagi policy'lar mavjud bo'lishi kerak:

#### INSERT Policy (Upload uchun)
```
Policy name: Allow public uploads
Allowed operation: INSERT
Policy definition: true
Target roles: authenticated (yoki anon)
```

#### SELECT Policy (O'qish uchun)
```
Policy name: Allow public reads
Allowed operation: SELECT
Policy definition: true
Target roles: authenticated (yoki anon)
```

**Agar policy'lar yo'q bo'lsa, qo'shing:**

```sql
-- INSERT policy
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- SELECT policy
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'listings');
```

---

## 2️⃣ Database RLS (Row Level Security) Tekshirish

### A. RLS Status'ni Tekshirish

1. Supabase Dashboard → **Table Editor**
2. `listings` jadvalini oching
3. **Settings** icon'ni bosing
4. **Enable RLS** status'ni tekshiring

### B. RLS Policies Tekshirish

1. Supabase Dashboard → **Authentication** → **Policies**
2. `listings` jadvali uchun policy'lar mavjudligini tekshiring

**Kerakli Policy'lar:**

#### INSERT Policy (Listing yaratish uchun)
```sql
CREATE POLICY "Users can insert listings"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### SELECT Policy (Listing'larni o'qish uchun)
```sql
CREATE POLICY "Anyone can read active listings"
ON listings
FOR SELECT
TO authenticated
USING (status = 'active');
```

**Yoki RLS'ni o'chirish (development uchun):**

1. Table Editor → `listings` → Settings
2. **Disable RLS** ni bosing

---

## 3️⃣ Users Jadvali Tekshirish

### A. User Mavjudligini Tekshirish

```sql
SELECT * FROM users;
```

User mavjudligini tekshiring.

### B. Users Jadvali RLS

Agar `users` jadvali uchun RLS yoqilgan bo'lsa:

```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = telegram_user_id::text);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = telegram_user_id::text);
```

---

## 4️⃣ Tezkor Yechim: RLS'ni O'chirish (Development)

Agar muammo davom etsa, development uchun RLS'ni o'chirishingiz mumkin:

### Listings Jadvali:
```sql
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
```

### Users Jadvali:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**⚠️ Eslatma:** Bu faqat development uchun! Production'da RLS yoqilishi kerak va to'g'ri policy'lar sozlanishi kerak.

---

## 5️⃣ Storage Bucket Policies Qo'shish (SQL Editor)

Supabase SQL Editor'da quyidagilarni run qiling:

```sql
-- Storage INSERT policy
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- Storage SELECT policy  
CREATE POLICY IF NOT EXISTS "Allow public reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'listings');
```

---

## 6️⃣ Database Policies Qo'shish (SQL Editor)

```sql
-- Listings INSERT policy
CREATE POLICY IF NOT EXISTS "Users can insert listings"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Listings SELECT policy
CREATE POLICY IF NOT EXISTS "Anyone can read active listings"
ON listings
FOR SELECT
TO authenticated
USING (status = 'active');

-- Users INSERT policy
CREATE POLICY IF NOT EXISTS "Users can insert own data"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users SELECT policy
CREATE POLICY IF NOT EXISTS "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (true);
```

---

## 7️⃣ Tekshirish

### Browser Console'da:

Listing yaratishga harakat qilganda, console'da quyidagilarni tekshiring:

1. **Photo upload xatoliklari:**
   ```
   Failed to upload image: ...
   ```

2. **Database xatoliklari:**
   ```
   Error creating listing: ...
   new row violates row-level security policy
   ```

3. **Permission xatoliklari:**
   ```
   permission denied for table listings
   ```

---

## 🆘 Muammo Bo'lsa

Agar yukoridagi qadamlarni bajargach ham muammo bo'lsa:
1. Browser console'dagi aniq xatolik xabarlarini yuboring
2. Supabase Dashboard'dan screenshot yuboring
3. SQL Editor'da run qilingan query natijalarini yuboring

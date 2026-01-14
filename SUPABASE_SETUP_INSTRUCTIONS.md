# 📋 Supabase Setup - To'liq Qo'llanma

## 🎯 Maqsad

Supabase database'ni to'liq sozlash va barcha migration'larni ishga tushirish.

---

## 📝 Qadamlar

### 1️⃣ Supabase Dashboard'ga Kiring

1. https://supabase.com ga kiring
2. Project'ingizni tanlang yoki yangi project yarating
3. **SQL Editor** ga kiring

---

### 2️⃣ SQL Fayllarni Ishga Tushirish Tartibi

**MUHIM:** Quyidagi tartibda ishga tushiring!

#### ✅ QADAM 1: Asosiy Schema
**Fayl:** `database/schema_final.sql` yoki `SUPABASE_COMPLETE_SETUP.sql` (birinchi qism)

**Nima qiladi:**
- Barcha asosiy jadvallar (users, listings, stores, services, etc.)
- Functions va triggers
- Indexes

**Vaqt:** ~2-3 daqiqa

---

#### ✅ QADAM 2: Referral Tracking
**Fayl:** `database/referral_tracking_migration.sql`

**Nima qiladi:**
- `user_referrals` jadvali
- `referral_code` maydoni stores jadvaliga
- Referral tracking funksiyalari

**Vaqt:** ~30 soniya

---

#### ✅ QADAM 3: Store Management
**Fayl:** `database/store_management_migration.sql`

**Nima qiladi:**
- `store_categories` jadvali
- Listings jadvaliga yangi maydonlar (store_category_id, old_price, stock_qty, order_index, location)
- Store posts'ga yangi maydonlar (order_index, is_pinned)
- Reorder funksiyalari

**Vaqt:** ~1 daqiqa

---

#### ✅ QADAM 4: Unified Items View
**Fayl:** `database/unified_items_view.sql`

**Nima qiladi:**
- `unified_items` VIEW yaratadi
- `search_unified_items` funksiyasi

**Vaqt:** ~30 soniya

---

#### ✅ QADAM 5: Enhanced RLS Policies
**Fayl:** `database/rls_policies_enhanced.sql`

**Nima qiladi:**
- Barcha jadvallar uchun RLS policies
- Xavfsizlikni kuchaytiradi

**Vaqt:** ~1 daqiqa

---

## 🚀 Tezkor Variant (Bitta Fayl)

Agar hammasini bir vaqtda ishga tushirmoqchi bo'lsangiz:

**Fayl:** `SUPABASE_COMPLETE_SETUP.sql`

Bu fayl barcha migration'larni o'z ichiga oladi va to'g'ri tartibda.

---

## 📋 Alohida Fayllar (Tavsiya Etiladi)

Agar muammo bo'lsa, qaysi qismda ekanligini aniqlash oson bo'ladi:

1. `database/schema_final.sql` - Asosiy schema
2. `database/referral_tracking_migration.sql` - Referral system
3. `database/store_management_migration.sql` - Store management
4. `database/unified_items_view.sql` - Unified search
5. `database/rls_policies_enhanced.sql` - Security

---

## ✅ Tekshirish

Har bir migration'dan keyin tekshiring:

```sql
-- Jadval mavjudligini tekshirish
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- VIEW mavjudligini tekshirish
SELECT viewname FROM pg_views 
WHERE schemaname = 'public';

-- Function mavjudligini tekshirish
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

---

## 🗄️ Storage Bucket Sozlash

### 1. Storage Bucket Yaratish

1. Supabase Dashboard > **Storage**
2. **New bucket** tugmasini bosing
3. Quyidagi bucket'larni yarating:

#### `listings` Bucket
- **Name:** `listings`
- **Public:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/*`

#### `stores` Bucket
- **Name:** `stores`
- **Public:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/*`

#### `services` Bucket
- **Name:** `services`
- **Public:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/*`

### 2. Storage Policies

Har bir bucket uchun:

```sql
-- Listings bucket policies
CREATE POLICY "Public can view listings images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

CREATE POLICY "Authenticated users can upload to listings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own listings images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own listings images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listings' AND auth.role() = 'authenticated');
```

---

## ⚠️ Xatoliklar

### Xatolik: "relation already exists"
**Sabab:** Jadval allaqachon mavjud
**Yechim:** `CREATE TABLE IF NOT EXISTS` ishlatilgan, xatolik bo'lmaydi

### Xatolik: "column already exists"
**Sabab:** Ustun allaqachon mavjud
**Yechim:** `DO $$ BEGIN IF NOT EXISTS ... END $$` bloklari ishlatilgan

### Xatolik: "policy already exists"
**Sabab:** Policy allaqachon mavjud
**Yechim:** `DROP POLICY IF EXISTS` qo'shilgan

---

## ✅ Muvaffaqiyatli Bo'lganda

Quyidagi jadvallar yaratilgan bo'lishi kerak:

- ✅ users
- ✅ listings
- ✅ stores
- ✅ services
- ✅ store_categories
- ✅ store_posts
- ✅ user_referrals
- ✅ favorites
- ✅ cart_items
- ✅ reviews
- ✅ subcategories
- ✅ (va boshqalar...)

Quyidagi VIEW'lar yaratilgan bo'lishi kerak:

- ✅ unified_items

Quyidagi funksiyalar yaratilgan bo'lishi kerak:

- ✅ track_referral
- ✅ get_user_store
- ✅ generate_referral_code
- ✅ get_max_category_order
- ✅ reorder_store_categories
- ✅ search_unified_items
- ✅ (va boshqalar...)

---

## 🧪 Test Qilish

### 1. Test Query

```sql
-- Unified items VIEW test
SELECT * FROM unified_items LIMIT 5;

-- Search function test
SELECT * FROM search_unified_items('telefon', NULL, 'electronics', NULL, NULL, NULL, NULL, 10);

-- Referral function test
SELECT * FROM track_referral(123456789, 'testcode');
```

### 2. Storage Test

```sql
-- Storage bucket'lar mavjudligini tekshirish
SELECT * FROM storage.buckets;
```

---

## 📞 Yordam

Agar muammo bo'lsa:
1. Supabase Logs'ni tekshiring
2. SQL Editor'da xatolik xabarlarini ko'ring
3. `REFACTORING_IMPLEMENTATION_GUIDE.md` ga qarang

---

## ✅ Tugadi!

Barcha migration'lar muvaffaqiyatli ishga tushirilgandan keyin, app to'liq ishlaydi!

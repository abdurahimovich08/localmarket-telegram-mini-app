# 📋 SUPABASE YANGILASH QO'LLANMASI

## 🎯 MAQSAD
Ushbu qo'llanma Supabase'da qaysi SQL fayllarni ishga tushirish kerakligini va qanday tartibda bajarishni ko'rsatadi.

---

## ✅ QADAM 1: HOLATNI TEKSHIRISH

### Supabase'da qaysi jadvallar mavjud?

**Supabase SQL Editor'da quyidagi query'ni bajarib ko'ring:**

```sql
-- Barcha jadvallarni ko'rish
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Kutilayotgan jadvallar (agar hammasi mavjud bo'lsa):**
- users
- listings
- favorites
- reviews
- transactions
- reports
- user_searches
- user_listing_interactions
- user_category_preferences
- subcategories
- cart_items
- user_last_seen

**Agar barcha jadvallar mavjud bo'lsa:** Qadam 3 ga o'ting  
**Agar ba'zi jadvallar yo'q bo'lsa:** Qadam 2 ga o'ting

---

## 🔧 QADAM 2: ASOSIY MIGRATION (Agar jadvallar yo'q bo'lsa)

### NIMA QILISH KERAK:

Agar asosiy jadvallar (users, listings, favorites) yo'q bo'lsa, avval ularni yaratish kerak.

**✅ ISHGA TUSHIRISH KERAK:**

**File:** `database/MIGRATION_COMPLETE.sql`  
**Qayerda:** Supabase Dashboard → SQL Editor  
**Qanday:**
1. `database/MIGRATION_COMPLETE.sql` faylini oching
2. Barcha kodni copy qiling (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor'ga paste qiling (Ctrl+V)
4. **RUN** tugmasini bosing

**Bu fayl nima qiladi:**
- ✅ Barcha asosiy jadvallarni yaratadi
- ✅ Indexlarni yaratadi
- ✅ Funksiyalarni yaratadi
- ✅ Triggerlarni yaratadi
- ✅ RLS policy'larni yaratadi
- ✅ Extensions yaratadi (uuid-ossp, pg_trgm, unaccent)

**Muhim:** Agar qaysidir jadval allaqachon mavjud bo'lsa, xatolik bermaydi (`IF NOT EXISTS` ishlatilgan)

---

## 🚀 QADAM 3: YANGILANISH (Yangi features)

### NIMA QILISH KERAK:

Agar asosiy jadvallar mavjud bo'lsa, faqat yangi feature'larni qo'shish kerak.

**✅ ISHGA TUSHIRISH KERAK:**

**File:** `database/PRODUCTION_IMPLEMENTATION.sql`  
**Qayerda:** Supabase Dashboard → SQL Editor  
**Qanday:**
1. `database/PRODUCTION_IMPLEMENTATION.sql` faylini oching
2. Barcha kodni copy qiling (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor'ga paste qiling (Ctrl+V)
4. **RUN** tugmasini bosing

**Bu fayl nima qiladi:**
- ✅ `listing_views` jadvalini yaratadi (user activity tracking)
- ✅ `user_preferences` jadvalini yaratadi (auto-computed preferences)
- ✅ `compute_user_preferences()` funksiyasini yaratadi
- ✅ `get_recommendation_feed()` funksiyasini yaratadi (recommendation algorithm)
- ✅ `get_new_user_feed()` funksiyasini yaratadi (fallback for new users)
- ✅ `get_listings_cursor()` funksiyasini yaratadi (cursor-based pagination)
- ✅ Triggerlarni yaratadi (auto-compute preferences)
- ✅ Indexlarni yaratadi (performance optimization)
- ✅ RLS policy'larni yaratadi (security)

---

## 🔄 QADAM 4: MUAMMO BO'LSA (Fix script)

### Agar `user_last_seen` jadvali eski strukturada bo'lsa:

**✅ ISHGA TUSHIRISH KERAK (faqat muammo bo'lsa):**

**File:** `database/FIX_USER_LAST_SEEN.sql`  
**Qachon:** Agar `user_last_seen` jadvalida `last_seen_at` ustuni bo'lsa, lekin `last_seen_listing_id` yo'q bo'lsa

**Tekshirish:**
```sql
-- user_last_seen jadvali strukturasini tekshirish
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_last_seen' 
ORDER BY ordinal_position;
```

**Agar `last_seen_at` mavjud, lekin `last_seen_listing_id` yo'q bo'lsa:**
1. `database/FIX_USER_LAST_SEEN.sql` faylini oching
2. Barcha kodni copy qiling
3. Supabase SQL Editor'da RUN qiling

**Bu fayl nima qiladi:**
- ✅ `last_seen_at` ustunini olib tashlaydi
- ✅ `last_seen_listing_id` ustunini qo'shadi
- ✅ Indexlarni yangilaydi
- ✅ Funksiyani yangilaydi

---

## 📊 QADAM 5: TEKSHIRISH

### Migration'dan keyin quyidagi query'larni bajarib tekshiring:

```sql
-- 1. Barcha jadvallar yaratilganmi?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Kutilayotgan: 15+ jadval

-- 2. Yangi jadvallar yaratilganmi?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('listing_views', 'user_preferences')
ORDER BY table_name;
-- Natija: listing_views, user_preferences bo'lishi kerak

-- 3. Funksiyalar yaratilganmi?
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'compute_user_preferences',
    'get_recommendation_feed',
    'get_new_user_feed',
    'get_listings_cursor',
    'get_listing_recommendation_score'
  )
ORDER BY routine_name;
-- Kutilayotgan: 5 ta funksiya

-- 4. Indexlar yaratilganmi?
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('listing_views', 'user_preferences', 'listings')
ORDER BY tablename, indexname;
-- Natija: ko'p indexlar bo'lishi kerak

-- 5. RLS yoqilganmi?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('listing_views', 'user_preferences')
ORDER BY tablename;
-- Kutilayotgan: rowsecurity = true
```

---

## 🎯 QISQACHA QO'LLANMA (Eng Oddiy Usul)

### Agar hozircha hech narsa qilmagan bo'lsangiz:

**1-qadam:**
```sql
-- Supabase SQL Editor'da:
-- database/MIGRATION_COMPLETE.sql ni RUN qiling
```

**2-qadam:**
```sql
-- Supabase SQL Editor'da:
-- database/PRODUCTION_IMPLEMENTATION.sql ni RUN qiling
```

**3-qadam:**
```sql
-- Tekshirish uchun:
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Kutilayotgan: 15+
```

---

## ⚠️ MUAMMOLAR VA YECHIMLAR

### Muammo 1: "relation already exists"
**Sabab:** Jadval allaqachon mavjud  
**Yechim:** Xatolik bermaydi, `IF NOT EXISTS` ishlatilgan, davom etadi

### Muammo 2: "column already exists"
**Sabab:** Ustun allaqachon mavjud  
**Yechim:** `ADD COLUMN IF NOT EXISTS` ishlatilgan, xatolik bermaydi

### Muammo 3: "function already exists"
**Sabab:** Funksiya allaqachon mavjud  
**Yechim:** `CREATE OR REPLACE FUNCTION` ishlatilgan, yangilanadi

### Muammo 4: "permission denied"
**Sabab:** RLS policy muammosi  
**Yechim:** Service role bilan bajarish yoki RLS'ni vaqtincha disable qilish (faqat test uchun)

---

## 📋 CHECKLIST

### Migration oldin:
- [ ] Supabase'ga kirildi
- [ ] SQL Editor ochildi
- [ ] `MIGRATION_COMPLETE.sql` fayli ochildi
- [ ] `PRODUCTION_IMPLEMENTATION.sql` fayli ochildi

### Migration jarayonida:
- [ ] `MIGRATION_COMPLETE.sql` RUN qilindi
- [ ] Xatolik bo'lmadi (yoki ahamiyatsiz xatolar)
- [ ] `PRODUCTION_IMPLEMENTATION.sql` RUN qilindi
- [ ] Xatolik bo'lmadi

### Migration'dan keyin:
- [ ] Barcha jadvallar yaratilgan
- [ ] Funksiyalar ishlayapti (test qiling)
- [ ] RLS yoqilgan
- [ ] Indexlar yaratilgan

---

## 🔍 TEST QUERY'LAR

### Recommendation feed test qilish:
```sql
-- Test (yangi user - fallback)
SELECT * FROM get_new_user_feed(p_limit := 10);

-- Test (mavjud user - preferences bilan)
SELECT * FROM get_recommendation_feed(
  p_user_id := 123456789,  -- O'z user_id ni qo'ying
  p_limit := 10
);
```

### Cursor pagination test qilish:
```sql
-- Birinchi sahifa
SELECT * FROM get_listings_cursor(p_limit := 10);

-- Keyingi sahifa (oxirgi listing_id va created_at ni ishlatish)
SELECT * FROM get_listings_cursor(
  p_limit := 10,
  p_after_listing_id := 'uuid-here',
  p_after_created_at := '2024-01-01 12:00:00+00'::timestamptz
);
```

### Preferences test qilish:
```sql
-- User preferences ko'rish
SELECT * FROM user_preferences 
WHERE user_telegram_id = 123456789;  -- O'z user_id ni qo'ying

-- Manual recompute (test uchun)
SELECT compute_user_preferences(123456789);
```

---

## ✅ YAKUN

**Agar hammasi to'g'ri bajarilgan bo'lsa:**
- ✅ Barcha jadvallar yaratilgan
- ✅ Funksiyalar ishlayapti
- ✅ RLS yoqilgan
- ✅ Indexlar yaratilgan
- ✅ Test query'lar ishlayapti

**Keyingi qadam:** Application code'ni yangilash:
- `get_recommendation_feed()` dan foydalanish
- `listing_views` ga view tracking qo'shish
- `get_listings_cursor()` dan pagination uchun foydalanish

---

## 📞 YORDAM

Agar muammo bo'lsa:
1. Xato xabarini to'liq copy qiling
2. Qaysi fayl ishlatilganini ko'rsating
3. Qaysi qatorda xato ekanligini ko'rsating

---

**OXIRGI E'LON:** Barcha SQL fayllar `IF NOT EXISTS` va `CREATE OR REPLACE` ishlatadi, shuning uchun bir necha marta RUN qilish xavfsiz!

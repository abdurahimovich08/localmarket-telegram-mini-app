# 📘 Supabase Database Migration Qo'llanmasi

## 🎯 Maqsad
Ushbu qo'llanma LocalMarket Telegram Mini App uchun barcha database migration'larni yangilash va to'g'ri tartibda bajarish usullarini ko'rsatadi.

---

## 📋 Tarkib

1. [Yangi Migration Bajarish](#yangi-migration-bajarish)
2. [Barcha Migration'larni Yangilash](#barcha-migrationlarni-yangilash)
3. [Migration Tartibi](#migration-tartibi)
4. [Muammolarni Hal Qilish](#muammolarni-hal-qilish)
5. [Tekshirish](#tekshirish)

---

## 🚀 Yangi Migration Bajarish

### Variant 1: To'liq Yangilash (Tavsiya etiladi)

Agar hali hech qanday migration bajarmagan bo'lsangiz yoki barcha migration'larni qayta bajarishni istasangiz:

1. **Supabase Dashboard'ga kiring**
   - URL: `https://supabase.com/dashboard`
   - Loyihangizni tanlang

2. **SQL Editor'ga o'ting**
   - Chap menudan `SQL Editor` ni tanlang
   - Yoki `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new` ga kiring

3. **To'liq Migration faylini oching**
   - `database/MIGRATION_COMPLETE.sql` faylini oching
   - Barcha kodini copy qiling (Ctrl+A, Ctrl+C)

4. **SQL Editor'da paste qiling va RUN qiling**
   - SQL Editor'ga paste qiling (Ctrl+V)
   - Pastki o'ng burchakdagi `RUN` tugmasini bosing
   - Yoki `Ctrl+Enter` bosing

5. **Natijani tekshiring**
   - Agar xatolik bo'lmasa, barcha migration'lar muvaffaqiyatli bajarildi!
   - Xatolik bo'lsa, qaysi qator va qanday xato ekanligini ko'rsatadi

### Variant 2: Alohida Migration Fayllarni Bajarish

Agar faqat ma'lum bir migration'ni bajarish kerak bo'lsa:

1. **Migration tartibini ko'ring** (quyida)
2. **Kerakli migration faylini oching** `database/migrations/` papkasidan
3. **Supabase SQL Editor'da bajarish**
   - Har bir migration'ni ketma-ketlikda bajarish kerak

---

## 🔄 Barcha Migration'larni Yangilash

Agar Supabase'dagi SQL kodlar eski qolib ketgan bo'lsa:

### Qadam 1: Hozirgi holatni tekshirish
```sql
-- Supabase SQL Editor'da bajarish
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Qadam 2: To'liq yangilash
1. `database/MIGRATION_COMPLETE.sql` faylini ishga tushiring
2. Bu fayl barcha migration'larni yangi holatga keltiradi

### Qadam 3: Yangilangan holatni tekshirish
```sql
-- Jadvalar soni
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Barcha jadvallar
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 📊 Migration Tartibi

Barcha migration'lar quyidagi tartibda bajarilishi kerak:

### 1. **Asosiy Schema** (`schema.sql`)
   - `users` jadvali
   - `listings` jadvali
   - `favorites`, `reviews`, `transactions`, `reports` jadvallari
   - Asosiy funksiyalar va triggerlar

### 2. **User Tracking** (`add_user_tracking.sql`)
   - `user_searches` jadvali
   - `user_listing_interactions` jadvali
   - `user_category_preferences` jadvali
   - Indexlar va funksiyalar

### 3. **Search Indexes** (`add_search_indexes.sql`)
   - `pg_trgm` va `unaccent` extension'lar
   - Fuzzy search indexlar
   - Full-text search indexlar

### 4. **Subcategories** (`add_subcategories.sql`)
   - `subcategories` jadvali
   - `listings` jadvaliga `subcategory_id` ustuni
   - Sample subcategory data

### 5. **Cart System** (`add_cart_system.sql`)
   - `cart_items` jadvali
   - Cart funksiyalari
   - RLS policies

### 6. **User Last Seen** (`add_user_last_seen.sql`)
   - `user_last_seen` jadvali
   - `update_user_last_seen()` funksiyasi
   - RLS policies

---

## 🔍 Migration Fayllari Tafsiloti

### `MIGRATION_COMPLETE.sql` (Tavsiya etiladi)
- ✅ **Barcha migration'larni bitta faylda to'playdi**
- ✅ **To'g'ri tartibda bajariladi**
- ✅ **IF NOT EXISTS** bilan xavfsiz
- ✅ **Bir necha marta ishga tushirish mumkin**

### Alohida Migration Fayllar
- `add_user_tracking.sql` - User tracking
- `add_search_indexes.sql` - Search optimization
- `add_subcategories.sql` - Subcategories system
- `add_cart_system.sql` - Shopping cart
- `add_user_last_seen.sql` - Last seen tracking

---

## ❌ Muammolarni Hal Qilish

### Xato 1: "relation already exists"
**Sabab:** Jadval allaqachon mavjud  
**Yechim:** `MIGRATION_COMPLETE.sql` ishlatish kerak (IF NOT EXISTS bilan)

### Xato 2: "cannot cast type uuid to bigint"
**Sabab:** RLS policy'da UUID ni BIGINT ga cast qilish  
**Yechim:** Migration fayli yangilangan, qayta bajarish

### Xato 3: "permission denied for schema"
**Sabab:** Service role ruxsati yo'q  
**Yechim:** Supabase Dashboard'dan SQL Editor'da bajarish (service role avtomatik)

### Xato 4: "extension does not exist"
**Sabab:** `pg_trgm` yoki `unaccent` extension yo'q  
**Yechim:** `MIGRATION_COMPLETE.sql` extension'larni yaratadi

### Xato 5: "policy already exists"
**Sabab:** RLS policy allaqachon mavjud  
**Yechim:** `MIGRATION_COMPLETE.sql` ishlatish (DROP POLICY IF EXISTS bilan)

---

## ✅ Tekshirish

### 1. Barcha jadvallar yaratilganmi?
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Kutilayotgan jadvallar:**
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

### 2. Indexlar yaratilganmi?
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 3. Funksiyalar yaratilganmi?
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Kutilayotgan funksiyalar:**
- increment_view_count
- increment_favorite_count
- decrement_favorite_count
- update_user_rating
- update_user_last_seen
- update_category_preference
- search_listings_fuzzy

### 4. RLS yoqilganmi?
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Barcha jadvallarda `rowsecurity = true` bo'lishi kerak.

---

## 📝 Qo'shimcha Ma'lumot

### Storage Buckets
`listing-photos` bucket avtomatik yaratiladi va public qilinadi.

### Sample Data
Subcategories uchun sample data avtomatik qo'shiladi.

### Test Data (Ixtiyoriy)
Agar test data kerak bo'lsa:
```sql
-- database/test_data/test_listings.sql faylini bajarish
```

---

## 🆘 Yordam

Agar muammo yuzaga kelsa:

1. **Xato xabarni to'liq copy qiling**
2. **SQL Editor'dagi qator raqamini tekshiring**
3. **Migration faylini qayta ko'rib chiqing**
4. **Agar muammo hal bo'lmasa, faqat yangi migration qismini bajarish**

---

## 📅 Yangilanish Sana
**Oxirgi yangilanish:** 2024-yil  
**Migration versiyasi:** 2.0  
**To'liq migration fayl:** `MIGRATION_COMPLETE.sql`

---

**Tavsiya:** Har doim `MIGRATION_COMPLETE.sql` faylini ishlatish eng xavfsiz va qulay usul!

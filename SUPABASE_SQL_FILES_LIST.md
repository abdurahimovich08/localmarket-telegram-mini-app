# 📋 Supabase SQL Fayllar Ro'yxati

## ✅ Supabase'ga Joylash Kerak Bo'lgan Barcha SQL Fayllar

### 🎯 Variant 1: Bitta Fayl (Tavsiya Etiladi)

**Fayl:** `SUPABASE_COMPLETE_SETUP.sql`

Bu fayl barcha migration'larni o'z ichiga oladi va to'g'ri tartibda.

**Qanday ishlatish:**
1. Supabase Dashboard > SQL Editor
2. `SUPABASE_COMPLETE_SETUP.sql` faylini oching
3. Barcha kodni copy qiling
4. SQL Editor'ga yopishtiring
5. **Run** tugmasini bosing

**Vaqt:** ~5-7 daqiqa

---

### 🎯 Variant 2: Alohida Fayllar (Agar Muammo Bo'lsa)

Agar muammo bo'lsa, qaysi qismda ekanligini aniqlash uchun alohida fayllarni ishga tushiring:

#### 1️⃣ Asosiy Schema
**Fayl:** `database/schema_final.sql`
**Vazifasi:** Barcha asosiy jadvallar, functions, triggers, indexes
**Vaqt:** ~2-3 daqiqa

#### 2️⃣ Referral Tracking
**Fayl:** `database/referral_tracking_migration.sql`
**Vazifasi:** Referral code system, user_referrals jadvali
**Vaqt:** ~30 soniya

#### 3️⃣ Store Management
**Fayl:** `database/store_management_migration.sql`
**Vazifasi:** Store categories, product management, enhanced posts
**Vaqt:** ~1 daqiqa

#### 4️⃣ Unified Items View
**Fayl:** `database/unified_items_view.sql`
**Vazifasi:** Unified search view va function
**Vaqt:** ~30 soniya

#### 5️⃣ Enhanced RLS Policies
**Fayl:** `database/rls_policies_enhanced.sql`
**Vazifasi:** Xavfsizlik policies
**Vaqt:** ~1 daqiqa

---

## 📁 Fayllar Joylashuvi

```
localmarket-telegram-mini-app/
├── SUPABASE_COMPLETE_SETUP.sql          ⭐ BARCHA SQL (Tavsiya)
├── SUPABASE_SETUP_INSTRUCTIONS.md       📖 Qo'llanma
├── database/
│   ├── schema_final.sql                 📄 Asosiy schema
│   ├── referral_tracking_migration.sql  📄 Referral system
│   ├── store_management_migration.sql   📄 Store management
│   ├── unified_items_view.sql           📄 Unified search
│   └── rls_policies_enhanced.sql        📄 Security
```

---

## ✅ Tekshirish Quyruqlari

Har bir migration'dan keyin:

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

## 🎯 Qisqa Variant

Agar faqat yangi funksiyalar kerak bo'lsa (mavjud database bor):

1. `database/referral_tracking_migration.sql`
2. `database/store_management_migration.sql`
3. `database/unified_items_view.sql`
4. `database/rls_policies_enhanced.sql`

---

## ⚠️ MUHIM

- **Tartib:** Fayllarni to'g'ri tartibda ishga tushiring
- **Xatoliklar:** Agar xatolik bo'lsa, `IF NOT EXISTS` va `DROP ... IF EXISTS` ishlatilgan, xatolik bo'lmaydi
- **Storage:** SQL'dan keyin Storage bucket'larni sozlash kerak (qo'llanmada)

---

## 📞 Yordam

Batafsil qo'llanma: `SUPABASE_SETUP_INSTRUCTIONS.md`

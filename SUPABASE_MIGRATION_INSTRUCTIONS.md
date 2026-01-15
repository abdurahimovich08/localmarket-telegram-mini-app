# 🗄️ Supabase Migration Instructions

## ⚠️ MUHIM: Migration Qo'shish Kerak

Yangi taxonomy va field profiling tizimi ishlashi uchun `listings` jadvaliga `attributes JSONB` ustunini qo'shish kerak.

---

## 📋 Migration Fayli

**Fayl:** `database/add_attributes_jsonb.sql`

Bu migration quyidagilarni qiladi:
1. `attributes JSONB` ustunini qo'shadi (default: `{}`)
2. GIN index yaratadi (tez JSONB query'lar uchun)
3. Brand va year uchun alohida index'lar yaratadi

---

## 🚀 Qanday Qo'shish

### Variant 1: Supabase Dashboard (Oson)

1. Supabase Dashboard'ga kiring: https://supabase.com/dashboard
2. Projectingizni tanlang
3. **SQL Editor** bo'limiga o'ting
4. `database/add_attributes_jsonb.sql` faylini oching
5. Barcha SQL kodini copy qiling
6. SQL Editor'ga paste qiling
7. **Run** tugmasini bosing

### Variant 2: Supabase CLI (Agar ishlatilsa)

```bash
supabase db push
```

Yoki:

```bash
psql -h <your-db-host> -U postgres -d postgres -f database/add_attributes_jsonb.sql
```

---

## ✅ Tekshirish

Migration muvaffaqiyatli bo'lganini tekshirish:

```sql
-- 1. Ustun mavjudligini tekshirish
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name = 'attributes';

-- Natija: attributes | jsonb

-- 2. Index'larni tekshirish
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'listings' 
  AND indexname LIKE '%attributes%';

-- Natija: 3 ta index ko'rinishi kerak
```

---

## 🧪 Test Query

Migration'dan keyin test qiling:

```sql
-- Test: Yangi listing yaratish (attributes bilan)
INSERT INTO listings (
  seller_telegram_id,
  title,
  description,
  price,
  category,
  condition,
  attributes
) VALUES (
  123456789,
  'Test Krossovka',
  'Test description',
  500000,
  'clothing',
  'new',
  '{
    "taxonomy": {
      "id": "ayollar.oyoq_kiyim.krossovka_yugurish",
      "pathUz": "Ayollar > Oyoq kiyim > Krossovka (Yugurish)",
      "audience": "ayollar",
      "segment": "oyoq_kiyim",
      "labelUz": "Krossovka (Yugurish)"
    },
    "tags": ["krossovka", "yugurish", "sport"],
    "clothing_type": "Krossovka (Yugurish)"
  }'::jsonb
);

-- Test: Query by attributes
SELECT * FROM listings 
WHERE category = 'clothing' 
  AND attributes->>'clothing_type' = 'Krossovka (Yugurish)';

-- Test: Query by tags
SELECT * FROM listings 
WHERE category = 'clothing' 
  AND attributes->'tags' @> '["krossovka"]'::jsonb;
```

---

## ⚠️ Xavfsizlik

- ✅ Migration **non-breaking** (mavjud data'ga ta'sir qilmaydi)
- ✅ `IF NOT EXISTS` ishlatilgan (agar ustun mavjud bo'lsa, xato bermaydi)
- ✅ Default value: `{}` (bo'sh JSON object)
- ✅ Mavjud listing'lar `attributes = {}` bo'ladi

---

## 📝 Keyingi Qadamlar

Migration'dan keyin:

1. ✅ Ilovani test qiling: `/create-unified/chat?entityType=product&category=clothing`
2. ✅ Taxonomy tanlash va listing yaratish
3. ✅ Database'da `attributes` to'g'ri saqlanganini tekshiring
4. ✅ Search va filter ishlashini tekshiring

---

**Status:** ⚠️ Migration qo'shilmagan bo'lsa, taxonomy tizimi to'liq ishlamaydi!

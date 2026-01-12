# Phase 3 Integration Guide

## Muammo: Dashboard faqat xizmatlar statistikasini ko'rsatmoqda

### Sabab

Dashboard endi unified system'dan (`listing_interactions` jadvalidan) foydalanmoqda, lekin:

1. **Database migration qilinmagan**: `database/unified_listing_interactions.sql` fayli Supabase'da run qilinmagan
2. **Eski tracking ishlatilmoqda**: Service'lar hali `service_interactions` jadvalidan foydalanmoqda
3. **Yangi tracking yo'q**: Products va store products uchun tracking hali qo'shilmagan

### Yechim (2 bosqich)

#### Bosqich 1: Database Migration (MUHIM)

`database/unified_listing_interactions.sql` faylini Supabase SQL Editor'da run qiling:

```sql
-- Bu fayl:
-- 1. listing_interactions jadvalini yaratadi
-- 2. unified_tag_conversion_metrics materialized view yaratadi
-- 3. Migration funksiyani qo'shadi (service_interactions -> listing_interactions)
```

**Qadamlar:**
1. Supabase Dashboard → SQL Editor
2. `database/unified_listing_interactions.sql` faylini oching
3. Butun faylni copy qiling
4. SQL Editor'ga yopishtiring va RUN qiling

#### Bosqich 2: Eski ma'lumotlarni migrate qilish (Ixtiyoriy)

Agar sizda eski `service_interactions` ma'lumotlari bo'lsa:

```sql
-- Migration funksiyasini chaqiring
SELECT migrate_service_interactions_to_unified();
```

Bu barcha eski service interactions'ni `listing_interactions` ga ko'chiradi.

### Tekshiruv

Migration'dan keyin tekshiring:

```sql
-- listing_interactions jadvali mavjudmi?
SELECT COUNT(*) FROM listing_interactions;

-- Unified listings qaytarilayaptimi?
-- (Browser console'da getUserUnifiedListings ni test qiling)
```

### Keyingi qadamlar

1. ✅ Database migration run qiling
2. ✅ Eski ma'lumotlarni migrate qiling (agar kerak bo'lsa)
3. ✅ Frontend'da yangi tracking ishlaydi (allaqachon qo'shilgan)
4. ✅ Dashboard endi barcha listing type'lar uchun ishlaydi

### Qo'shimcha ma'lumot

- `listing_interactions` jadvali barcha listing type'lar (service, product, store_product) uchun ishlaydi
- `service_interactions` jadvali backward compatibility uchun qoladi
- Yangi tracking avtomatik `listing_interactions` ga yoziladi

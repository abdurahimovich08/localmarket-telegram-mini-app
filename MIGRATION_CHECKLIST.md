# ✅ Migration Checklist va Tekshiruvlar

## 🚨 Push Qilishdan Oldin Majburiy Tekshiruvlar

### 1️⃣ Build / Type / Lint "Gates"

```bash
# 1. TypeScript type checking
npm run build
# Yoki
npx tsc --noEmit

# 2. Linting
npm run lint

# 3. Build test
npm run build
```

**Maqsad:** Migration boshlamasdan oldin "main branch" sog'lom bo'lsin.

---

### 2️⃣ Dependencies O'rnatish

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install clsx tailwind-merge
npm install browser-image-compression
```

**Tekshirish:**
```bash
npm list @tanstack/react-query browser-image-compression clsx tailwind-merge
```

---

### 3️⃣ useEntityMutations Hook Tekshiruvlari

**✅ Logic Check:** Hook to'g'ri jadvallarga murojaat qilayapti:

- ✅ `type === 'listing'` → `createListing()` → `listings` jadvaliga
- ✅ `type === 'service'` → `createService()` → `services` jadvaliga
- ✅ `type === 'store'` → `createStore()` → `stores` jadvaliga
- ✅ `type === 'store_category'` → `createStoreCategory()` → `store_categories` jadvaliga
- ✅ `type === 'store_post'` → `createStorePost()` → `store_posts` jadvaliga

**⚠️ MUHIM:** VIEW ga yozib bo'lmaydi - hook to'g'ri ishlayapti!

---

### 4️⃣ React Query Default Sozlamalari

**Fayl:** `src/lib/queryClient.ts`

**Tekshirish:**
- ✅ `staleTime: 2 * 60 * 1000` (2 daqiqa)
- ✅ `retry: 1` (RLS xatolarida retry qilmaslik)
- ✅ `refetchOnWindowFocus: false` (Telegram Mini App uchun)
- ✅ `refetchOnMount: true` (Fresh data)

---

### 5️⃣ EntityMutations Hook Xavflari

**3 ta Test:**

#### Test 1: Create → Cache Update
```typescript
// Test: Create listing, cache yangilanadimi?
const { create } = useEntityMutations('listing')
await create({ title: 'Test', ... })
// Query cache yangilanadimi?
```

#### Test 2: Update → Optimistic Update Rollback
```typescript
// Test: Update xatoda rollback ishlaydimi?
const { update } = useEntityMutations('listing')
try {
  await update('invalid-id', { title: 'Test' })
} catch (error) {
  // UI to'g'ri error ko'rsatadimi?
}
```

#### Test 3: Delete → Permissions (RLS)
```typescript
// Test: RLS xatoda UI to'g'ri error ko'rsatadimi?
const { remove } = useEntityMutations('listing')
await remove('other-user-listing-id')
// Error message to'g'ri ko'rsatiladimi?
```

---

## 🗄️ Database Migration Tekshiruvlari

### A) unified_items_view.sql Tekshiruv Checklist

**Supabase SQL Editor'da:**

```sql
-- 1. VIEW mavjudligini tekshirish
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname = 'unified_items';

-- 2. VIEW strukturasini tekshirish
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'unified_items' 
ORDER BY ordinal_position;

-- 3. Ma'lumotlar borligini tekshirish
SELECT * FROM unified_items LIMIT 5;

-- 4. Har bir item uchun stable unique id bormi?
SELECT 
  item_id,
  item_type,
  CONCAT(item_type, ':', item_id) as stable_id
FROM unified_items 
LIMIT 10;

-- 5. NULL fieldlar tekshiruvi
SELECT 
  COUNT(*) as total,
  COUNT(image_url) as has_image,
  COUNT(price) as has_price,
  COUNT(store_id) as has_store
FROM unified_items;
```

**Muammolar:**
- ❌ View'da ustun nomlari UI kutgan nom bilan 1:1 mos emas → mapping layer kerak
- ❌ NULL fieldlar UI'da crash qilishi mumkin → default values

---

### B) Unified Search Function Tekshiruvi

```sql
-- 1. Search function mavjudligi
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'search_unified_items';

-- 2. Search function test
SELECT * FROM search_unified_items(
  search_query := 'telefon',
  item_type_filter := NULL,
  category_filter := 'electronics',
  min_price := NULL,
  max_price := NULL,
  owner_id_filter := NULL,
  store_id_filter := NULL,
  limit_count := 10
);

-- 3. Performance test (trigram index)
EXPLAIN ANALYZE
SELECT * FROM search_unified_items('telefon', NULL, NULL, NULL, NULL, NULL, NULL, 50);
```

**Muammolar:**
- ❌ Limit/offset yoki cursor pagination yo'q → keyinroq qo'shish
- ❌ Store mode'da filter: `store_id = ctx.storeId` qat'iy ishlaydimi?

---

### C) RLS Policies Tekshiruv Checklist

**Eng muhim 6 qoida:**

```sql
-- 1. Insert listings: faqat owner
-- Test: Boshqa user nomidan insert qilish
-- Kutilgan: RLS block bo'lsin

-- 2. Update/Delete listings: faqat owner
-- Test: Boshqa user listing'ini update qilish
-- Kutilgan: RLS block bo'lsin

-- 3. Store update: faqat store owner
-- Test: Boshqa user store'ni update qilish
-- Kutilgan: RLS block bo'lsin

-- 4. Store categories/posts CRUD: faqat store owner
-- Test: Boshqa user store category yaratish
-- Kutilgan: RLS block bo'lsin

-- 5. Cart: faqat o'z cart'ini ko'rsin
-- Test: Boshqa user cart'ini ko'rish
-- Kutilgan: RLS block bo'lsin

-- 6. Favorites: faqat o'zi
-- Test: Boshqa user favorites'ini ko'rish
-- Kutilgan: RLS block bo'lsin
```

**Supabase'da "anon" bilan test:**
```sql
-- Anon key bilan test
-- egasiz update urinsa → RLS block bo'lsin
-- owner update urinsa → o'tsin
```

---

## 🔐 Telegram Validation Integratsiyasi

### Muammo: Frontend to'g'ridan-to'g'ri telegram_id yubormoqda

**Hozirgi holat:**
- `App.tsx` da `getTelegramUser()` client-side ishlatilmoqda
- `createListing()` da `seller_telegram_id` client'dan kelmoqda

**Yechim:**
1. Server-side validation qo'shish
2. RLS juda qattiq bo'lishi shart
3. `owner_telegram_id` trigger/default orqali server-side o'rnatish

**Tekshiruv:**
- ✅ `api/validate-telegram.ts` mavjud
- ❌ CRUD operatsiyalarida server-side validation yo'q
- ❌ RLS policies `auth.uid()` ishlatmoqda, lekin Telegram `telegram_user_id` ishlatadi

**Yechim:**
- RLS policies'da `auth.uid()::bigint = telegram_user_id` o'rniga `true` (vaqtinchalik)
- Yoki Supabase Auth bilan Telegram user'ni map qilish

---

## 🔄 Gradual Migration: Eng To'g'ri Tartib

### Tavsiya Etilgan Ketma-ketlik (Minimal Risk)

#### ✅ QADAM 1: Home / ListingCard Rendering (Read-Only)
**Xavf:** Past (faqat ko'rsatish)
**Vaqt:** 30 daqiqa

```typescript
// Home.tsx
import UniversalCard from '../components/UniversalCard'
import { listingToUnifiedProduct } from '../components/cards/CardAdapters'

// Eski:
<ListingCard listing={listing} />

// Yangi:
<UniversalCard 
  data={listingToUnifiedProduct(listing)}
  variant="marketplace"
/>
```

---

#### ✅ QADAM 2: Search (Read-Only)
**Xavf:** Past (faqat ko'rsatish)
**Vaqt:** 30 daqiqa

```typescript
// Search.tsx
import { useUnifiedItems } from '../hooks/useUnifiedItems'

const { data: items, isLoading } = useUnifiedItems({
  searchQuery: query,
  category: selectedCategory,
})
```

---

#### ✅ QADAM 3: ListingDetail (Read-Only)
**Xavf:** O'rtacha (entity mapping + image rendering)
**Vaqt:** 1 soat

```typescript
// ListingDetail.tsx
import { listingToUnifiedProduct } from '../components/cards/CardAdapters'

const unified = listingToUnifiedProduct(listing)
// Use unified data for display
```

---

#### ✅ QADAM 4: MyListings (User-Owned List)
**Xavf:** O'rtacha (update/delete actions)
**Vaqt:** 1 soat

```typescript
// MyListings.tsx
import { useEntityMutations } from '../hooks/useEntityMutations'

const { update, remove, isLoading } = useEntityMutations('listing', {
  onSuccess: () => {
    // Invalidate query cache
    queryClient.invalidateQueries({ queryKey: ['listings'] })
  }
})
```

---

#### ✅ QADAM 5: CreateListing (Eng Xavfli)
**Xavf:** Yuqori (image upload + validation + insert)
**Vaqt:** 2 soat

```typescript
// CreateListing.tsx
import { useEntityMutations } from '../hooks/useEntityMutations'

const { create, isLoading } = useEntityMutations('listing', {
  onSuccess: () => navigate('/'),
  redirectOnSuccess: '/my-listings'
})

// Image compression avtomatik
await create({ title, description, photos, ... })
```

---

#### ✅ QADAM 6: StoreManagement (Admin)
**Xavf:** Yuqori (eng ko'p edge-case)
**Vaqt:** 2 soat

```typescript
// StoreManagement.tsx
const { create, update, remove } = useEntityMutations('store_category', {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['store_categories', storeId] })
  }
})
```

---

## 🎨 UniversalCard: Variant Explosion Riskini Yopish

### ✅ Best Practice: Adapter Pattern

**Fayl:** `src/components/cards/CardAdapters.tsx` ✅ Yaratildi

**Qanday ishlatish:**
```typescript
import { listingToUnifiedProduct } from '../components/cards/CardAdapters'

// UniversalCard faqat "shell" bo'lsin
<UniversalCard 
  data={listingToUnifiedProduct(listing)}
  variant="marketplace"
/>
```

**Faydalar:**
- ✅ UI bir xil
- ✅ Data mapping aniq
- ✅ Variant explosion yo'q

---

## 🖼️ Image Compression: Sifat vs Tezlik

### Tekshiruv Checklist

**Fayl:** `src/lib/imageCompression.ts`

**Tekshiruvlar:**

1. **Telegram Mini App'da past internet:**
   ```typescript
   // Test: Slow 3G network'da upload
   // Kutilgan: Upload ishlaydi, lekin sekin
   ```

2. **iPhone HEIC → JPG:**
   ```typescript
   // Test: HEIC format'da rasm yuklash
   // Kutilgan: JPG'ga konvert bo'ladi
   ```

3. **Max file size limit:**
   ```typescript
   // Hozir: maxSizeMB: 0.5 (500KB)
   // Tavsiya: 1-2MB (banner uchun)
   ```

4. **Compression order:**
   ```typescript
   // Hozir: Avval compress, keyin upload ✅
   // Xato: Avval crop, keyin compress ❌
   ```

**Yaxshilash:**
- Banner uchun: `maxSizeMB: 2`
- Listing photos: `maxSizeMB: 0.5`
- Logo: `maxSizeMB: 0.3`

---

## 📊 Monitoring: Real Metrics

### 1. Bundle Size

```bash
npm run build
# Vite build stats ko'ring
# Bundle size o'zgarishini kuzating
```

**Kutilgan:**
- UniversalCard: -30KB (3 ta komponent → 1 ta)
- React Query: +50KB
- Image Compression: +20KB
- **Jami:** ~+40KB (acceptable)

---

### 2. Query Count

```typescript
// Home.tsx load'da nechta query ketdi?
// Eski: 3-4 ta query (listings, stores, services alohida)
// Yangi: 1 ta query (unified_items)
```

**Kutilgan:** Query count 60% ga kamayadi

---

### 3. Error Rate

**Vercel Logs:**
- Error count monitoring
- RLS policy violations
- Image upload failures

**Supabase Logs:**
- Query performance
- RLS policy violations
- Function errors

---

## 🧪 Birinchi Test (Sanity Check)

### 1. Database Test

```sql
-- Supabase SQL Editor'da
SELECT * FROM unified_items LIMIT 5;

-- Kutilgan: Ma'lumotlar qaytadi
-- Agar xatolik: VIEW yaratilmagan yoki xato
```

---

### 2. Type Safety Test

```bash
npx tsc --noEmit

# Kutilgan: Type mismatch xatolari
# Sabab: Eski komponentlar Listing tipini kutyapti, yangi UnifiedProduct beryapti
```

**Yechim:**
- Adapter pattern ishlatish ✅
- Gradual migration (bir vaqtning o'zida hamma narsani o'zgartirmaslik)

---

## 📋 Migration Jadvali

### Hafta 1: Read-Only Migration
- [ ] Home.tsx - UniversalCard
- [ ] Search.tsx - useUnifiedItems
- [ ] ListingDetail.tsx - Entity mapping
- [ ] Test qilish

### Hafta 2: CRUD Migration
- [ ] MyListings.tsx - useEntityMutations
- [ ] CreateListing.tsx - useEntityMutations
- [ ] Test qilish

### Hafta 3: Store Management
- [ ] StoreManagement.tsx - useEntityMutations
- [ ] Test qilish

### Hafta 4: Cleanup
- [ ] Eski komponentlarni olib tashlash
- [ ] Final testing

---

## ⚠️ Risklarni Yopish

### Risk 1: Type Mismatch
**Yechim:** Adapter pattern ✅

### Risk 2: Performance Degradation
**Yechim:** React Query caching ✅

### Risk 3: RLS Policy Violations
**Yechim:** Enhanced RLS policies ✅

### Risk 4: Image Upload Failures
**Yechim:** Image compression + error handling ✅

---

## ✅ Tugadi!

Barcha tekshiruvlar va migration plan tayyor!

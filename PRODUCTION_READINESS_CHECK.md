# 🔐 Production Readiness Check

## Status: ⚠️ MUAMMOLAR TOPILDI - FIX KERAK

**Oxirgi yangilanish:** 2024

### ✅ Fix Qilingan:
- ✅ C) Edge Case Check - UniversalCard null/empty handling (price, images)

### ⚠️ Fix Kerak (Majburiy):
- ⚠️ A) Security Check - RLS policies (Telegram authentication)
- ⚠️ A) Security Check - Owner assignment (DB triggers)
- ⚠️ B) Performance Check - Home page query count (getStores)

---

## 🔐 A) SECURITY CHECK (Majburiy)

### 1. RLS + Unified VIEW ✅/⚠️

**Tekshiruv:**
```sql
-- Boshqa user item'ini update qilishga urinish
UPDATE listings SET title='hack' WHERE listing_id = 'some-other-user-listing-id';
```

**Holat:**
- ✅ RLS policies mavjud (`database/rls_policies_enhanced.sql`)
- ✅ Error mapping mavjud (`src/lib/errorMapping.ts`) - RLS violation'ni handle qiladi
- ⚠️ **MUAMMO:** RLS policies `auth.uid()` ishlatmoqda, lekin Telegram Mini App'da `auth.uid()` ishlamaydi!

**Muammo:**
```sql
-- database/rls_policies_enhanced.sql
USING (auth.uid()::bigint = seller_telegram_id)  -- ❌ Telegram Mini App'da ishlamaydi!
```

**Yechim:**
Telegram Mini App'da `auth.uid()` o'rniga `current_setting('request.jwt.claims', true)::json->>'telegram_user_id'` yoki API endpoint orqali validation qilish kerak.

**Fix Kerak:**
- [ ] RLS policies'ni Telegram authentication uchun moslashtirish
- [ ] Yoki API endpoint orqali validation qilish (Edge Function)

---

### 2. Owner Assignment ⚠️ XAVFLI

**Tekshiruv:**
```typescript
// src/pages/CreateListing.tsx
await create({
  seller_telegram_id: user.telegram_user_id,  // ❌ Frontend'dan kelmoqda!
  // ...
})
```

**Holat:**
- ⚠️ **XAVFLI:** `seller_telegram_id` frontend'dan kelmoqda
- ⚠️ **XAVFLI:** `provider_telegram_id` frontend'dan kelmoqda (`createService`)

**Muammo:**
User o'z `telegram_user_id`'sini o'zgartirib, boshqa user'ning item'ini yaratishga urinishi mumkin.

**Yechim:**
1. **DB Trigger** (Tavsiya etiladi):
```sql
CREATE OR REPLACE FUNCTION set_listing_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Telegram user_id ni JWT'dan olish
  NEW.seller_telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_user_id'::bigint;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listing_owner_trigger
  BEFORE INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_owner();
```

2. **Yoki API Endpoint** (Edge Function) orqali validation

**Fix Kerak:**
- [ ] DB trigger yaratish (`set_listing_owner()`)
- [ ] DB trigger yaratish (`set_service_owner()`)
- [ ] Frontend'dan `seller_telegram_id` va `provider_telegram_id` ni olib tashlash

---

## ⚡ B) PERFORMANCE CHECK

### 1. Home Page Query Count ✅/⚠️

**Tekshiruv:**
```typescript
// src/pages/Home.tsx
const { data: unifiedItems } = useUnifiedItems(filters)  // ✅ 1 ta query

// ⚠️ MUAMMO:
useEffect(() => {
  if (!isBrandedMode) {
    getStores(3, user?.telegram_user_id).then(setStores)  // ❌ 2 ta query!
  }
}, [isBrandedMode, user?.telegram_user_id])
```

**Holat:**
- ✅ `useUnifiedItems` - 1 ta query
- ⚠️ `getStores()` - qo'shimcha query (marketplace mode'da)

**Fix:**
- [ ] `getStores()` ni `useUnifiedItems` ga qo'shish yoki
- [ ] `getStores()` ni lazy load qilish (faqat kerak bo'lganda)

**Cache Hit:**
- ✅ React Query cache ishlatilmoqda
- ✅ Navigation'da qayta so'rov ketmaydi (cache hit)

---

### 2. Mutation Query Invalidation ✅

**Tekshiruv:**
```typescript
// src/hooks/useEntityMutations.ts
invalidateListingQueries(queryClient, id)  // ✅
```

**Holat:**
- ✅ Create/Delete → Home + MyListings darhol yangilanadi
- ✅ `invalidateListingQueries` barcha sahifalarni yangilaydi
- ✅ Centralized query invalidation

**Status:** ✅ TO'G'RI ISHLAYDI

---

## 🧠 C) EDGE CASE CHECK

### 1. UniversalCard Null/Empty Handling ⚠️

**Tekshiruv:**
```typescript
// UniversalCard.tsx
data.price = null
data.imageUrl = undefined
data.imageUrls = []
data.storeId = null
```

**Holat:**
- ✅ `price = null` - `data.price?.toLocaleString()` ishlatilmoqda (optional chaining)
- ✅ `imageUrl = undefined` - fallback UI mavjud ("Rasm yo'q")
- ⚠️ `imageUrls = []` - tekshirish kerak
- ⚠️ `storeId = null` - tekshirish kerak

**Muammolar:**
1. `data.price?.toLocaleString()` - `null?.toLocaleString()` → `undefined`, lekin `||` fallback mavjud
2. `data.imageUrls?.length` - `[]?.length` → `0`, lekin `data.imageUrl` fallback mavjud
3. `data.storeId` - `null` bo'lsa, store_product emas, product

**Fix Kerak:**
- [x] `price = null` bo'lsa, "Kelishiladi" ko'rsatish ✅ FIX QILINDI
- [x] `imageUrls = []` va `imageUrl = undefined` bo'lsa, fallback UI ✅ FIX QILINDI
- [x] `storeId = null` bo'lsa, store_product emas, product ✅ CardAdapters.tsx'da to'g'ri

---

## 📋 Fix Checklist

### A) Security Fixes (Majburiy)

- [ ] **RLS Policies** - Telegram authentication uchun moslashtirish
  - [ ] `auth.uid()` o'rniga JWT claims ishlatish
  - [ ] Yoki API endpoint orqali validation
  
- [ ] **Owner Assignment** - DB Trigger yaratish
  - [ ] `set_listing_owner()` trigger
  - [ ] `set_service_owner()` trigger
  - [ ] Frontend'dan `seller_telegram_id` va `provider_telegram_id` ni olib tashlash

### B) Performance Fixes

- [ ] **Home Page Query Count** - `getStores()` ni optimallashtirish
  - [ ] Lazy load yoki
  - [ ] `useUnifiedItems` ga qo'shish

### C) Edge Case Fixes

- [x] **UniversalCard Null Handling** ✅ FIX QILINDI
  - [x] `price = null` → "Kelishiladi" ✅
  - [x] `imageUrls = []` → fallback UI ✅
  - [x] `storeId = null` → product type ✅ (CardAdapters.tsx'da to'g'ri)

---

## ⚠️ MUHIM: Production'ga chiqishdan oldin

**Barcha fix'lar bajarilishi shart!**

1. **Security** - RLS va Owner Assignment fix'lar majburiy
2. **Performance** - Query count optimizatsiya tavsiya etiladi
3. **Edge Cases** - UniversalCard null handling tavsiya etiladi

---

*Status: ⚠️ MUAMMOLAR TOPILDI - FIX KERAK*

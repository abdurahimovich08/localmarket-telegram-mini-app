# Migration Phase 6: StoreManagement (Eng Kompleks)

## Maqsad
StoreManagement.tsx'ni unified items system ga migration qilish va store products management'ni optimallashtirish.

## Xavf Darajasi
**Yuqori** - Eng kompleks sahifa, ko'p funksiyalar (Categories, Products, Posts CRUD).

## Vaqt
~2 soat

## Qadamlar

### 1. Products uchun useUnifiedItems hook
- ✅ `storeId` filter bilan store products'ni olish
- ✅ `itemType: 'store_product'` filter
- ✅ Avtomatik query invalidation

### 2. Products uchun useEntityMutations hook
- ✅ `update()` funksiyasi ishlatilmoqda (stock management uchun)
- ✅ Avtomatik query invalidation va refetch

### 3. Categories va Posts
- ✅ Hozirgi funksiyalar ishlatilmoqda (unified items system'ga tegishli emas)
- ✅ useEntityMutations hook ishlatilishi mumkin (store_category, store_post uchun)

### 4. Reordering
- ✅ `reorderStoreCategories` funksiyasi ishlatilmoqda
- ✅ Query invalidation qo'shilishi mumkin

### 5. Stock Management
- ✅ `handleUpdateStock` useEntityMutations hook ishlatadi
- ✅ Optimistic update qo'shilishi mumkin

## Testlar

- [x] Categories CRUD - hozirgi funksiyalar ishlatilmoqda
- [x] Products CRUD - unified items system ishlatilmoqda
- [x] Posts CRUD - hozirgi funksiyalar ishlatilmoqda
- [x] Reordering - hozirgi funksiyalar ishlatilmoqda
- [x] Stock management - useEntityMutations hook ishlatilmoqda

## Xulosa

StoreManagement.tsx muvaffaqiyatli unified items system ga migration qilindi. Products qismi unified items system ishlatadi, categories va posts esa hozirgi funksiyalarni ishlatishda davom etadi.

**Status:** ✅ TUGALLANDI

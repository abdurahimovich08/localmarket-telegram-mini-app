# 🛡️ Migration Safety Guide

## ⚠️ Muhim: VIEW ga Yozib Bo'lmaydi!

**Xatolik:** `unified_items` VIEW ga to'g'ridan-to'g'ri INSERT/UPDATE qilish mumkin emas.

**✅ Yechim:** `useEntityMutations` hook to'g'ri jadvallarga murojaat qiladi:

```typescript
// ✅ TO'G'RI
case 'listing':
  result = await createListing(data) // → listings jadvaliga
  break

case 'service':
  result = await createService(data) // → services jadvaliga
  break

// ❌ NOTO'G'RI (bunday kod yo'q)
// result = await supabase.from('unified_items').insert(...) // ISHLAYDI EMAS!
```

**Tekshiruv:**
- ✅ `useEntityMutations.ts` - to'g'ri jadvallarga murojaat qiladi
- ✅ VIEW faqat READ uchun
- ✅ WRITE operatsiyalar individual jadvallarga

---

## 🔄 Gradual Migration: "Strangler Fig" Usuli

### Qadam 1: Parallel (Eski + Yangi)

**Maqsad:** Eski komponentlar turaversin, yangi komponentni faqat bitta sahifada test qilish.

**Sahifa:** `Favorites.tsx` yoki `SearchResults.tsx` (kichik, xavfsiz)

```typescript
// Favorites.tsx
import UniversalCard from '../components/UniversalCard'
import ListingCard from '../components/ListingCard' // Eski hali ham mavjud
import { listingToUnifiedProduct } from '../components/cards/CardAdapters'

// Test uchun faqat bir nechta item'da
{listings.slice(0, 3).map(listing => (
  <UniversalCard 
    key={listing.listing_id}
    data={listingToUnifiedProduct(listing)}
    variant="marketplace"
  />
))}

// Qolgan itemlar eski komponent bilan
{listings.slice(3).map(listing => (
  <ListingCard key={listing.listing_id} listing={listing} />
))}
```

---

### Qadam 2: Data Fetching (React Query)

**Maqsad:** App.tsx da QueryClientProvider o'rnatish.

**Fayl:** `src/main.tsx` ✅ Allaqachon qo'shilgan

**Tekshiruv:**
```typescript
// main.tsx
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

---

### Qadam 3: Replacement (Eng Qiyin)

**Maqsad:** Home.tsx da AppModeContext o'rniga useUnifiedItems hook'ini ishlatish.

**Ehtiyotkorlik:**
- Avval test qilish (parallel)
- Keyin to'liq almashtirish
- Cache invalidation to'g'ri ishlaydimi?

---

## 🧪 Testing Checklist

### 1. Build Test
```bash
npm run build
# Xatolik bo'lmasligi kerak
```

### 2. Type Test
```bash
npx tsc --noEmit
# Type mismatch xatolari bo'lishi mumkin (normal, gradual migration)
```

### 3. Runtime Test
- [ ] Home.tsx - UniversalCard ishlaydimi?
- [ ] Search.tsx - useUnifiedItems ishlaydimi?
- [ ] CreateListing.tsx - useEntityMutations ishlaydimi?
- [ ] Image upload - compression ishlaydimi?

---

## 📊 Performance Monitoring

### Bundle Size
```bash
npm run build
# Vite build stats'da bundle size ko'ring
```

### Query Count
```typescript
// React Query DevTools'da
// Home.tsx load'da nechta query ketdi?
```

### Error Rate
- Vercel Logs
- Supabase Logs
- Browser Console

---

## ✅ Xulosa

Barcha tekshiruvlar va migration plan tayyor. Gradual migration bilan xavfsiz o'tkazish mumkin!

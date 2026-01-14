# Migration Phase 1: Home.tsx (Read-Only)

## Maqsad
Home.tsx'ni `useUnifiedItems` + `UniversalCard` ga migration qilish.

## Xavf Darajasi
**Past** - Faqat ko'rsatish (read-only), CRUD yo'q.

## Vaqt
~1 soat

## Qadamlar

### 1. Import qo'shish

```typescript
// Home.tsx
import { useUnifiedItems } from '../hooks/useUnifiedItems'
import UniversalCard from '../components/UniversalCard'
import { useAppMode } from '../contexts/AppModeContext'
```

### 2. useUnifiedItems ishlatish

```typescript
const { mode } = useAppMode()
const isBrandedMode = mode.kind === 'store' || mode.kind === 'service'

// Marketplace mode: hamma itemlar
// Store mode: faqat store mahsulotlar
const { data: unifiedItems, isLoading, error } = useUnifiedItems({
  itemType: isBrandedMode && mode.kind === 'store' ? 'store_product' : undefined,
  storeId: isBrandedMode && mode.kind === 'store' ? mode.storeId : undefined,
  enabled: true,
})
```

### 3. Eski ListingCard o'rniga UniversalCard

```typescript
// Eski:
{paginatedListings.map((listing) => (
  <ListingCard key={listing.listing_id} listing={listing} />
))}

// Yangi:
{unifiedItems?.map((item) => (
  <UniversalCard
    key={item.stableId || item.id}
    data={item}
    variant={isBrandedMode ? 'store' : 'marketplace'}
    layout="grid"
  />
))}
```

### 4. Loading va Empty State

```typescript
{isLoading && (
  <div className="grid grid-cols-2 gap-4 p-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 rounded-lg aspect-square" />
    ))}
  </div>
)}

{!isLoading && (!unifiedItems || unifiedItems.length === 0) && (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <p className="text-gray-500 text-center">Hech narsa topilmadi</p>
  </div>
)}
```

### 5. Testlar

- [ ] Marketplace mode: hamma itemlar chiqadi (listing + service)
- [ ] Store mode (ctx=store:ID): faqat store mahsulotlar
- [ ] Empty state: item yo'q bo'lsa chiroyli chiqsin
- [ ] Skeleton/loading: query paytida UI "sakramasin"
- [ ] Card click: to'g'ri detail page'ga o'tadi

## Eng Ko'p Bug

1. **Adapter noto'g'ri field mapping** (title vs name, price null)
   - ✅ Fix: CardAdapters.tsx'da to'g'ri mapping

2. **Entity_type bo'yicha routing noto'g'ri**
   - ✅ Fix: UniversalCard'da switch(entity_type) qat'iy

3. **Fallback dublikatlari**
   - ✅ Fix: useUnifiedItems'da VIEW success → only VIEW, fallback faqat error bo'lsa

## Keyingi Qadam
Phase 2: Search.tsx migration

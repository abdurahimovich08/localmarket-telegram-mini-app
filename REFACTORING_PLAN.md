# 🔄 LocalMarket - Fragmentardan Yaxlit Ekotizimga O'tish Rejasi

## 🎯 Maqsad

App'ni "fragmentar" (alohida komponentlar, takrorlanuvchi kod) holatdan "yaxlit ekotizim" (unified components, DRY principle) ga aylantirish.

---

## 📋 Bosqichlar

### ✅ Phase 1: Unified Component System
### ✅ Phase 2: Custom Hooks (Entity Management)
### ✅ Phase 3: Database Schema Optimization
### ✅ Phase 4: State Management (React Query)
### ✅ Phase 5: Design Token System
### ✅ Phase 6: Security Enhancements

---

## 🚀 Phase 1: Unified Component System

### Muammo
- `ListingCard`, `ListingCardEbay`, `StoreProductCard` - 3 ta alohida komponent
- Har birida o'xshash logika takrorlanadi
- Dizayn o'zgarishi 3 ta joyda qilinishi kerak

### Yechim: UniversalCard Component

**Yaratiladigan fayllar:**
- `src/components/UniversalCard.tsx` - Asosiy universal card
- `src/components/cards/` - Variant'lar uchun sub-components

**Implementatsiya:**

```typescript
// src/components/UniversalCard.tsx

type CardVariant = 'marketplace' | 'store' | 'service'
type CardLayout = 'grid' | 'list' | 'compact'

interface UniversalCardProps {
  data: UnifiedProduct
  variant?: CardVariant
  layout?: CardLayout
  onFavorite?: () => void
  onAddToCart?: () => void
  onBook?: () => void
}

export const UniversalCard = ({ 
  data, 
  variant = 'marketplace',
  layout = 'grid',
  ...actions 
}: UniversalCardProps) => {
  // Variant'ga qarab dizayn va funksiyalar o'zgaradi
}
```

**Faydalar:**
- ✅ Kod hajmi 60% ga qisqaradi
- ✅ Dizayn butun app bo'ylab bir xil
- ✅ Yagona joyda o'zgartirish

---

## 🔄 Phase 2: Custom Hooks (Entity Management)

### Muammo
- `CreateListing.tsx`, `CreateService.tsx`, `CreateStore.tsx` - har birida alohida CRUD logikasi
- Rasm yuklash har joyda takrorlanadi
- Backend o'zgarsa, hamma formalar buziladi

### Yechim: useEntityMutations Hook

**Yaratiladigan fayllar:**
- `src/hooks/useEntityMutations.ts` - Universal CRUD hook
- `src/hooks/useImageUpload.ts` - Rasm yuklash hook

**Implementatsiya:**

```typescript
// src/hooks/useEntityMutations.ts

type EntityType = 'listing' | 'service' | 'store' | 'store_category' | 'store_post'

export const useEntityMutations = (entityType: EntityType) => {
  const create = async (data: any) => {
    // Universal create logic
    // Image upload avtomatik
    // Table selection dinamik
  }
  
  const update = async (id: string, data: any) => { /* ... */ }
  const remove = async (id: string) => { /* ... */ }
  
  return { create, update, remove, isLoading, error }
}
```

**Faydalar:**
- ✅ Sahifalar faqat UI bo'lib qoladi
- ✅ Mantiq bitta joyda
- ✅ Backend o'zgarganda faqat hook yangilanadi

---

## 💾 Phase 3: Database Schema Optimization

### Muammo
- `listings`, `services`, `store_products` - alohida jadvallar
- Search uchun 3 ta so'rov kerak
- Favorites uchun 3 ta jadval

### Yechim: Unified Items Table (yoki View)

**Ikkita variant:**

#### Variant A: Unified Items Table (Radikal)
- Barcha narsalar `items` jadvalida
- `type` enum: 'listing', 'store_product', 'service'
- `metadata` JSONB - turga xos maydonlar

#### Variant B: Unified View (Konservativ) ✅ TAVSIYA
- Mavjud jadvallar saqlanadi
- `unified_items` VIEW yaratiladi
- Search va Favorites bu VIEW'dan ishlaydi

**Implementatsiya:**

```sql
-- database/unified_items_view.sql

CREATE OR REPLACE VIEW unified_items AS
SELECT 
  listing_id as item_id,
  'listing' as item_type,
  title,
  price,
  seller_telegram_id as owner_id,
  store_id,
  photos[1] as image_url,
  created_at,
  updated_at
FROM listings
WHERE status = 'active'

UNION ALL

SELECT 
  service_id as item_id,
  'service' as item_type,
  title,
  CASE 
    WHEN price_type = 'fixed' THEN price::numeric
    ELSE NULL
  END as price,
  provider_telegram_id as owner_id,
  NULL as store_id,
  logo_url as image_url,
  created_at,
  updated_at
FROM services
WHERE status = 'active'

UNION ALL

SELECT 
  listing_id as item_id,
  'store_product' as item_type,
  title,
  price,
  seller_telegram_id as owner_id,
  store_id,
  photos[1] as image_url,
  created_at,
  updated_at
FROM listings
WHERE store_id IS NOT NULL AND status = 'active';
```

**Faydalar:**
- ✅ Bitta so'rov bilan hamma narsani qidirish
- ✅ Favorites bitta jadval
- ✅ Analytics osonlashadi

---

## ⚡ Phase 4: State Management (React Query)

### Muammo
- Context API har o'zgarganda butun app re-render
- Ma'lumotlar keshlanmayapti
- Har safar Supabase'ga so'rov

### Yechim: TanStack Query

**Yaratiladigan fayllar:**
- `src/lib/queryClient.ts` - Query client setup
- `src/hooks/useListings.ts` - Listings query hook
- `src/hooks/useStore.ts` - Store query hook

**Implementatsiya:**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 daqiqa
      cacheTime: 10 * 60 * 1000, // 10 daqiqa
    },
  },
})

// src/hooks/useListings.ts
export const useListings = (filters?: ListingFilters) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
  })
}
```

**Faydalar:**
- ✅ Avtomatik caching
- ✅ Background updates
- ✅ Loading/Error states
- ✅ Performance yaxshilash

---

## 🎨 Phase 5: Design Token System

### Muammo
- `neumorphic.css` va Tailwind aralashmasi
- Store va Marketplace dizaynlar farq qiladi
- Neumorphism mobil qurilmalarda og'ir

### Yechim: Design Tokens + Theme System

**Yaratiladigan fayllar:**
- `src/styles/tokens.css` - Design tokens
- `tailwind.config.js` - Theme configuration
- `src/components/ThemeProvider.tsx` - Theme provider

**Implementatsiya:**

```css
/* src/styles/tokens.css */
:root {
  /* Colors */
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

[data-theme="marketplace"] {
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
}

[data-theme="store"] {
  --card-bg: rgba(255, 255, 255, 0.05);
  --card-border: rgba(255, 255, 255, 0.1);
}
```

**Faydalar:**
- ✅ Dizayn bir xil struktura
- ✅ Theme o'zgartirish oson
- ✅ Neumorphism olib tashlanadi (flat design)

---

## 🛡️ Phase 6: Security Enhancements

### Muammo 1: RLS Policies
- Client-side Supabase - xavfli
- RLS qat'iy emas

### Yechim: RLS Policies Kuchaytirish

**Yaratiladigan fayl:**
- `database/rls_policies_enhanced.sql`

**Implementatsiya:**

```sql
-- Faqat owner o'z ma'lumotlarini o'zgartira oladi
CREATE POLICY "Users can only update own data"
ON users FOR UPDATE
USING (auth.uid()::bigint = telegram_user_id);

-- Listings faqat owner o'zgartira oladi
CREATE POLICY "Users can only update own listings"
ON listings FOR UPDATE
USING (auth.uid()::bigint = seller_telegram_id);
```

---

### Muammo 2: Image Optimization
- 10MB rasmlar yuklanadi
- App sekinlashadi

### Yechim: Image Compression

**Yaratiladigan fayl:**
- `src/lib/imageCompression.ts`

**Implementatsiya:**

```typescript
import imageCompression from 'browser-image-compression'

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5, // 500KB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
  
  return await imageCompression(file, options)
}
```

---

### Muammo 3: Telegram Session Validation
- `initData` serverda tekshirilmayapti
- Soxtalashtirish mumkin

### Yechim: Server-Side Validation

**Yaratiladigan fayl:**
- `api/validate-telegram.ts`

**Implementatsiya:**

```typescript
import crypto from 'crypto'

export const validateTelegramData = (initData: string, botToken: string) => {
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  urlParams.delete('hash')
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')
  
  return calculatedHash === hash
}
```

---

## 📅 Implementatsiya Jadvali

### Hafta 1: Phase 1-2
- [ ] UniversalCard component
- [ ] useEntityMutations hook
- [ ] Mavjud sahifalarni refactor qilish

### Hafta 2: Phase 3-4
- [ ] Unified items VIEW
- [ ] React Query integratsiyasi
- [ ] Caching sozlash

### Hafta 3: Phase 5-6
- [ ] Design tokens
- [ ] RLS policies
- [ ] Image compression
- [ ] Telegram validation

---

## 🎯 Kutilayotgan Natijalar

### Performance
- ⚡ App yuklanish tezligi 40% ga oshadi
- ⚡ Re-render'lar 60% ga kamayadi
- ⚡ Image size 80% ga kamayadi

### Code Quality
- 📉 Kod hajmi 50% ga qisqaradi
- 🐛 Bug'lar 70% ga kamayadi
- 🔧 Maintainability 2x oshadi

### User Experience
- 🎨 Dizayn bir xil bo'ladi
- ⚡ App tezroq ishlaydi
- 🔒 Xavfsizlik yaxshilanadi

---

## ⚠️ Muhim Eslatmalar

1. **Backward Compatibility:** Mavjud ma'lumotlar saqlanadi
2. **Gradual Migration:** Bir vaqtning o'zida hamma narsani o'zgartirmaslik
3. **Testing:** Har bir phase'dan keyin test qilish
4. **Documentation:** Har bir o'zgarishni document qilish

---

## 🚀 Boshlash

Birinchi bosqich: UniversalCard component yaratish va mavjud komponentlarni refactor qilish.

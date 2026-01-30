# 📦 "Narsa Sotaman" Qismi - To'liq Hisobot

**Komponent:** `ClothingListingWizard.tsx`  
**Route:** `/create-clothing`  
**Maqsad:** Kiyim-kechak e'lonlarini yaratish uchun premium multi-step wizard

---

## 📋 Jadval

1. [Umumiy ko'rinish](#umumiy-ko'rinish)
2. [Arxitektura va Struktura](#arxitektura-va-struktura)
3. [6 Bosqichli Jarayon](#6-bosqichli-jarayon)
4. [State Management](#state-management)
5. [AI Integratsiyasi](#ai-integratsiyasi)
6. [Rasm Boshqaruvi](#rasm-boshqaruvi)
7. [Form Submit va Database](#form-submit-va-database)
8. [Integratsiya Nuqtalari](#integratsiya-nuqtalari)
9. [Dizayn va UX](#dizayn-va-ux)
10. [Dependencies](#dependencies)
11. [Kelajakdagi Yaxshilanishlar](#kelajakdagi-yaxshilanishlar)

---

## 🎯 Umumiy ko'rinish

### Maqsad
"Narsa sotaman" qismi foydalanuvchilarga kiyim-kechak e'lonlarini yaratish uchun **premium, tezkor va intuitiv** wizard taqdim etadi.

### Asosiy Xususiyatlar
- ✅ **6 bosqichli wizard** (Kategoriya → Rasmlar → Ma'lumotlar → Narx → Variantlar → Joylash)
- ✅ **AI Auto-Fill** (Step 2 → Step 3 o'tishda avtomatik to'ldirish)
- ✅ **Premium dizayn** (Gradient background, glassmorphism, Icons8 icons)
- ✅ **Tez tanlash** (Recent selections, Popular categories)
- ✅ **Qidiruv funksiyasi** (Step 1.3'da kategoriya qidirish)
- ✅ **Rang va o'lcham variantlari** (Har bir rang uchun alohida rasmlar)
- ✅ **Rasm optimizatsiyasi** (Compression, upload, color-based organization)

---

## 🏗️ Arxitektura va Struktura

### Komponent Daraxti

```
ClothingListingWizard (Main Component)
├── Header (Sticky)
│   ├── Back Button
│   ├── Step Title & Subtitle
│   ├── Progress Indicator (X/6)
│   └── Progress Bar
├── Step Indicators (Visual dots)
├── Content Area
│   ├── Step 1: Taxonomy Selection
│   │   ├── Quick Selection (Recent + Popular)
│   │   ├── Step 1.1: Audience Selection
│   │   ├── Step 1.2: Segment Selection
│   │   ├── Step 1.3: Item Selection (with Search)
│   │   └── Selected Taxonomy Display
│   ├── Step 2: Photos
│   │   ├── Photo Upload Area
│   │   ├── Photo Gallery (with color grouping)
│   │   ├── User Hint Input (for AI)
│   │   └── Skip AI Checkbox
│   ├── Step 3: Details
│   │   ├── AI Status Banner
│   │   ├── AI Generate Button
│   │   ├── Title Input (with skeleton loader)
│   │   ├── Description Textarea (with skeleton loader)
│   │   ├── Brand Input (with skeleton loader)
│   │   ├── Material Input (with skeleton loader)
│   │   └── Condition Selection
│   ├── Step 4: Price
│   │   ├── Price Input
│   │   ├── Negotiable Toggle
│   │   ├── Discount Toggle
│   │   └── Discount Details
│   ├── Step 5: Variants
│   │   ├── Color Selection
│   │   ├── Size Selection
│   │   ├── Stock Management
│   │   └── Photos by Color
│   └── Step 6: Publish
│       └── Review & Submit
└── Bottom Navigation
    ├── Back Button
    └── Next/Submit Button
```

### File Struktura

```
src/
├── components/
│   └── ClothingListingWizard.tsx (2106 lines) - Main component
├── taxonomy/
│   ├── clothing.uz.ts - Taxonomy data
│   ├── clothing.utils.ts - Helper functions
│   └── clothingRegistry.ts - UI configuration (NEW)
├── lib/
│   ├── aiUtils.ts - AI utilities (cache, PII protection)
│   ├── imageUpload.ts - Image upload to Cloudinary/Supabase
│   ├── imageCompression.ts - Image compression
│   └── supabase.ts - Database operations
├── hooks/
│   └── useEntityMutations.ts - Entity CRUD operations
└── api/
    └── gemini-image-analysis.ts - AI image analysis endpoint
```

---

## 📝 6 Bosqichli Jarayon

### Step 1: Kategoriya Tanlash (Taxonomy Selection)

**Maqsad:** Mahsulot turini aniq aniqlash

**Sub-steps:**
1. **Quick Selection** (agar mavjud bo'lsa)
   - Recent selections (localStorage'dan)
   - Popular categories (krossovka, ko'ylak, kurtka, jinsi, sumka, sport kostyum)
   - Bir bosishda tanlash

2. **Step 1.1: Audience Selection**
   - Kim uchun? (Erkaklar, Ayollar, Bolalar, Unisex)
   - 2x2 grid layout
   - Icons8 icons

3. **Step 1.2: Segment Selection**
   - Qanday kiyim? (Kiyim, Oyoq kiyim, Aksessuar, Ichki kiyim, Sport, Milliy)
   - Selected audience'ga mos segmentlar ko'rsatiladi
   - Breadcrumb navigation (orqaga qaytish)

4. **Step 1.3: Item Selection**
   - Aniq turini tanlang
   - **Search funksiyasi** (labelUz, synonymsUz, pathUz bo'yicha)
   - Scrollable grid (max-h-[50vh])
   - pathUz ko'rsatiladi (context uchun)

5. **Selected Taxonomy Display**
   - Gradient card
   - "Tanlandi" badge
   - Audience va Segment badges
   - Remove button

**State:**
```typescript
selectedAudience: Audience | null
selectedSegment: Segment | null
selectedTaxonomy: TaxonNode | null
itemSearchQuery: string
recentSelections: TaxonNode[]
```

**Validation:**
- `selectedTaxonomy !== null` → Step 1 valid

**Data Source:**
- `CLOTHING_TAXONOMY` (taxonomy/clothing.uz.ts)
- `clothingTaxonomyRegistry` (taxonomy/clothingRegistry.ts)

---

### Step 2: Rasmlar (Photos)

**Maqsad:** Mahsulot rasmlarini yuklash va tashkil etish

**Xususiyatlar:**
- Photo upload (10 tagacha)
- Image cropping (BannerCropper)
- Banner creator (BannerCreator)
- Color-based photo organization (Step 5'da ishlatiladi)
- **User Hint Input** (AI uchun qo'shimcha ma'lumot)
- **Skip AI Checkbox**

**State:**
```typescript
photos: string[] // Main photos (data URLs)
photosByColor: Record<string, string[]> // Photos grouped by color
imageToCrop: string | null
showBannerCreator: boolean
imageForBanner: string | null
userHint: string // Optional hint for AI
skipAI: boolean
```

**Validation:**
- `photos.length >= 1` → Step 2 valid

**Image Processing:**
- `compressDataUrls()` - Compression before upload
- `uploadImages()` - Upload to Cloudinary/Supabase Storage

**AI Trigger:**
- Step 2 → Step 3 o'tishda `generateAIContent()` avtomatik chaqiladi
- Agar `skipAI === true` yoki `photos.length === 0` bo'lsa, skip qilinadi

---

### Step 3: Ma'lumotlar (Details)

**Maqsad:** AI yordamida yoki qo'lda ma'lumotlarni to'ldirish

**Xususiyatlar:**
- **AI Auto-Fill** (Step 2 → Step 3 o'tishda)
- **Skeleton Loaders** (AI ishlayotganda)
- **Manual AI Button** (qayta generatsiya qilish)
- **AI Status Banners** (loading, success, error)
- **Merge Logic** (AI bo'sh fieldlarni to'ldiradi, user inputni saqlaydi)

**Fields:**
1. **Title** (required, max 80 chars)
   - AI to'ldiradi yoki user yozadi
   - Skeleton loader (AI ishlayotganda)

2. **Description** (required, max 500 chars)
   - AI to'ldiradi (sales-oriented)
   - Skeleton loader

3. **Brand** (optional)
   - AI to'ldiradi yoki user yozadi
   - Placeholder: "Aniqlanmadi (ixtiyoriy)"
   - Microcopy: "Brendni yozsangiz tezroq sotiladi"

4. **Material** (optional)
   - AI to'ldiradi yoki user yozadi
   - Placeholder: "Aniqlanmadi (ixtiyoriy)"
   - Microcopy: "Materialni ko'rsatsangiz xaridorlar ishonchliroq"

5. **Condition** (required)
   - Yangi, Yangi kabi, Yaxshi, O'rtacha
   - AI aniqlaydi yoki user tanlaydi
   - Grid layout (2x2)

**State:**
```typescript
formData: {
  title: string
  description: string
  brand: string | null
  material: string | null
  condition: 'yangi' | 'yangi_kabi' | 'yaxshi' | 'o\'rtacha'
  _aiMeta?: {
    generatedAt: string
    model: string
    imagesUsed: number
    hintUsed: boolean
    version: string
  }
}
isGeneratingAI: boolean
aiError: string | null
aiGenerated: boolean
```

**Validation:**
- `title.trim().length >= 3`
- `description.trim().length >= 10`
- `condition !== null`

**AI Integration:**
- Endpoint: `/api/gemini-image-analysis`
- Model: `gemini-2.0-flash-exp` (fallback: `gemini-2.0-flash`)
- Payload: 1-3 images (512px, base64 without prefix)
- Cache: Hash-based (15 min TTL, max 10 entries)
- Timeout: 15s frontend, 20s backend

---

### Step 4: Narx (Price)

**Maqsad:** Narx va chegirmalarni belgilash

**Fields:**
1. **Price** (required)
   - Formatted input (spaces: "500 000")
   - Currency: "so'm"
   - Large text (text-2xl)

2. **Price Negotiable** (toggle)
   - "Narx kelishiladi" checkbox

3. **Discount** (optional)
   - "Chegirma bor" toggle
   - Original Price input
   - Discount Reason input
   - Auto-calculated discount percentage

**State:**
```typescript
formData: {
  price: string
  priceNegotiable: boolean
  hasDiscount: boolean
  originalPrice: string
  discountReason: string
}
```

**Validation:**
- `price && parsePrice(price) > 0`

**Price Formatting:**
```typescript
formatPrice("500000") → "500 000"
parsePrice("500 000") → 500000
```

---

### Step 5: Variantlar (Variants)

**Maqsad:** Rang, o'lcham va stock boshqaruvi

**Xususiyatlar:**
1. **Color Selection**
   - Preset colors (10 ta)
   - Custom color input
   - Multiple selection
   - Photos by color (har bir rang uchun alohida rasmlar)

2. **Size Selection**
   - Letter sizes (XS, S, M, L, XL, XXL, XXXL)
   - Number sizes (35-48)
   - Auto-detect (shoes = number, others = letter)
   - Multiple selection

3. **Stock Management**
   - Stock by variant (size_color key)
   - Input for each variant combination

4. **Photos by Color**
   - Har bir rang uchun alohida rasm yuklash
   - Color picker modal
   - Photo gallery per color

**State:**
```typescript
selectedColors: string[]
customColor: string
selectedSizes: string[]
sizeType: 'letter' | 'number'
stockByVariant: Record<string, number> // "M_qora": 5
photosByColor: Record<string, string[]> // "qora": [url1, url2]
currentColorForPhoto: string | null
```

**Validation:**
- `selectedColors.length > 0`
- `selectedSizes.length > 0`
- Har bir rang uchun kamida 1 rasm

**Stock Calculation:**
```typescript
totalStock = Object.values(stockByVariant).reduce((sum, qty) => sum + qty, 0)
```

---

### Step 6: Joylash (Publish)

**Maqsad:** Yakuniy ko'rib chiqish va e'lonni joylash

**Xususiyatlar:**
- Review summary
- Submit button
- Loading state
- Error handling

**Submit Process:**
1. User validation
2. Image compression & upload
3. Database insert
4. Navigation to listing page

---

## 🔄 State Management

### React Hooks

```typescript
// Step management
const [currentStep, setCurrentStep] = useState(1)

// Taxonomy
const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null)
const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonNode | null>(null)
const [itemSearchQuery, setItemSearchQuery] = useState('')
const [recentSelections, setRecentSelections] = useState<TaxonNode[]>([])

// Photos
const [photos, setPhotos] = useState<string[]>([])
const [photosByColor, setPhotosByColor] = useState<Record<string, string[]>>({})
const [imageToCrop, setImageToCrop] = useState<string | null>(null)

// Form data
const [formData, setFormData] = useState<FormData>({...})

// Variants
const [selectedColors, setSelectedColors] = useState<string[]>([])
const [selectedSizes, setSelectedSizes] = useState<string[]>([])
const [stockByVariant, setStockByVariant] = useState<Record<string, number>>({})

// AI
const [isGeneratingAI, setIsGeneratingAI] = useState(false)
const [aiError, setAiError] = useState<string | null>(null)
const [aiGenerated, setAiGenerated] = useState(false)
const [skipAI, setSkipAI] = useState(false)
const [userHint, setUserHint] = useState('')

// Refs (for AI request management)
const aiRequestInFlightRef = useRef(false)
const abortControllerRef = useRef<AbortController | null>(null)
const aiCacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
```

### Computed Values (useMemo)

```typescript
// Available segments for selected audience
const availableSegments = useMemo(() => {
  if (!selectedAudience) return []
  return getSegmentsForAudience(clothingTaxonomyRegistry, selectedAudience)
}, [selectedAudience])

// Available items for selected audience + segment (with search)
const availableItems = useMemo(() => {
  if (!selectedAudience || !selectedSegment) return []
  let items = CLOTHING_TAXONOMY.filter(...)
  if (itemSearchQuery.trim()) {
    items = items.filter(item => {
      // Search in labelUz, synonymsUz, pathUz
    })
  }
  return items
}, [selectedAudience, selectedSegment, itemSearchQuery])

// Popular items
const popularItems = useMemo(() => {
  return getPopularItems(clothingTaxonomyRegistry)
}, [])

// Step validation
const isStepValid = useCallback((step: number): boolean => {
  switch (step) {
    case 1: return selectedTaxonomy !== null
    case 2: return photos.length >= 1
    case 3: return formData.title.trim().length >= 3 && formData.description.trim().length >= 10
    case 4: return !!formData.price && parsePrice(formData.price) > 0
    case 5: return selectedColors.length > 0 && selectedSizes.length > 0 && ...
    case 6: return true
  }
}, [selectedTaxonomy, photos, formData, selectedColors, selectedSizes, photosByColor])
```

---

## 🤖 AI Integratsiyasi

### Auto-Trigger Logic

**Qachon ishlaydi:**
- Step 2 → Step 3 o'tishda
- `photos.length >= 1`
- `skipAI === false`
- `aiGenerated === false` (bir marta yetarli)
- Internet connection mavjud

**Qachon ishlamaydi:**
- `skipAI === true`
- `photos.length === 0`
- `aiGenerated === true` (allaqachon to'ldirilgan)
- `aiRequestInFlightRef.current === true` (double-trigger protection)

### AI Request Flow

```
User clicks "Keyingi" (Step 2 → Step 3)
  ↓
goNext() called
  ↓
if (currentStep === 2 && nextStep === 3) {
  await generateAIContent()
}
  ↓
generateAIContent()
  ├─ Validation (taxonomy, photos, internet)
  ├─ Double-trigger check
  ├─ Cache check (hash-based)
  ├─ Image optimization (512px, remove prefix)
  ├─ API request (/api/gemini-image-analysis)
  │   ├─ Payload: { category, images, userHint, language }
  │   ├─ Model: gemini-2.0-flash-exp
  │   └─ Timeout: 20s backend
  ├─ Response parsing & validation
  ├─ applyAIData() (merge logic)
  └─ Cache save
  ↓
Step 3 renders with AI data
```

### AI Merge Logic

**Qoida:** AI "overwrite" emas, "merge" qiladi

```typescript
// If user has already filled something, keep it
title: overwrite || !prev.title.trim() ? (aiData.title || prev.title) : prev.title

// If field is empty, fill with AI data
description: overwrite || !prev.description.trim() ? (aiData.description || prev.description) : prev.description

// Condition: only overwrite if default ('yangi')
condition: overwrite || prev.condition === 'yangi' ? (validatedCondition || prev.condition) : prev.condition
```

### AI Metadata

```typescript
_aiMeta: {
  generatedAt: string // ISO timestamp
  model: string // 'gemini-2.0-flash-exp'
  imagesUsed: number // 1-3
  hintUsed: boolean // true if userHint provided
  version: string // '1.0'
}
```

### AI Cache

**Implementation:**
- Hash-based key: `hash(images + taxonomy + hint)`
- TTL: 15 minutes
- Max entries: 10 (LRU)
- Storage: In-memory (`aiCacheRef`)

**Cache Key Generation:**
```typescript
const generateCacheKey = (images: string[], taxonomyId: string, hint: string): string => {
  const imageHash = images.slice(0, 3).map(img => img.substring(0, 100)).join('|')
  const keyString = `${taxonomyId}|${hint}|${imageHash.substring(0, 200)}`
  return simpleHash(keyString) // Simple hash function
}
```

### AI Error Handling

**Error Types:**
1. **Network Error** → "Internet aloqasi yo'q"
2. **Timeout** (15s) → "AI javob olishda vaqt tugadi"
3. **Rate Limit** (429) → "AI hozir band. 1 daqiqadan so'ng qayta urinib ko'ring"
4. **Parse Error** → "AI javobini tahlil qilishda xatolik"
5. **Validation Error** → "AI ma'lumotlari noto'g'ri"

**User Experience:**
- Error banner ko'rsatiladi
- User manual to'ldirishda davom etishi mumkin
- "AI to'ldirish" tugmasi qayta urinish uchun mavjud

---

## 🖼️ Rasm Boshqaruvi

### Image Upload Flow

```
User selects image
  ↓
FileReader.readAsDataURL()
  ↓
setImageToCrop(dataUrl)
  ↓
BannerCropper component
  ├─ User crops image
  └─ handleCroppedImage(croppedUrl)
      ↓
setPhotos([...prev, croppedUrl])
  ↓
On Submit:
  ├─ compressDataUrls(photos, {}, 'listing')
  │   └─ browser-image-compression
  │       ├─ maxWidthOrHeight: 1920
  │       ├─ maxSizeMB: 1
  │       └─ fileType: 'image/jpeg'
  ├─ uploadImages(compressedFiles)
  │   └─ Cloudinary or Supabase Storage
  └─ photoUrls: string[]
```

### Image Compression

**Settings:**
- Max dimension: 1920px
- Max size: 1MB
- Format: JPEG
- Quality: Auto (browser-image-compression)

**Library:** `browser-image-compression`

### Image Upload

**Providers:**
1. **Cloudinary** (primary)
2. **Supabase Storage** (fallback)

**Function:** `uploadImages(files: File[])` → `Promise<string[]>`

### Photos by Color

**Flow:**
```
User selects color in Step 5
  ↓
setCurrentColorForPhoto(color)
  ↓
User uploads photos
  ↓
setPhotosByColor(prev => ({
  ...prev,
  [color]: [...(prev[color] || []), newPhoto]
}))
  ↓
On Submit:
  ├─ Upload main photos
  └─ Upload photos by color (separate)
      └─ uploadedPhotosByColor: Record<string, string[]>
```

**Storage:**
- `attributes.photos_by_color` in database

---

## 💾 Form Submit va Database

### Submit Flow

```
User clicks "E'lonni joylash"
  ↓
handleSubmit()
  ├─ 1. User validation
  │   ├─ Get/create user (if not in context)
  │   ├─ Check title, description, photos
  │   ├─ Check colors, sizes
  │   └─ Check photos by color
  ├─ 2. Image processing
  │   ├─ Compress main photos
  │   ├─ Upload main photos
  │   ├─ Compress photos by color
  │   └─ Upload photos by color
  ├─ 3. Build attributes
  │   ├─ Taxonomy data
  │   ├─ Colors, sizes, stock
  │   ├─ Discount info
  │   └─ Photos by color
  ├─ 4. Create listing
  │   └─ useEntityMutations.create()
  │       ├─ INSERT INTO listings
  │       └─ Return listing_id
  └─ 5. Navigation
      └─ navigate(`/listing/${listing_id}`)
```

### Database Schema

**Table:** `listings`

```sql
CREATE TABLE listings (
  listing_id UUID PRIMARY KEY,
  seller_telegram_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2),
  is_free BOOLEAN DEFAULT false,
  category TEXT NOT NULL, -- 'clothing'
  condition TEXT, -- 'new', 'like_new', 'good', 'fair'
  photos TEXT[], -- Main photos URLs
  status TEXT DEFAULT 'active',
  is_boosted BOOLEAN DEFAULT false,
  attributes JSONB, -- All extra data
  stock_qty INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Attributes Structure

```json
{
  "brand": "Nike",
  "material": "Paxta",
  "colors": ["qora", "oq"],
  "sizes": ["M", "L", "XL"],
  "stock_by_size_color": {
    "M_qora": 5,
    "M_oq": 3,
    "L_qora": 8
  },
  "photos_by_color": {
    "qora": ["url1", "url2"],
    "oq": ["url3", "url4"]
  },
  "price_negotiable": true,
  "discount_available": true,
  "discount_original_price": 600000,
  "discount_reason": "Mavsumiy chegirma",
  "discount_percent": 17,
  "taxonomy": {
    "id": "krossovka",
    "pathUz": "Erkaklar / Oyoq kiyim / Krossovka",
    "audience": "erkaklar",
    "segment": "oyoq_kiyim",
    "labelUz": "Krossovka",
    "audienceUz": "Erkaklar",
    "segmentUz": "Oyoq kiyim",
    "leafUz": "Krossovka"
  },
  "tags": ["krossovka", "sport", "nike"],
  "clothing_type": "Krossovka",
  "_aiMeta": {
    "generatedAt": "2025-01-27T10:30:00Z",
    "model": "gemini-2.0-flash-exp",
    "imagesUsed": 3,
    "hintUsed": true,
    "version": "1.0"
  }
}
```

### useEntityMutations Hook

**Usage:**
```typescript
const { create, isLoading } = useEntityMutations('listing', {
  onSuccess: (listing) => {
    navigate(`/listing/${listing.listing_id}`)
  },
  onError: (err) => {
    setError(err.message)
  }
})
```

**What it does:**
1. Image compression
2. Image upload
3. Database insert
4. Query invalidation (React Query)
5. Error handling
6. Navigation (onSuccess)

---

## 🔗 Integratsiya Nuqtalari

### 1. Routing

**Entry Point:**
```typescript
// src/App.tsx
<Route path="/create-clothing" element={<ClothingListingWizard />} />
```

**Navigation:**
- From: `/` (Home) → Choose Category → `/create-clothing`
- To: `/listing/:id` (after submit)

### 2. User Context

**Dependency:**
```typescript
const { user } = useUser()
```

**Fallback:**
- If `user === null`, fetch/create user in `handleSubmit()`
- Uses `getTelegramUser()` and `createOrUpdateUser()`

### 3. Taxonomy System

**Dependencies:**
- `CLOTHING_TAXONOMY` (taxonomy/clothing.uz.ts)
- `clothingTaxonomyRegistry` (taxonomy/clothingRegistry.ts)
- `buildTagsFromSelection()` (taxonomy/clothing.utils.ts)

**Data Flow:**
```
Taxonomy Selection
  ↓
selectedTaxonomy: TaxonNode
  ↓
buildTagsFromSelection(selectedTaxonomy)
  ↓
attributes.tags: string[]
attributes.taxonomy: {...}
attributes.clothing_type: string
```

### 4. Image Services

**Dependencies:**
- `compressDataUrls()` (lib/imageCompression.ts)
- `uploadImages()` (lib/imageUpload.ts)
- `BannerCropper` (components/BannerCropper.tsx)
- `BannerCreator` (components/BannerCreator.tsx)

### 5. AI Service

**Dependencies:**
- `/api/gemini-image-analysis` (Vercel serverless function)
- `sanitizeText()`, `simpleHash()` (lib/aiUtils.ts)
- `optimizeImageForAI()` (component internal)

### 6. Database

**Dependencies:**
- `useEntityMutations` (hooks/useEntityMutations.ts)
- `createListing()` (lib/supabase.ts)
- `getUser()`, `createOrUpdateUser()` (lib/supabase.ts)

---

## 🎨 Dizayn va UX

### Color Palette

**Background:**
- Gradient: `from-slate-900 via-purple-900 to-slate-900`
- Animated blobs (purple, pink, blue)

**Cards:**
- Surface: `bg-slate-800/60` (lighter, better contrast)
- Border: `border-slate-700/50`
- Hover: `hover:border-purple-400/50 hover:bg-slate-700/60`
- Shadow: `shadow-lg`

**Text:**
- Primary: `text-white`
- Secondary: `text-white/80`
- Tertiary: `text-white/60`
- Disabled: `text-white/40`

**Accent:**
- Purple: `purple-500`, `purple-400`
- Pink: `pink-500`
- Green: `green-500` (success)

### Typography

- Headers: `text-lg font-semibold`
- Body: `text-sm`
- Small: `text-xs`
- Large (price): `text-2xl font-bold`

### Spacing

- Container: `px-4 pb-32`
- Cards: `p-4`, `p-5`, `p-6`
- Gaps: `gap-2`, `gap-3`, `gap-4`

### Animations

- Fade In: `animate-fadeIn`
- Pulse: `animate-pulse` (skeleton loaders)
- Blob: `animate-blob` (background)

### Icons

- **Icons8** (premium, no emoji fallback)
- Sizes: 14px, 16px, 24px, 28px, 32px
- Opacity: `opacity-90`

### Responsive

- Mobile-first design
- Max width: `max-w-lg mx-auto`
- Grid: `grid-cols-2` (mobile)
- Scrollable: `max-h-[50vh] overflow-y-auto`

---

## 📦 Dependencies

### External Libraries

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "@heroicons/react": "^24.x",
  "browser-image-compression": "^2.x"
}
```

### Internal Dependencies

```
src/
├── contexts/UserContext.tsx
├── hooks/useEntityMutations.ts
├── lib/
│   ├── supabase.ts
│   ├── imageUpload.ts
│   ├── imageCompression.ts
│   └── aiUtils.ts
├── taxonomy/
│   ├── clothing.uz.ts
│   ├── clothing.utils.ts
│   └── clothingRegistry.ts
├── components/
│   ├── BannerCropper.tsx
│   ├── BannerCreator.tsx
│   └── Icons8Icon.tsx
└── api/
    └── gemini-image-analysis.ts
```

### Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GEMINI_API_KEY= (server-side)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 🚀 Kelajakdagi Yaxshilanishlar

### Qisqa Muddatli

1. **Image Preview Modal**
   - Full-screen image viewer
   - Swipe gestures
   - Zoom functionality

2. **Draft Saving**
   - Auto-save to localStorage
   - Resume from draft
   - Multiple drafts

3. **Validation Improvements**
   - Real-time validation
   - Field-level error messages
   - Better error UX

4. **Performance**
   - Image lazy loading
   - Virtual scrolling for long lists
   - Code splitting

### Uzoq Muddatli

1. **Multi-Category Support**
   - Avto, Elektronika, etc.
   - Reusable wizard with category-specific configs
   - Taxonomy registry pattern (already implemented)

2. **Advanced AI Features**
   - Price suggestion
   - Tag optimization
   - SEO-friendly descriptions

3. **Analytics**
   - Step completion rates
   - Drop-off points
   - Time to complete
   - AI usage stats

4. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels

5. **Internationalization**
   - Multi-language support
   - Dynamic translations
   - RTL support

---

## 📊 Performance Metrics

### Current Performance

- **Initial Load:** ~2-3s
- **Step Transition:** <100ms
- **AI Generation:** 3-8s (depending on images)
- **Image Upload:** 2-5s per image
- **Form Submit:** 5-10s (with images)

### Optimization Opportunities

1. **Code Splitting**
   - Lazy load BannerCropper
   - Lazy load BannerCreator
   - Split AI utilities

2. **Image Optimization**
   - WebP format
   - Progressive loading
   - Thumbnail generation

3. **Caching**
   - Taxonomy data caching
   - Recent selections (already implemented)
   - AI responses (already implemented)

---

## 🔒 Xavfsizlik

### PII Protection

- **Sanitization:** `sanitizeText()` removes phone numbers, emails, addresses
- **AI Prompt:** Instructs AI not to include PII
- **Validation:** Regex checks for PII patterns

### Input Validation

- **Client-side:** Real-time validation
- **Server-side:** Database constraints
- **Sanitization:** XSS protection

### Error Handling

- **User-friendly messages:** No technical details exposed
- **Logging:** Errors logged server-side
- **Fallbacks:** Graceful degradation

---

## 📝 Xulosa

"Narsa sotaman" qismi **premium, tezkor va ishonchli** kiyim-kechak e'lonlarini yaratish uchun to'liq yechimdir. AI integratsiyasi, rasm boshqaruvi, variant tizimi va premium dizayn bilan foydalanuvchilar oson va tez e'lon yaratishlari mumkin.

**Asosiy Kuchli Tomonlar:**
- ✅ 6 bosqichli wizard (intuitiv)
- ✅ AI auto-fill (tezkor)
- ✅ Premium dizayn (professional)
- ✅ Tez tanlash (UX)
- ✅ Qidiruv (qulay)
- ✅ Data layer separation (scalable)

**Keyingi Qadamlar:**
- Multi-category support
- Performance optimization
- Analytics integration
- Accessibility improvements

---

**Yaratilgan:** 2025-01-27  
**Oxirgi yangilanish:** 2025-01-27  
**Versiya:** 1.0

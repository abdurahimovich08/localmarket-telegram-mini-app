# 🚗 Avtomobil E'lon Joylash Moduli - Yo'l Xaritasi

## 📋 Mavjud Kiyim-Kechak Moduli Tahlili

### Arxitektura Tuzilishi

```
src/
├── taxonomy/
│   ├── clothing.uz.ts          # Taxonomy data (250+ items)
│   ├── clothing.utils.ts       # Utility functions
│   └── clothing.profiles.ts    # Field profiles for leaves
├── schemas/categories/
│   ├── clothing.schema.ts      # Schema definition
│   ├── car.schema.ts           # Mavjud (takomillashtirish kerak)
│   ├── base.ts                 # Base fields
│   ├── types.ts                # Type definitions
│   └── index.ts                # Registry
└── components/
    ├── chat/
    │   └── TaxonomyPicker.tsx  # Taxonomy selector UI
    └── UnifiedReviewForm.tsx    # Dynamic form
```

### Kiyim-Kechak Moduli Elementlari

1. **Taxonomy Data** (`clothing.uz.ts`):
   - `TaxonNode` interface: id, labelUz, synonymsUz, audience, segment, pathUz, leaf
   - Audience → Segment → Leaf ierarxiyasi
   - 250+ leaf item

2. **Taxonomy Utils** (`clothing.utils.ts`):
   - `toSlugUz()` - slug generatsiya
   - `getAudiences()`, `getSegmentsForAudience()`, `getLeaves()`
   - `searchLeaves()` - qidiruv
   - `buildTagsFromSelection()` - tag generatsiya
   - `suggestLeaves()` - tavsiyalar

3. **Schema** (`clothing.schema.ts`):
   - Category-specific fields: brand, sizes, colors, material, delivery, discount
   - Base fields: title, description, price, condition

4. **TaxonomyPicker** (`TaxonomyPicker.tsx`):
   - 3-bosqichli tanlov: Audience → Segment → Leaf
   - Qidiruv, so'nggi tanlovlar, "Bilmayman" wizard

5. **UnifiedReviewForm**:
   - Schema asosida dinamik forma
   - Taxonomy context integratsiyasi
   - AI tag generatsiya
   - Stock by size/color

---

## 🎯 Avtomobil Moduli Uchun Yo'l Xaritasi

### 1-BOSQICH: Taxonomy Data Yaratish
**Fayl:** `src/taxonomy/automotive.uz.ts`

#### Struktura:
```typescript
type VehicleType = 'yengil' | 'yuk' | 'mototsikl' | 'avtobus' | 'traktor' | 'boshqa'
type Segment = 'sedan' | 'suv' | 'hatchback' | 'universal' | 'pickup' | 'minivan' | 'coupe' | 'cabrio'

interface AutoTaxonNode {
  id: string                  // "yengil.chevrolet.malibu"
  labelUz: string             // "Chevrolet Malibu"
  synonymsUz?: string[]       // ["malibu", "shevrolet malibu"]
  vehicleType: VehicleType    // "yengil"
  segment?: Segment           // "sedan"
  brand: string               // "chevrolet"
  model?: string              // "malibu"
  pathUz: string              // "Yengil avtomobil > Chevrolet > Malibu"
  leaf: boolean
  yearRange?: [number, number] // [2016, 2024]
}
```

#### Kontentlar:
- **Yengil avtomobillar:**
  - Chevrolet: Malibu, Spark, Tracker, Lacetti, Gentra, Cobalt, Nexia, Damas, Labo
  - Toyota: Camry, Corolla, RAV4, Land Cruiser, Highlander, Prius
  - Hyundai: Sonata, Elantra, Tucson, Santa Fe, Accent
  - Kia: K5, K3, Sportage, Sorento, Rio
  - Mercedes: E-Class, S-Class, GLE, GLC, A-Class
  - BMW: 3-Series, 5-Series, X5, X3, 7-Series
  - Nissan: Altima, Sentra, X-Trail, Qashqai
  - Honda: Accord, Civic, CR-V, Pilot
  - Volkswagen: Passat, Jetta, Tiguan, Polo
  - Va boshqalar (Lexus, Audi, Mazda, Ford, Lada, Daewoo)

- **Yuk mashinalari:**
  - KAMAZ, MAZ, MAN, Volvo, Scania, DAF, Isuzu, Hino, Shacman

- **Mototsikllar:**
  - Honda, Yamaha, Kawasaki, Suzuki, BMW, Ducati, Harley-Davidson

- **Avtobuslar:**
  - Isuzu, PAZ, Mercedes, Yutong

- **Traktorlar va maxsus texnika:**
  - MTZ, John Deere, Case, New Holland

### 2-BOSQICH: Taxonomy Utils Yaratish
**Fayl:** `src/taxonomy/automotive.utils.ts`

```typescript
// Kerakli funksiyalar:
export function getVehicleTypes(): Array<{ key: VehicleType; label: string }>
export function getBrandsForType(type: VehicleType): Array<{ key: string; label: string }>
export function getModelsForBrand(type: VehicleType, brand: string): AutoTaxonNode[]
export function searchVehicles(query: string, type?: VehicleType): AutoTaxonNode[]
export function buildAutoTagsFromSelection(node: AutoTaxonNode, attributes?: Record<string, any>): string[]
export function suggestVehicles(options: { type?: VehicleType; brand?: string; keyword?: string }): AutoTaxonNode[]
```

### 3-BOSQICH: Field Profiles Yaratish
**Fayl:** `src/taxonomy/automotive.profiles.ts`

```typescript
// Har bir avtomobil turi uchun maxsus maydonlar
export function getAutoFieldProfile(node: AutoTaxonNode): {
  requiredFieldsOverride?: string[]
  suggestedFields?: string[]
} | null

// Masalan:
// Yengil avtomobil: brand, model, year, mileage_km, engine, transmission, fuel_type, condition, price
// Yuk mashina: brand, model, year, mileage_km, payload_capacity, engine, condition, price
// Mototsikl: brand, model, year, mileage_km, engine_cc, condition, price
```

### 4-BOSQICH: Schema Takomillashtirish
**Fayl:** `src/schemas/categories/car.schema.ts`

#### Mavjud maydonlar:
- brand, model, year, mileage_km, engine, transmission, fuel_type, color
- accident_history, credit_available, credit_terms, installment_available, installment_terms

#### Qo'shiladigan maydonlar:
```typescript
const additionalCarFields: FieldSchema[] = [
  {
    key: 'body_type',
    type: 'enum',
    required: false,
    label: 'Kuzov turi',
    enumOptions: ['sedan', 'suv', 'hatchback', 'universal', 'pickup', 'minivan', 'coupe', 'cabrio'],
  },
  {
    key: 'drive_type',
    type: 'enum',
    required: false,
    label: 'Yuritma turi',
    enumOptions: ['front', 'rear', 'all', '4wd'],
  },
  {
    key: 'owners_count',
    type: 'number',
    required: false,
    label: 'Egalar soni',
  },
  {
    key: 'vin',
    type: 'string',
    required: false,
    label: 'VIN raqam',
  },
  {
    key: 'registration_country',
    type: 'string',
    required: false,
    label: 'Ro\'yxatdan o\'tgan mamlakat',
  },
  {
    key: 'customs_cleared',
    type: 'boolean',
    required: false,
    label: 'Rasmiylashtirish (bojxona)',
  },
  {
    key: 'exchange_available',
    type: 'boolean',
    required: false,
    label: 'Almashtirish mumkin',
  },
  {
    key: 'exchange_preferences',
    type: 'string',
    required: false,
    label: 'Almashtirish afzalliklari',
    dependsOn: { field: 'exchange_available', value: true }
  },
  // Yuk mashinalar uchun
  {
    key: 'payload_capacity',
    type: 'number',
    required: false,
    label: 'Yuk ko\'tarish qobiliyati (kg)',
  },
  // Mototsiklar uchun
  {
    key: 'engine_cc',
    type: 'number',
    required: false,
    label: 'Dvigatel hajmi (cc)',
  }
]
```

### 5-BOSQICH: TaxonomyPicker Kengaytirish
**Fayl:** `src/components/chat/AutoTaxonomyPicker.tsx`

#### UI Dizayn:
1. **1-bosqich: Transport turi** - katta kartochkalar
   - 🚗 Yengil avtomobil
   - 🚛 Yuk mashina
   - 🏍️ Mototsikl
   - 🚌 Avtobus
   - 🚜 Traktor
   - 📦 Boshqa

2. **2-bosqich: Brend tanlash** - logo bilan ro'yxat
   - Mashhur brendlar (Chevrolet, Toyota, Hyundai, Kia)
   - Barcha brendlar (alifbo tartibida)
   - Qidiruv

3. **3-bosqich: Model tanlash** - ro'yxat
   - Modellar yillar bo'yicha
   - Qidiruv

4. **Qo'shimcha imkoniyatlar:**
   - So'nggi tanlovlar
   - "Bilmayman" wizard
   - Tez qidiruv

### 6-BOSQICH: UnifiedReviewForm Integratsiya
**Fayl:** `src/components/UnifiedReviewForm.tsx`

#### O'zgarishlar:
```typescript
// Automotive uchun maxsus bo'limlar qo'shish
const sections = [
  { key: 'title', label: 'Avtomobil', icon: '🚗' },
  { key: 'description', label: 'Tavsif', icon: '📄' },
  { key: 'specs', label: 'Texnik ma\'lumotlar', icon: '⚙️' },
  { key: 'price', label: 'Narx', icon: '💰' },
  { key: 'condition', label: 'Holati', icon: '✨' },
  { key: 'history', label: 'Tarix', icon: '📋' },
  { key: 'location', label: 'Joylashuv', icon: '📍' },
  { key: 'payment', label: 'To\'lov', icon: '💳' },
]

// Texnik ma'lumotlar bo'limi
{schema.category === 'automotive' && (
  <div className="bg-white rounded-lg shadow-sm">
    <button onClick={() => toggleSection('specs')} className="...">
      <span>⚙️ Texnik ma'lumotlar</span>
    </button>
    {expandedSections.specs && (
      <div className="p-5 space-y-4">
        {/* Dvigatel */}
        {/* Uzatmalar qutisi */}
        {/* Yoqilg'i turi */}
        {/* Yuritma turi */}
        {/* Yurgan masofa */}
      </div>
    )}
  </div>
)}
```

### 7-BOSQICH: ListingDetail Integratsiya
**Fayl:** `src/pages/ListingDetail.tsx`

#### Avtomobil uchun ko'rsatish:
- Brend + Model + Yil sarlavhada
- Texnik xususiyatlar ro'yxati
- Avariya tarixi ko'rsatilishi
- Kredit/bo'lib to'lash badge'lari
- Almashtirish imkoniyati

### 8-BOSQICH: AI Tag Generatsiya
**Fayl:** `api/generate-auto-tags.ts`

```typescript
// Avtomobil uchun AI tag generatsiya
// Input: brand, model, year, fuel_type, body_type, drive_type
// Output: [brand, model, year, fuel, body, uzbek tags]
```

---

## 📁 Yaratilishi Kerak Bo'lgan Fayllar

| # | Fayl | Vazifa | Holat |
|---|------|--------|-------|
| 1 | `src/taxonomy/automotive.uz.ts` | Taxonomy data | ⏳ Kutilmoqda |
| 2 | `src/taxonomy/automotive.utils.ts` | Utility funksiyalar | ⏳ Kutilmoqda |
| 3 | `src/taxonomy/automotive.profiles.ts` | Field profiles | ⏳ Kutilmoqda |
| 4 | `src/components/chat/AutoTaxonomyPicker.tsx` | Taxonomy picker UI | ⏳ Kutilmoqda |
| 5 | `api/generate-auto-tags.ts` | AI tag generatsiya | ⏳ Kutilmoqda |

## 📝 O'zgartirilishi Kerak Bo'lgan Fayllar

| # | Fayl | O'zgarish | Holat |
|---|------|-----------|-------|
| 1 | `src/schemas/categories/car.schema.ts` | Yangi maydonlar qo'shish | ⏳ Kutilmoqda |
| 2 | `src/schemas/categories/index.ts` | Auto taxonomy registry | ⏳ Kutilmoqda |
| 3 | `src/components/UnifiedReviewForm.tsx` | Automotive sections | ⏳ Kutilmoqda |
| 4 | `src/pages/ListingDetail.tsx` | Auto ma'lumotlar ko'rsatish | ⏳ Kutilmoqda |
| 5 | `src/pages/CreateListing.tsx` | Auto taxonomy picker integratsiya | ⏳ Kutilmoqda |

---

## 🚀 Bosqichma-Bosqich Amalga Oshirish

### FAZA 1: Asos (1-3 kunlik ish)
1. ✅ Taxonomy data yaratish (`automotive.uz.ts`)
2. ✅ Utility funksiyalar (`automotive.utils.ts`)
3. ✅ Field profiles (`automotive.profiles.ts`)

### FAZA 2: UI Komponentlar (2-3 kunlik ish)
4. ✅ AutoTaxonomyPicker komponenti
5. ✅ Schema takomillashtirish

### FAZA 3: Integratsiya (2-3 kunlik ish)
6. ✅ UnifiedReviewForm integratsiya
7. ✅ ListingDetail integratsiya
8. ✅ CreateListing integratsiya

### FAZA 4: AI va Polish (1-2 kunlik ish)
9. ✅ AI tag generatsiya
10. ✅ Test va debug

---

## ❓ Sizdan So'raladigan Savollar

1. **Brendlar ro'yxati:** Qaysi brendlarni qo'shish kerak? (men yuqorida umumiy ro'yxat berdim)

2. **Modellar chuqurligi:** Har bir brend uchun barcha modellarni qo'shamizmi yoki faqat mashhurlarini?

3. **Maxsus maydonlar:**
   - Yuk mashinalari uchun: yuk ko'tarish qobiliyati, kuzov uzunligi
   - Mototsikllar uchun: dvigatel cc, turi (sport, chopper, enduro)
   - Boshqa kerakli maydonlar bormi?

4. **Kredit/Bo'lib to'lash:** Bu maydonlarni qoldiramizmi yoki o'zgartiramizmi?

5. **Almashtirish:** Avtomobil almashtirishni qo'shamizmi?

6. **VIN tekshiruvi:** VIN raqam kiritish va avtomatik tekshiruvni qo'shamizmi?

7. **Narx kalkulyatori:** Narxni avtomatik hisoblash (bozor narxi asosida) qo'shamizmi?

---

## 📌 Eslatmalar

- Kiyim-kechak modulidagi barcha yaxshi amaliyotlar saqlanadi
- Taxonomy picker umumiy komponent bo'lib, har ikkala kategoriya uchun ishlaydi
- Database schema o'zgarmaydi (attributes JSONB'da saqlanadi)
- Condition mapping (yangi → new) mavjud va ishlaydi

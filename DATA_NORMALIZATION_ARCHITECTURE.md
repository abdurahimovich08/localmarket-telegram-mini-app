# 🏗️ Data Normalization Architecture

## 🎯 ASOSIY MUAMMO

1. **AI ma'lumotlarni qanday tartibda oladi?** (taxonomy + schema + field profile)
2. **Bazaga qanday saqlaydi?** (RAW + NORMALIZED + CANONICAL 3 qatlam)
3. **Imlo xatolarini qanday boshqaradi?** (AI to'g'rilamaydi, alohida qatlamga ajratadi)
4. **Qidiruv va teg muammosi** (brand_id bilan ishlaydi)

---

## 🧠 ASOSIY KONSEPSIYA

### ❌ NOTO'G'RI (Hozirgi holat)
```json
{
  "brand": "NIIIKE"  // User yozgani to'g'ridan-to'g'ri saqlanadi
}
```

### ✅ TO'G'RI (3 qatlamli arxitektura)
```json
{
  "brand_raw": "Нииике",           // 1. RAW - user yozgani
  "brand_norm": "niike",           // 2. NORMALIZED - tozalangan
  "brand_id": "brand_000123",      // 3. CANONICAL - platforma bilgan haqiqat
  "brand_display": "Nike",         // Display uchun
  "brand_confidence": 0.78         // AI ishonch darajasi
}
```

### 🔐 ENG MUHIM QOIDA

**USER YOZADI — PLATFORMA TUSHUNADI**

- User input = RAW
- Platform data = CANONICAL
- AI = COLLECTOR, emas WRITER

---

## 1️⃣ AI MA'LUMOTLARNI QANDAY TARTIBDA OLADI?

### Schema-Driven Question Order

**Misol: Kiyim (Erkaklar → Sport → Fitness kiyim)**

```typescript
// Field Profile (clothing.profiles.ts)
{
  requiredFields: ["brand", "condition", "price", "sizes"],
  suggestedFields: [
    "country_of_origin",
    "stock_qty",
    "discount",
    "delivery_available",
    "delivery_days",
    "payment_methods",
    "description"
  ]
}
```

**AI Savol Tartibi:**

1. **Identifikatsiya qiluvchi** (search uchun)
   - Brend
   - Agar bilmasa → ishlab chiqaruvchi davlat

2. **Savdo parametrlari**
   - Narxi
   - Aksiya bormi
   - Stock

3. **Logistika**
   - Yetkazib berish
   - Necha kunda
   - To'lov usuli

4. **Holat + tavsif**
   - Holati
   - Description

### Misol: Uy (Real Estate)

```typescript
{
  requiredFields: ["rooms", "area_sqm", "price"],
  conditionalFields: {
    credit_available: ["down_payment", "monthly_payment"],
    installment_available: ["initial_payment", "monthly_payment"]
  }
}
```

**AI Oqimi:**
1. Necha xonali?
2. Maydoni (m²)?
3. Narxi?
4. Kreditga bormi?
   - Ha → dastlabki to'lov → oyiga qancha
5. Bo'lib to'lash?
6. Parkovka?
7. Qurib bitganmi?

---

## 2️⃣ AI BAZAGA QANDAY SAQLAYDI (ENG MUHIM JOY)

### 3 Qatlamli Arxitektura

#### Qatlam 1: RAW (User Input)
```json
{
  "brand_raw": "Нииике",
  "country_raw": "Россия",
  "price_raw": "500 000 so'm"
}
```

**Xususiyatlar:**
- User yozgani to'g'ridan-to'g'ri
- Hech qanday o'zgartirish yo'q
- Audit trail uchun
- Admin review uchun

#### Qatlam 2: NORMALIZED (Tozalangan)
```json
{
  "brand_norm": "niike",
  "country_norm": "russia",
  "price_norm": 500000
}
```

**Xususiyatlar:**
- Lowercase
- Trim whitespace
- Remove special chars (faqat a-z, 0-9, -)
- Number conversion
- Date normalization

#### Qatlam 3: CANONICAL (Platforma Bilgan Haqiqat)
```json
{
  "brand_id": "brand_000123",
  "brand_display": "Nike",
  "country_id": "country_001",
  "country_display": "Rossiya",
  "price": 500000,
  "currency": "UZS"
}
```

**Xususiyatlar:**
- Entity-based (brand_id, country_id)
- Platforma bilgan haqiqat
- Search, filter, recommendation uchun
- Multi-language support

### Database Schema Extension

```sql
-- Add normalization columns to attributes JSONB
-- Example structure:
{
  "brand_raw": "Нииике",
  "brand_norm": "niike",
  "brand_id": "brand_000123",
  "brand_display": "Nike",
  "brand_confidence": 0.78,
  
  "country_raw": "Россия",
  "country_norm": "russia",
  "country_id": "country_001",
  "country_display": "Rossiya",
  
  "price": 500000,
  "currency": "UZS"
}
```

---

## 3️⃣ QIDIRUV VA TEG MUAMMOSI BUTUNLAY YO'QOLADI

### Search Logic

**Eski (noto'g'ri):**
```sql
WHERE attributes->>'brand' ILIKE '%nike%'
-- "NIIIKE" topilmaydi
-- "найк" topilmaydi
```

**Yangi (to'g'ri):**
```sql
WHERE attributes->>'brand_id' = 'brand_000123'
-- Barcha variantlar topiladi:
-- "nike", "NIIIKE", "найк", "nayk", "niike"
```

### Tag System

**Eski:**
```json
{
  "tags": ["nike", "sport", "fitness"]
}
-- "NIIIKE" tag qo'shilmaydi
```

**Yangi:**
```json
{
  "tags": ["brand_000123", "sport", "fitness"],
  "tags_display": ["Nike", "Sport", "Fitness"]
}
-- brand_id orqali ishlaydi
```

---

## 4️⃣ AI IMLO XATOLARINI QANDAY BOSHQARADI?

### AI Behavior

**❌ NOTO'G'RI:**
```typescript
// AI to'g'rilab yubormaydi
user: "nIIIkE"
ai: "Siz Nike deb yozdingizmi?" // ❌
```

**✅ TO'G'RI:**
```typescript
// AI alohida qatlamga ajratadi
user: "Bu nIIIkE sport kiyimi"
ai: {
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": "brand_000123",  // AI confidence bilan
  "brand_confidence": 0.78
}
```

### Confidence Levels

- **0.9-1.0**: Yuqori ishonch (avtomatik qabul)
- **0.7-0.9**: O'rtacha ishonch (user confirmation)
- **< 0.7**: Past ishonch (admin review)

---

## 5️⃣ IMPLEMENTATION PLAN

### Phase 1: Core Infrastructure

#### 1.1 Normalization Service
**File**: `src/services/DataNormalization.ts`

```typescript
export interface NormalizedField {
  raw: string
  norm: string
  canonical_id?: string
  display?: string
  confidence?: number
}

export function normalizeBrand(input: string): NormalizedField
export function normalizeCountry(input: string): NormalizedField
export function normalizePrice(input: string): NormalizedField
```

#### 1.2 Canonical Entity Service
**File**: `src/services/CanonicalEntities.ts`

```typescript
// Brand database
export interface Brand {
  id: string  // "brand_000123"
  display_uz: string
  display_ru: string
  display_en: string
  aliases: string[]  // ["nike", "найк", "nayk"]
  category: string
}

export async function findBrand(normalized: string): Promise<Brand | null>
export async function createBrand(raw: string): Promise<Brand>
```

#### 1.3 AI Integration
**File**: `src/services/UnifiedGeminiService.ts`

```typescript
// AI output format
{
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": "brand_000123",  // AI confidence bilan
  "brand_confidence": 0.78
}
```

### Phase 2: Database Schema

#### 2.1 Canonical Entities Tables

```sql
-- Brands table
CREATE TABLE brands (
  id VARCHAR(50) PRIMARY KEY,  -- "brand_000123"
  display_uz VARCHAR(100),
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[],  -- ["nike", "найк", "nayk"]
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Countries table
CREATE TABLE countries (
  id VARCHAR(50) PRIMARY KEY,  -- "country_001"
  display_uz VARCHAR(100),
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[],
  code VARCHAR(3)  -- ISO code
);

-- Indexes
CREATE INDEX idx_brands_aliases ON brands USING GIN(aliases);
CREATE INDEX idx_brands_category ON brands(category);
```

#### 2.2 Attributes JSONB Structure

```json
{
  "brand_raw": "Нииике",
  "brand_norm": "niike",
  "brand_id": "brand_000123",
  "brand_display": "Nike",
  "brand_confidence": 0.78,
  
  "country_raw": "Россия",
  "country_norm": "russia",
  "country_id": "country_001",
  "country_display": "Rossiya",
  
  "price": 500000,
  "currency": "UZS"
}
```

### Phase 3: AI Prompt Updates

#### 3.1 Field Extraction Instructions

```typescript
// src/services/UnifiedGeminiService.ts

const fieldExtractionInstructions = `
MA'LUMOTLARNI 3 QATLAMDA QAYTARING:

1. RAW: User yozgani to'g'ridan-to'g'ri
2. NORMALIZED: Tozalangan (lowercase, trim)
3. CANONICAL: Platforma bilgan haqiqat (entity ID)

Misol:
User: "Bu nIIIkE sport kiyimi"

Siz qaytarasiz:
{
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": "brand_000123",  // Agar topilsa
  "brand_display": "Nike",
  "brand_confidence": 0.85
}

Agar brand topilmasa:
{
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": null,
  "brand_confidence": 0.3
}
`
```

### Phase 4: Search & Filter Updates

#### 4.1 Search Service

```typescript
// src/services/SearchService.ts

export async function searchByBrand(brandQuery: string) {
  // 1. Normalize query
  const normalized = normalizeBrand(brandQuery).norm
  
  // 2. Find canonical brand
  const brand = await findBrand(normalized)
  
  // 3. Search by brand_id
  if (brand) {
    return await supabase
      .from('listings')
      .select('*')
      .eq("attributes->>'brand_id'", brand.id)
  }
  
  // 4. Fallback: search by normalized
  return await supabase
    .from('listings')
    .select('*')
    .ilike("attributes->>'brand_norm'", `%${normalized}%`)
}
```

---

## 6️⃣ CATEGORY-SPECIFIC EXAMPLES

### Kiyim (Clothing)

```json
{
  "brand_raw": "Нииике",
  "brand_norm": "niike",
  "brand_id": "brand_000123",
  "brand_display": "Nike",
  
  "country_raw": "Россия",
  "country_norm": "russia",
  "country_id": "country_001",
  "country_display": "Rossiya",
  
  "condition": "yangi",
  "sizes": ["M", "L", "XL"],
  "price": 500000,
  "currency": "UZS",
  "stock_qty": 10,
  "delivery_available": true,
  "delivery_days": 3
}
```

### Uy (Real Estate)

```json
{
  "rooms_raw": "3 xona",
  "rooms": 3,
  
  "area_raw": "80 m²",
  "area_sqm": 80,
  
  "price": 500000000,
  "currency": "UZS",
  
  "credit_available": true,
  "down_payment": 100000000,
  "monthly_payment": 5000000,
  
  "parking_available": true,
  "construction_status": "qurib_bitgan"
}
```

### Avtomobil (Car)

```json
{
  "brand_raw": "Тойота",
  "brand_norm": "toyota",
  "brand_id": "brand_000456",
  "brand_display": "Toyota",
  
  "model_raw": "Камири",
  "model_norm": "camry",
  "model_id": "model_000789",
  "model_display": "Camry",
  
  "year": 2020,
  "mileage_km": 50000,
  "condition": "yaxshi",
  "price": 250000000
}
```

---

## 7️⃣ TIMELINE

### Week 1-2: Core Infrastructure
- Normalization service
- Canonical entities service
- Database schema

### Week 3-4: AI Integration
- AI prompt updates
- Field extraction logic
- Confidence scoring

### Week 5-6: Search & Filter
- Search service updates
- Filter logic
- Tag system

### Week 7-8: Testing & Polish
- End-to-end testing
- Performance optimization
- Admin tools

---

## 8️⃣ SUCCESS METRICS

### Data Quality
- **Normalization Rate**: > 95%
- **Canonical Match Rate**: > 80%
- **Confidence Score**: Average > 0.85

### Search Quality
- **Search Success Rate**: > 90%
- **False Positive Rate**: < 5%
- **Response Time**: < 100ms

### User Experience
- **Data Entry Time**: -30%
- **Search Accuracy**: +40%
- **Recommendation Relevance**: +50%

---

## 🧠 XULOSA

✅ **HA** — yuqoridagi arxitektura:

- ✔ AI ma'lumotlarni to'g'ri tartibda yig'adi
- ✔ Bazaga search-ready holatda saqlaydi
- ✔ Imlo, til, klaviatura muammolarini yo'q qiladi
- ✔ Millionlab mahsulotga scale bo'ladi
- ✔ Kelajak recommendation va analytics'ni ochadi

**Bu yechim hamma kategoriyaga ishlaydi:**
- ✅ Kiyim
- ✅ Uy
- ✅ Avtomobil
- ✅ Elektronika
- ✅ Xizmat
- ✅ Kelajakdagi har qanday kategoriya

**Sababi:**
- Schema-driven
- Entity-based
- Language-agnostic
- Self-healing

---

**Last Updated**: 2024 Q4

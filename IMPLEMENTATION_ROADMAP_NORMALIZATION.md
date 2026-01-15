# 🗺️ Data Normalization - Implementation Roadmap

## 📋 STEP-BY-STEP IMPLEMENTATION PLAN

### STEP 1: Core Normalization Service

**File**: `src/services/DataNormalization.ts`

**Functions:**
- `normalizeText(input: string): string` - Basic normalization
- `normalizeBrand(input: string): NormalizedField`
- `normalizeCountry(input: string): NormalizedField`
- `normalizePrice(input: string): number`
- `normalizeNumber(input: string): number`

**Implementation:**
```typescript
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ')           // Multiple spaces to one
}

export function normalizeBrand(input: string): string {
  return normalizeText(input)
    .replace(/\s+/g, '')  // Remove spaces for brands
}
```

---

### STEP 2: Canonical Entities Database

**Migration**: `database/add_canonical_entities.sql`

**Tables:**
- `brands` - Brand entities
- `countries` - Country entities
- `car_brands` - Car brand entities
- `car_models` - Car model entities

**Structure:**
```sql
CREATE TABLE brands (
  id VARCHAR(50) PRIMARY KEY,
  display_uz VARCHAR(100),
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[],
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brands_aliases ON brands USING GIN(aliases);
```

---

### STEP 3: Canonical Entity Service

**File**: `src/services/CanonicalEntities.ts`

**Functions:**
- `findBrand(normalized: string): Promise<Brand | null>`
- `findCountry(normalized: string): Promise<Country | null>`
- `createBrand(raw: string): Promise<Brand>`
- `matchEntity(normalized: string, entityType: 'brand' | 'country'): Promise<EntityMatch>`

**Implementation:**
```typescript
export async function findBrand(normalized: string): Promise<Brand | null> {
  const { data } = await supabase
    .from('brands')
    .select('*')
    .contains('aliases', [normalized])
    .single()
  
  return data || null
}
```

---

### STEP 4: AI Integration - Field Extraction

**File**: `src/services/UnifiedGeminiService.ts`

**Changes:**
1. Update system prompt to include 3-layer extraction
2. Add field extraction examples
3. Add confidence scoring logic

**Prompt Addition:**
```
MA'LUMOTLARNI 3 QATLAMDA QAYTARING:
1. RAW: User yozgani
2. NORMALIZED: Tozalangan
3. CANONICAL: Entity ID (agar topilsa)

Misol:
{
  "brand_raw": "nIIIkE",
  "brand_norm": "niike",
  "brand_id": "brand_000123",
  "brand_display": "Nike",
  "brand_confidence": 0.85
}
```

---

### STEP 5: Post-Processing Service

**File**: `src/services/DataPostProcessing.ts`

**Functions:**
- `processAIOutput(aiOutput: any, category: string): ProcessedData`
- `enrichWithCanonical(normalized: NormalizedField): EnrichedField`
- `calculateConfidence(match: EntityMatch): number`

**Flow:**
1. AI returns raw + normalized
2. Post-processing finds canonical entities
3. Confidence calculated
4. Final data structure created

---

### STEP 6: Schema Updates

**File**: `src/schemas/categories/types.ts`

**Add to FieldSchema:**
```typescript
interface FieldSchema {
  // ... existing fields
  normalization?: {
    type: 'brand' | 'country' | 'number' | 'text'
    entityTable?: string
    aliases?: string[]
  }
}
```

---

### STEP 7: Search Service Updates

**File**: `src/services/SearchService.ts`

**Changes:**
- Search by `brand_id` instead of `brand`
- Fallback to `brand_norm` if no canonical match
- Multi-language search support

---

### STEP 8: Tag System Updates

**File**: `src/lib/tagUtils.ts`

**Changes:**
- Tags use entity IDs: `["brand_000123", "sport"]`
- Display tags: `["Nike", "Sport"]`
- Search by entity ID

---

## 🎯 PRIORITY ORDER

### Phase 1: MVP (Week 1-2)
1. ✅ Normalization service (basic)
2. ✅ Brands table + service
3. ✅ AI prompt updates
4. ✅ Post-processing for brands

### Phase 2: Core Features (Week 3-4)
5. ✅ Countries table + service
6. ✅ Confidence scoring
7. ✅ Search updates
8. ✅ Tag system updates

### Phase 3: Advanced (Week 5-6)
9. ✅ Car brands/models
10. ✅ Admin tools
11. ✅ Auto-approval for high confidence
12. ✅ Analytics

---

## 📊 TESTING CHECKLIST

### Unit Tests
- [ ] Normalization functions
- [ ] Canonical entity matching
- [ ] Confidence calculation
- [ ] Post-processing logic

### Integration Tests
- [ ] AI → Post-processing → Database flow
- [ ] Search by brand_id
- [ ] Search by brand_norm (fallback)
- [ ] Tag generation

### E2E Tests
- [ ] User creates listing with "NIIIKE"
- [ ] Search for "nike" finds it
- [ ] Search for "найк" finds it
- [ ] Recommendation shows similar items

---

## 🚀 DEPLOYMENT STRATEGY

### Step 1: Database Migration
- Create canonical entities tables
- Migrate existing data (if any)

### Step 2: Service Deployment
- Deploy normalization service
- Deploy canonical entity service

### Step 3: AI Updates
- Update AI prompts
- Test with sample data

### Step 4: Search Updates
- Update search logic
- Test search accuracy

### Step 5: Monitoring
- Track normalization rate
- Track canonical match rate
- Track search success rate

---

**Last Updated**: 2024 Q4

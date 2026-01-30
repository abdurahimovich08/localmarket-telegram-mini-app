# 🎯 Wizard Refactoring - To'liq Reja

**Maqsad:** 2106 qatorli monolitni scalable, maintainable arxitekturaga aylantirish

---

## 📊 Hozirgi Holat Analizi

### Muammolar

1. **Monolit Komponent (2106 lines)**
   - Bug topish: 30+ min
   - Code review: 2+ soat
   - Test qilish: deyarli imkonsiz
   - Yangi kategoriya: 3-5 kun

2. **DB Schema Issues**
   - `condition` TEXT (UI/DB mismatch)
   - Hammasi `attributes` JSONB'da
   - Filtering qiyin
   - Performance past

3. **Media Pipeline**
   - Cloudinary/Supabase inconsistency
   - Duplicate uploads
   - Cleanup qiyin

4. **No Draft Saving**
   - Conversion past
   - User retention yo'q

---

## ✅ 6 Ta Yechim

### 1. Component Refactoring (Vertical Slices)

**Yaratiladigan:**
```
src/components/wizard/
├── steps/
│   ├── Step1Taxonomy.tsx
│   ├── Step2Photos.tsx
│   ├── Step3Details.tsx
│   ├── Step4Price.tsx
│   ├── Step5Variants.tsx
│   └── Step6Publish.tsx
├── WizardHeader.tsx
└── WizardFooter.tsx
```

**Interface:**
```typescript
interface StepProps {
  // State
  formData: FormData
  selectedTaxonomy: TaxonNode | null
  photos: string[]
  // ... other state
  
  // Actions
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  setSelectedTaxonomy: (taxonomy: TaxonNode | null) => void
  // ... other actions
  
  // Navigation
  onNext: () => void
  onBack: () => void
  isValid: boolean
}
```

**Faydalar:**
- Main component: 2106 → ~400 lines
- Har bir step: < 300 lines
- Test qilish: oson
- Code review: < 30 min

---

### 2. Universal Wizard Architecture

**Yaratiladigan:**
```
src/wizards/
├── categoryWizards/
│   ├── clothingWizard.ts
│   ├── autoWizard.ts (future)
│   └── electronicsWizard.ts (future)
├── UniversalListingWizard.tsx
└── types.ts
```

**Config Pattern:**
```typescript
// clothingWizard.ts
export const clothingWizardConfig: WizardConfig = {
  category: 'clothing',
  steps: [
    {
      id: 1,
      key: 'taxonomy',
      title: 'Kategoriya',
      component: Step1Taxonomy,
      validation: (data) => data.selectedTaxonomy !== null
    },
    // ... other steps
  ],
  validations: {
    step1: (data) => data.selectedTaxonomy !== null,
    step2: (data) => data.photos.length >= 1,
    // ...
  },
  attributeBuilder: (data) => ({
    brand: data.brand,
    material: data.material,
    taxonomy: data.taxonomy,
    // ...
  }),
  aiContext: {
    endpoint: '/api/gemini-image-analysis',
    model: 'gemini-2.0-flash-exp'
  }
}
```

**Routing:**
```typescript
// App.tsx
<Route path="/create/:category" element={<UniversalListingWizard />} />

// UniversalListingWizard.tsx
const { category } = useParams()
const config = getWizardConfig(category) // clothingWizardConfig, autoWizardConfig, etc.
```

**Faydalar:**
- Yangi kategoriya: 1 kun (faqat config)
- Code reuse: 80%+
- Consistent UX

---

### 3. DB Schema Improvements

**Migration:**
```sql
-- 1. Add condition_code
ALTER TABLE listings 
ADD COLUMN condition_code TEXT CHECK (condition_code IN ('new', 'like_new', 'good', 'fair'));

-- 2. Migrate existing data
UPDATE listings 
SET condition_code = CASE 
  WHEN condition = 'new' THEN 'new'
  WHEN condition = 'like_new' THEN 'like_new'
  WHEN condition = 'good' THEN 'good'
  WHEN condition = 'fair' THEN 'fair'
  ELSE 'good'
END;

-- 3. Make NOT NULL
ALTER TABLE listings 
ALTER COLUMN condition_code SET NOT NULL;

-- 4. Add core fields
ALTER TABLE listings
ADD COLUMN brand TEXT,
ADD COLUMN material TEXT,
ADD COLUMN taxonomy_id TEXT,
ADD COLUMN audience TEXT,
ADD COLUMN segment TEXT,
ADD COLUMN colors TEXT[],
ADD COLUMN sizes TEXT[];

-- 5. Indexes
CREATE INDEX idx_listings_brand ON listings(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_listings_taxonomy_id ON listings(taxonomy_id) WHERE taxonomy_id IS NOT NULL;
CREATE INDEX idx_listings_condition_code ON listings(condition_code);
CREATE INDEX idx_listings_colors ON listings USING GIN(colors);
CREATE INDEX idx_listings_sizes ON listings USING GIN(sizes);
```

**Code Changes:**
```typescript
// Before
condition: conditionMap[formData.condition] || 'good'

// After
condition_code: CONDITION_MAP[formData.condition] || 'good',
brand: formData.brand || null,
material: formData.material || null,
taxonomy_id: selectedTaxonomy?.id || null,
audience: selectedTaxonomy?.audience || null,
segment: selectedTaxonomy?.segment || null,
colors: selectedColors,
sizes: selectedSizes,
```

**Faydalar:**
- Fast filtering (50%+ improvement)
- Clean analytics
- Type safety
- No UI/DB mismatch

---

### 4. Attributes JSONB Optimization

**Strategy:**
- **Core fields** (kolonka): brand, material, taxonomy_id, colors, sizes
- **JSONB** (flexible): stock_by_size_color, photos_by_color, discount_meta, _aiMeta

**Before:**
```json
{
  "brand": "Nike",
  "material": "Paxta",
  "colors": ["qora", "oq"],
  "sizes": ["M", "L"],
  "stock_by_size_color": {...},
  "photos_by_color": {...}
}
```

**After:**
```sql
-- Core fields (indexed)
brand TEXT,
material TEXT,
colors TEXT[],
sizes TEXT[],

-- JSONB (flexible)
attributes JSONB = {
  "stock_by_size_color": {...},
  "photos_by_color": {...},
  "discount_meta": {...},
  "_aiMeta": {...}
}
```

**Faydalar:**
- Query performance: 50%+ improvement
- Easy filtering
- Flexible data preserved

---

### 5. Media Pipeline Consistency

**Implementation:**
```typescript
// lib/mediaUpload.ts
interface UploadSession {
  sessionId: string
  provider: 'cloudinary' | 'supabase'
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  files: UploadFile[]
  createdAt: string
  completedAt: string | null
}

async function uploadWithSession(
  files: File[],
  sessionId: string = generateSessionId()
): Promise<UploadSession> {
  const session: UploadSession = {
    sessionId,
    provider: 'cloudinary',
    status: 'uploading',
    files: files.map(f => ({ originalName: f.name, url: null, provider: null })),
    createdAt: new Date().toISOString(),
    completedAt: null
  }
  
  try {
    // Primary: Cloudinary
    const urls = await uploadToCloudinary(files)
    session.status = 'completed'
    session.completedAt = new Date().toISOString()
    session.files = files.map((f, i) => ({
      originalName: f.name,
      url: urls[i],
      provider: 'cloudinary'
    }))
    return session
  } catch (error) {
    // Fallback: Supabase
    try {
      const urls = await uploadToSupabase(files)
      session.provider = 'supabase'
      session.status = 'completed'
      session.completedAt = new Date().toISOString()
      session.files = files.map((f, i) => ({
        originalName: f.name,
        url: urls[i],
        provider: 'supabase'
      }))
      return session
    } catch (fallbackError) {
      session.status = 'failed'
      throw fallbackError
    }
  }
}
```

**Database (Optional):**
```sql
CREATE TABLE upload_sessions (
  session_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  files JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**Faydalar:**
- Single source of truth
- No duplicates
- Retry mechanism
- Cleanup tracking

---

### 6. Draft Saving

**Implementation:**
```typescript
// hooks/useDraftSaving.ts
export function useDraftSaving(
  category: string,
  formData: any,
  debounceMs: number = 500
) {
  const draftKey = `wizard_draft_${category}`
  
  // Auto-save on change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const draft = {
          formData,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
        localStorage.setItem(draftKey, JSON.stringify(draft))
      } catch (error) {
        console.warn('Failed to save draft:', error)
      }
    }, debounceMs)
    
    return () => clearTimeout(timeoutId)
  }, [formData, draftKey, debounceMs])
  
  const loadDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        const draft = JSON.parse(stored)
        const draftAge = Date.now() - new Date(draft.timestamp).getTime()
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        if (draftAge < maxAge) {
          return draft.formData
        }
      }
    } catch (error) {
      console.warn('Failed to load draft:', error)
    }
    return null
  }, [draftKey])
  
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('Failed to clear draft:', error)
    }
  }, [draftKey])
  
  return { loadDraft, clearDraft }
}
```

**Resume Modal:**
```typescript
// components/DraftResumeModal.tsx
export function DraftResumeModal({ onResume, onDiscard }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-sm mx-4">
        <h3 className="text-white font-semibold mb-2">Draft topildi</h3>
        <p className="text-white/60 text-sm mb-4">
          Oldingi e'lon yarim tashlab ketilgan. Davom etasizmi?
        </p>
        <div className="flex gap-3">
          <button onClick={onResume} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg">
            Davom etish
          </button>
          <button onClick={onDiscard} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg">
            Yangi boshlash
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Faydalar:**
- Conversion: +20-30%
- User retention
- Better UX
- No data loss

---

## 📅 Implementation Plan

### Week 1: Component Refactoring
- **Day 1-2:** Step components (Step1-6)
- **Day 3:** WizardHeader, WizardFooter
- **Day 4:** Update main component
- **Day 5:** Testing & bug fixes

### Week 2: Architecture & DB
- **Day 1-2:** Universal wizard architecture
- **Day 3:** DB schema migration
- **Day 4:** Media pipeline
- **Day 5:** Draft saving

---

## ✅ Success Criteria

- [ ] Main component < 500 lines
- [ ] Each step < 300 lines
- [ ] Test coverage > 70%
- [ ] Code review < 30 min
- [ ] New category < 1 day
- [ ] Query performance +50%
- [ ] Conversion +20%

---

## 🚀 Keyingi Qadamlar

1. **Step 1:** Component refactoring (vertical slices)
2. **Step 2:** Universal wizard architecture
3. **Step 3:** DB schema migration
4. **Step 4:** Media pipeline consistency
5. **Step 5:** Draft saving

**Barcha dokumentlar:**
- `WIZARD_REFACTORING_ROADMAP.md` - Umumiy roadmap
- `WIZARD_ARCHITECTURE_PLAN.md` - Arxitektura detallari
- `WIZARD_REFACTORING_COMPLETE.md` - Bu fayl (to'liq reja)

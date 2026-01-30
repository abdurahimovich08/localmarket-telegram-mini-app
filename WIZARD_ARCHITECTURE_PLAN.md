# 🏗️ Wizard Architecture Refactoring Plan

**Maqsad:** Monolit komponentni scalable, maintainable arxitekturaga aylantirish

---

## 📋 6 Ta Asosiy Muammo va Yechimlar

### 1. Monolit Komponent (2106 lines)

**Muammo:**
- Bug topish qiyin
- Code review qiyin
- Test qilish deyarli imkonsiz
- Yangi kategoriya qo'shish "copy/paste hell"

**Yechim: Vertical Slices**

```
src/components/wizard/
├── steps/
│   ├── Step1Taxonomy.tsx (~300 lines)
│   ├── Step2Photos.tsx (~250 lines)
│   ├── Step3Details.tsx (~350 lines)
│   ├── Step4Price.tsx (~150 lines)
│   ├── Step5Variants.tsx (~400 lines)
│   └── Step6Publish.tsx (~200 lines)
├── WizardHeader.tsx (~100 lines)
└── WizardFooter.tsx (~80 lines)

src/components/ClothingListingWizard.tsx (~400 lines) // Orchestrator
```

**Faydalar:**
- Har bir step alohida test qilinadi
- Code review < 30 min
- Bug topish tez
- UX o'zgarmaydi

---

### 2. Universal Wizard Architecture

**Muammo:**
- Yangi kategoriya qo'shish uchun butun wizard qayta yoziladi
- Code duplication
- Inconsistent UX

**Yechim: Wizard Registry Pattern**

```
src/wizards/
├── categoryWizards/
│   ├── clothingWizard.ts
│   ├── autoWizard.ts (future)
│   └── electronicsWizard.ts (future)
├── UniversalListingWizard.tsx
└── types.ts
```

**Interface:**
```typescript
interface WizardConfig {
  category: string
  steps: StepConfig[]
  validations: ValidationConfig
  attributeBuilder: (data: any) => Record<string, any>
  aiContext?: AIContext
}

interface StepConfig {
  id: number
  key: string
  title: string
  subtitle: string
  component: React.ComponentType<StepProps>
  validation: (data: any) => boolean
}
```

**Routing:**
```typescript
// Old: /create-clothing
// New: /create/:category
<Route path="/create/:category" element={<UniversalListingWizard />} />
```

**Faydalar:**
- Yangi kategoriya: faqat config fayl
- Consistent UX
- Code reuse maksimal

---

### 3. DB Schema: Enum/Normalization

**Muammo:**
- `condition` TEXT (new, like_new, good, fair) - UI'da (yangi, yangi_kabi, yaxshi, o'rtacha)
- Analytics va filtering qiyin
- Data inconsistency riski

**Yechim: Condition Code Enum**

**Migration:**
```sql
-- Add condition_code column
ALTER TABLE listings 
ADD COLUMN condition_code TEXT CHECK (condition_code IN ('new', 'like_new', 'good', 'fair'));

-- Migrate existing data
UPDATE listings 
SET condition_code = CASE 
  WHEN condition = 'new' THEN 'new'
  WHEN condition = 'like_new' THEN 'like_new'
  WHEN condition = 'good' THEN 'good'
  WHEN condition = 'fair' THEN 'fair'
  ELSE 'good'
END;

-- Make condition_code NOT NULL
ALTER TABLE listings 
ALTER COLUMN condition_code SET NOT NULL;

-- Optional: Keep condition for backward compatibility (deprecated)
-- Or remove after migration period
```

**UI Mapping:**
```typescript
const CONDITION_MAP = {
  'yangi': 'new',
  'yangi_kabi': 'like_new',
  'yaxshi': 'good',
  'o\'rtacha': 'fair'
} as const

const CONDITION_REVERSE_MAP = {
  'new': 'yangi',
  'like_new': 'yangi_kabi',
  'good': 'yaxshi',
  'fair': 'o\'rtacha'
} as const
```

**Faydalar:**
- Clean data for analytics
- Easy filtering
- Type safety
- No UI/DB mismatch

---

### 4. Attributes JSONB Optimization

**Muammo:**
- Hammasi `attributes` JSONB'da
- Filtering qiyin (brand, size, taxonomy)
- Query performance past
- Indexing qiyin

**Yechim: Core Fields + JSONB Balance**

**Core Fields (Kolonka):**
```sql
ALTER TABLE listings
ADD COLUMN brand TEXT,
ADD COLUMN material TEXT,
ADD COLUMN taxonomy_id TEXT,
ADD COLUMN audience TEXT,
ADD COLUMN segment TEXT,
ADD COLUMN size_type TEXT, -- 'letter' | 'number'
ADD COLUMN colors TEXT[], -- Array for filtering
ADD COLUMN sizes TEXT[]; -- Array for filtering

-- Indexes for performance
CREATE INDEX idx_listings_brand ON listings(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_listings_taxonomy_id ON listings(taxonomy_id) WHERE taxonomy_id IS NOT NULL;
CREATE INDEX idx_listings_colors ON listings USING GIN(colors);
CREATE INDEX idx_listings_sizes ON listings USING GIN(sizes);
```

**JSONB (Flexible Data):**
```json
{
  "stock_by_size_color": {
    "M_qora": 5,
    "L_qora": 8
  },
  "photos_by_color": {
    "qora": ["url1", "url2"],
    "oq": ["url3"]
  },
  "discount_meta": {
    "original_price": 600000,
    "reason": "Mavsumiy chegirma",
    "percent": 17
  },
  "_aiMeta": {
    "generatedAt": "2025-01-27T10:30:00Z",
    "model": "gemini-2.0-flash-exp"
  }
}
```

**Faydalar:**
- Fast filtering (brand, size, taxonomy)
- Flexible data in JSONB
- Better query performance
- Easy indexing

---

### 5. Media Pipeline Consistency

**Muammo:**
- Cloudinary primary, Supabase fallback
- Ba'zan birida upload, ikkinchisida yo'q
- Retry'da duplicate
- Cleanup qiyin

**Yechim: Upload Session Tracking**

**Implementation:**
```typescript
interface UploadSession {
  sessionId: string
  provider: 'cloudinary' | 'supabase'
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  files: {
    originalName: string
    url: string | null
    provider: 'cloudinary' | 'supabase' | null
  }[]
  createdAt: string
  completedAt: string | null
}

// Upload with session tracking
async function uploadWithSession(
  files: File[],
  sessionId: string
): Promise<UploadSession> {
  // 1. Create session record
  const session: UploadSession = {
    sessionId,
    provider: 'cloudinary', // Primary
    status: 'uploading',
    files: files.map(f => ({
      originalName: f.name,
      url: null,
      provider: null
    })),
    createdAt: new Date().toISOString(),
    completedAt: null
  }
  
  // 2. Try primary provider
  try {
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
    // 3. Fallback to Supabase
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

// Store session in database (optional)
async function saveUploadSession(session: UploadSession) {
  await supabase.from('upload_sessions').insert({
    session_id: session.sessionId,
    provider: session.provider,
    status: session.status,
    files: session.files,
    created_at: session.createdAt,
    completed_at: session.completedAt
  })
}
```

**Database Table (Optional):**
```sql
CREATE TABLE upload_sessions (
  session_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  files JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
```

**Faydalar:**
- Single source of truth
- Retry mechanism
- Cleanup tracking
- No duplicates

---

### 6. Draft Saving

**Muammo:**
- User wizard'ni yarim tashlab ketadi
- Conversion past
- No retention

**Yechim: Debounced localStorage + Resume Modal**

**Implementation:**
```typescript
// Hook for draft management
function useDraftSaving(
  category: string,
  formData: any,
  debounceMs: number = 500
) {
  const draftKey = `wizard_draft_${category}`
  
  // Save draft on change
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
  
  // Load draft
  const loadDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        const draft = JSON.parse(stored)
        // Check if draft is recent (e.g., < 7 days)
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
  
  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('Failed to clear draft:', error)
    }
  }, [draftKey])
  
  return { loadDraft, clearDraft }
}

// Resume modal component
function DraftResumeModal({ 
  onResume, 
  onDiscard 
}: { 
  onResume: () => void
  onDiscard: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-sm mx-4">
        <h3 className="text-white font-semibold mb-2">Draft topildi</h3>
        <p className="text-white/60 text-sm mb-4">
          Oldingi e'lon yarim tashlab ketilgan. Davom etasizmi?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onResume}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Davom etish
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            Yangi boshlash
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Usage:**
```typescript
// In ClothingListingWizard
const { loadDraft, clearDraft } = useDraftSaving('clothing', formData)
const [showDraftModal, setShowDraftModal] = useState(false)

useEffect(() => {
  const draft = loadDraft()
  if (draft) {
    setShowDraftModal(true)
  }
}, [])

const handleResume = () => {
  const draft = loadDraft()
  if (draft) {
    setFormData(draft.formData)
    // Restore other state...
  }
  setShowDraftModal(false)
}

const handleDiscard = () => {
  clearDraft()
  setShowDraftModal(false)
}
```

**Faydalar:**
- Conversion improvement (20-30%)
- Better UX
- User retention
- No data loss

---

## 📅 Implementation Timeline

### Phase 1: Component Refactoring (1-2 days)
- [ ] Step1Taxonomy.tsx
- [ ] Step2Photos.tsx
- [ ] Step3Details.tsx
- [ ] Step4Price.tsx
- [ ] Step5Variants.tsx
- [ ] Step6Publish.tsx
- [ ] WizardHeader.tsx
- [ ] WizardFooter.tsx
- [ ] Update main component

### Phase 2: Universal Wizard (2-3 days)
- [ ] WizardConfig interface
- [ ] clothingWizard.ts config
- [ ] UniversalListingWizard.tsx
- [ ] Update routing

### Phase 3: DB Schema (1-2 days)
- [ ] Migration script
- [ ] condition_code enum
- [ ] Core fields (brand, material, taxonomy_id)
- [ ] Indexes
- [ ] Update code

### Phase 4: Media Pipeline (1-2 days)
- [ ] UploadSession interface
- [ ] uploadWithSession function
- [ ] Retry mechanism
- [ ] Cleanup logic

### Phase 5: Draft Saving (1 day)
- [ ] useDraftSaving hook
- [ ] DraftResumeModal
- [ ] Integration

**Total:** 6-10 days

---

## ✅ Success Metrics

- [ ] Main component < 500 lines
- [ ] Each step < 300 lines
- [ ] Test coverage > 70%
- [ ] Code review time < 30 min
- [ ] New category addition < 1 day
- [ ] Query performance improvement > 50%
- [ ] Conversion improvement > 20%

# 🏗️ Wizard Refactoring Roadmap

**Maqsad:** 2106 qatorli monolitni maintainable, scalable arxitekturaga aylantirish

---

## 📊 Hozirgi Holat

- **File:** `src/components/ClothingListingWizard.tsx` (2106 lines)
- **Muammolar:**
  - Bug topish qiyin
  - Yangi kategoriya qo'shish "copy/paste hell"
  - Test qilish deyarli imkonsiz
  - Code review qiyin

---

## 🎯 Refactoring Strategiyasi

### Phase 1: Vertical Slices (1-2 kun)

**Maqsad:** UI'ni bo'laklarga ajrat, state wizardda qolsin

**Yaratiladigan komponentlar:**
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

**Faydalar:**
- ✅ Har bir step alohida test qilinadi
- ✅ Code review osonlashadi
- ✅ Bug topish tezlashadi
- ✅ UX o'zgarmaydi

### Phase 2: State Management Hook (2-3 kun)

**Maqsad:** State va actions'ni hook'ga ajratish

**Yaratiladigan:**
```
src/hooks/
└── useClothingWizardState.ts
```

**Faydalar:**
- ✅ State logic reusable
- ✅ Testing osonlashadi
- ✅ Multiple wizard instances mumkin

### Phase 3: Universal Wizard Architecture (3-5 kun)

**Maqsad:** Multi-category support

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

**Faydalar:**
- ✅ Yangi kategoriya qo'shish oson
- ✅ Code reuse maksimal
- ✅ Consistent UX

### Phase 4: DB Schema Improvements (1-2 kun)

**Maqsad:** Enum/normalization va core fields

**O'zgarishlar:**
- `condition_code` enum (new, like_new, good, fair)
- Core fields: `brand`, `material`, `taxonomy_id`
- JSONB: faqat flexible data

### Phase 5: Media Pipeline Consistency (1-2 kun)

**Maqsad:** Single source of truth

**O'zgarishlar:**
- `uploadSessionId` tracking
- Transactional upload
- Retry mechanism

### Phase 6: Draft Saving (1 kun)

**Maqsad:** Conversion improvement

**O'zgarishlar:**
- Debounced localStorage save
- Resume draft modal

---

## 📝 Implementation Details

### Step Components Interface

```typescript
interface StepProps {
  // State (from parent)
  formData: FormData
  selectedTaxonomy: TaxonNode | null
  photos: string[]
  // ... other state
  
  // Actions (from parent)
  setFormData: (data: FormData) => void
  setSelectedTaxonomy: (taxonomy: TaxonNode | null) => void
  setPhotos: (photos: string[]) => void
  // ... other actions
  
  // Validation
  isValid: boolean
  onNext: () => void
  onBack: () => void
}
```

### Wizard Registry Pattern

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

---

## 🚀 Implementation Order

1. ✅ **Step1Taxonomy.tsx** - En katta va murakkab
2. ✅ **Step2Photos.tsx** - Image handling
3. ✅ **Step3Details.tsx** - AI integration
4. ✅ **Step4Price.tsx** - Simple form
5. ✅ **Step5Variants.tsx** - Complex state
6. ✅ **Step6Publish.tsx** - Review & submit
7. ✅ **WizardHeader.tsx** - Reusable header
8. ✅ **WizardFooter.tsx** - Navigation buttons

---

## ✅ Success Criteria

- [ ] Main component < 500 lines
- [ ] Each step component < 300 lines
- [ ] All tests pass
- [ ] UX unchanged
- [ ] Performance maintained
- [ ] Code review time < 30 min per PR

---

## 📅 Timeline

- **Phase 1:** 1-2 days
- **Phase 2:** 2-3 days
- **Phase 3:** 3-5 days
- **Phase 4:** 1-2 days
- **Phase 5:** 1-2 days
- **Phase 6:** 1 day

**Total:** 9-15 days (parallel work bilan 7-10 days)

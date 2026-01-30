# 🚀 Keyingi Qadamlar - Implementation Plan

**Status:** Phase 1 boshlangan (Step1Taxonomy.tsx yaratildi)

---

## ✅ Bajarilgan

- [x] Step1Taxonomy.tsx yaratildi (~350 lines)
- [x] Build test o'tdi
- [x] Refactoring dokumentatsiyasi tayyor

---

## 📋 Keyingi Qadamlar (Priority Order)

### 1. WizardHeader va WizardFooter (1-2 soat)

**Fayllar:**
- `src/components/wizard/WizardHeader.tsx`
- `src/components/wizard/WizardFooter.tsx`

**Maqsad:** Reusable header va footer komponentlari

**Interface:**
```typescript
// WizardHeader.tsx
interface WizardHeaderProps {
  currentStep: number
  totalSteps: number
  stepTitle: string
  stepSubtitle: string
  stepIcon: React.ReactNode
  selectedTaxonomy?: TaxonNode | null
  onBack: () => void
  progressPercent: number
}

// WizardFooter.tsx
interface WizardFooterProps {
  currentStep: number
  totalSteps: number
  canProceed: boolean
  isValid: boolean
  onBack: () => void
  onNext: () => void
  isSubmitting?: boolean
  submitLabel?: string
}
```

---

### 2. Qolgan Step Komponentlari (4-6 soat)

#### Step2Photos.tsx (~250 lines)
- Photo upload
- Image cropping
- Banner creator
- User hint input
- Skip AI checkbox

#### Step3Details.tsx (~350 lines)
- AI status banners
- AI generate button
- Title, Description, Brand, Material inputs
- Condition selection
- Skeleton loaders

#### Step4Price.tsx (~150 lines)
- Price input
- Negotiable toggle
- Discount toggle
- Discount details

#### Step5Variants.tsx (~400 lines)
- Color selection
- Size selection
- Stock management
- Photos by color

#### Step6Publish.tsx (~200 lines)
- Review summary
- Submit button
- Loading state

---

### 3. Main Component Update (2-3 soat)

**Maqsad:** ClothingListingWizard.tsx'ni refactor qilish

**O'zgarishlar:**
- Step komponentlarini import qilish
- Step render logic'ni almashtirish
- WizardHeader va WizardFooter ishlatish
- State management o'zgarmaydi (hozircha)

**Natija:**
- 2106 lines → ~400 lines
- Har bir step alohida fayl
- Maintainability +500%

---

### 4. Testing va Bug Fixes (2-3 soat)

- [ ] Har bir step alohida test
- [ ] Navigation test
- [ ] State persistence test
- [ ] AI integration test
- [ ] Form submit test

---

## 🎯 Phase 1 Completion Criteria

- [ ] Barcha 6 step komponenti yaratilgan
- [ ] WizardHeader va WizardFooter yaratilgan
- [ ] Main component < 500 lines
- [ ] Build muvaffaqiyatli
- [ ] UX o'zgarmagan
- [ ] Barcha funksiyalar ishlayapti

---

## 📅 Timeline

**Bugun:**
- ✅ Step1Taxonomy.tsx
- ⏳ WizardHeader.tsx
- ⏳ WizardFooter.tsx
- ⏳ Step2Photos.tsx

**Ertaga:**
- ⏳ Step3Details.tsx
- ⏳ Step4Price.tsx
- ⏳ Step5Variants.tsx
- ⏳ Step6Publish.tsx

**Keyingi kun:**
- ⏳ Main component update
- ⏳ Testing
- ⏳ Bug fixes

**Jami:** 2-3 kun

---

## 🔄 Keyingi Phase'lar

### Phase 2: State Management Hook (2-3 kun)
- `useClothingWizardState.ts` hook
- State va actions'ni ajratish

### Phase 3: Universal Wizard (3-5 kun)
- `categoryWizards/` pattern
- `UniversalListingWizard.tsx`

### Phase 4: DB Schema (1-2 kun)
- Migration script
- condition_code enum
- Core fields

### Phase 5: Media Pipeline (1-2 kun)
- Upload session tracking
- Single source of truth

### Phase 6: Draft Saving (1 kun)
- `useDraftSaving` hook
- Resume modal

---

## 💡 Tips

1. **Bir vaqtda bir step** - Step1Taxonomy kabi, har bir step'ni alohida yarat
2. **State o'zgarmaydi** - Hozircha state main component'da qoladi
3. **Props interface** - Har bir step uchun aniq interface
4. **Testing** - Har bir step yaratilgandan keyin test qil
5. **Git commits** - Har bir step uchun alohida commit

---

## 📝 Notes

- **UX o'zgarmaydi** - Faqat kod struktura o'zgaradi
- **Performance** - O'zgarish yo'q (hatto yaxshilanadi)
- **Backward compatibility** - Eski kod ishlaydi
- **Gradual migration** - Bir vaqtda bitta step

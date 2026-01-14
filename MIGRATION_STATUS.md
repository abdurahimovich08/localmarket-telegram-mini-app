# 🚀 Migration Status

## ✅ Qilingan Ishlar (Phase 0: Infrastructure)

### 1. Release Gates
- ✅ `scripts/release-gates.sh` - Build/Type/Lint gates
- ✅ `database/release_gates_health_check.sql` - VIEW health check
- ✅ `database/rls_owner_test.sql` - RLS owner check

### 2. Risk Fixlar

#### ✅ Risk 1: Unified VIEW "stable id" masalasi
- **Fix:** `unified_items` VIEW'ga `stable_id` qo'shildi (`entity_type:item_id` format)
- **Fayl:** `database/unified_items_view.sql`
- **Test:** `SELECT stable_id FROM unified_items LIMIT 10;`

#### ✅ Risk 2: Store mode ctx navigatsiyada yo'qolishi
- **Fix:** `preserveCtx()` helper yaratildi
- **Fayl:** `src/lib/preserveCtx.ts`
- **Qanday ishlatish:** `useNavigateWithCtx()` hook

#### ✅ Risk 3: Fallback dublikatlari
- **Fix:** VIEW success → only VIEW, fallback faqat error bo'lsa
- **Fayl:** `src/hooks/useUnifiedItems.ts`
- **Qoida:** Fallback va view natijalari hech qachon merge qilinmasin

#### ✅ Risk 4: Query invalidation strategiyasi
- **Fix:** Centralized query invalidation
- **Fayl:** `src/lib/queryInvalidation.ts`
- **Funksiyalar:**
  - `invalidateListingQueries()`
  - `invalidateServiceQueries()`
  - `invalidateStoreQueries()`
  - `invalidateStorePostQueries()`
  - `invalidateStoreCategoryQueries()`

#### ✅ Risk 5: Telegram validation faqat API'da
- **Fix:** Error mapping utility (RLS violations → user-friendly messages)
- **Fayl:** `src/lib/errorMapping.ts`
- **Qo'llaniladi:** `useEntityMutations` hook'da

### 3. Component Updates

#### ✅ UniversalCard
- ✅ onClick handler qo'shildi (entity_type bo'yicha routing)
- ✅ `switch(entity_type)` qat'iy routing
- **Fayl:** `src/components/UniversalCard.tsx`

#### ✅ useEntityMutations
- ✅ Error mapping integratsiyasi
- ✅ Query invalidation integratsiyasi
- ✅ React Query client integratsiyasi
- **Fayl:** `src/hooks/useEntityMutations.ts`

#### ✅ useUnifiedItems
- ✅ Stable ID support
- ✅ Fallback dublikatlari fix
- **Fayl:** `src/hooks/useUnifiedItems.ts`

---

## 📋 Keyingi Qadamlar

### Phase 1: Home.tsx Migration (Read-Only)
**Xavf:** Past  
**Vaqt:** ~1 soat  
**Status:** ⏳ Kutilmoqda

**Qo'llanma:** `MIGRATION_PHASE_1_HOME.md`

**Testlar:**
- [ ] Marketplace mode: hamma itemlar chiqadi
- [ ] Store mode: faqat store mahsulotlar
- [ ] Empty state
- [ ] Skeleton/loading
- [ ] Card click routing

---

### Phase 2: Search.tsx Migration (Read-Only)
**Xavf:** Past  
**Vaqt:** ~30 daqiqa  
**Status:** ⏳ Kutilmoqda

**Testlar:**
- [ ] Qidiruv so'zi bilan relevancy
- [ ] Store mode'da filter
- [ ] Price range / category filterlar

---

### Phase 3: Detail Pages (Read-Only)
**Xavf:** O'rtacha  
**Vaqt:** ~1 soat  
**Status:** ⏳ Kutilmoqda

**Testlar:**
- [ ] 404 state
- [ ] Rasm rendering (0, 1, multiple)
- [ ] Owner card

---

### Phase 4: MyListings / MyServices (CRUD)
**Xavf:** O'rtacha  
**Vaqt:** ~1 soat  
**Status:** ⏳ Kutilmoqda

**Testlar:**
- [ ] Delete → cache'dan chiqsin (optimistic)
- [ ] RLS block → error message
- [ ] Update ishlaydi

---

### Phase 5: Create Flows (Eng Xavfli)
**Xavf:** Yuqori  
**Vaqt:** ~2 soat  
**Status:** ⏳ Kutilmoqda

**Testlar:**
- [ ] Rasm upload → crop → compress → create
- [ ] Upload success, create fail → orphan image?
- [ ] Create success, navigation fail

---

### Phase 6: StoreManagement (Eng Kompleks)
**Xavf:** Yuqori  
**Vaqt:** ~2 soat  
**Status:** ⏳ Kutilmoqda

**Testlar:**
- [ ] Categories CRUD
- [ ] Products CRUD
- [ ] Posts CRUD
- [ ] Reordering
- [ ] Stock management

---

## 🧪 Release Gates (Majburiy)

Migration boshlashdan oldin:

1. ✅ Build Gate: `npm run build`
2. ✅ Type Check: `npx tsc --noEmit`
3. ✅ Lint: `npm run lint`
4. ⏳ VIEW Health Check: `database/release_gates_health_check.sql`
5. ⏳ RLS Owner Check: `database/rls_owner_test.sql`

---

## 📊 Monitoring

### Bundle Size
```bash
npm run build
# Vite build stats ko'ring
```

### Query Count
- React Query DevTools'da monitoring
- Home.tsx load'da nechta query?

### Error Rate
- Vercel Logs
- Supabase Logs
- Browser Console

---

## ✅ Xulosa

Barcha infrastructure va risk fixlar tayyor. Endi real migration boshlash mumkin!

**Keyingi qadam:** `MIGRATION_PHASE_1_HOME.md` bo'yicha Home.tsx'ni migration qilish.

# 🔍 Mukammal Qidiruv Tizimi - Yul Xaritasi

## 🎯 Maqsad
Imlo xatolarini tuzatadigan, sinonimlarni tan oladigan va barcha tillarda (Lotin, Kril, Rus) ishlaydigan mukammal qidiruv tizimi yaratish.

---

## 📋 1. QIDIRUV ALGORITMLARI

### 1.1 Fuzzy Search (Imlo xatolarini tuzatish)
**Muammo:** "kmz" yozilsa, "kamaz" topilishi kerak

**Yechim:**
- Levenshtein distance algoritmi (qisqa so'zlar uchun)
- Trigram matching (PostgreSQL pg_trgm extension)
- Phonetic matching (Uzbek phonetics)

**Kod joyi:** `src/lib/searchAlgorithms.ts`

### 1.2 Sinonimlar (Synonyms)
**Muammo:** "kuchmas mulk" → "uy", "kvartira" topilishi kerak

**Yechim:**
- Sinonimlar bazasi yaratish (Uzbek real estate, transport, etc.)
- Mapping: `{ "kuchmas mulk": ["uy", "kvartira", "xonadon"] }`

**Kod joyi:** `src/lib/synonyms.ts`

### 1.3 Multi-Script Support (Lotin/Kril/Rus)
**Muammo:** Kimdur Kril, kimdur Lotin, kimdur Rus yozadi

**Yechim:**
- Transliteration library (latin ↔ cyrillic)
- Normalization: Barcha matnlarni bir formatga keltirish
- Russian keywords mapping

**Kod joyi:** `src/lib/transliteration.ts`

---

## 📊 2. FILTR TIZIMI

### 2.1 Kategoriya filtri
- Dropdown yoki chip selection
- "Barchasi" opsiyasi

### 2.2 Joylashuv filtri
- Radius (5km, 10km, 20km, 50km)
- Shahar/Mahalla tanlash

### 2.3 Holat filtri
- Yangi (new)
- Yaxshi holat (like_new, good)
- Eski (fair, poor)

### 2.4 Narx filtri
- Min/Max narx
- Tekin e'lonlar toggle

### 2.5 Vaqt filtri
- Bugun qo'shilganlar
- So'nggi hafta
- So'nggi oy

### 2.6 Aksiyalar filtri
- Faqat aksiyalar (`is_boosted = true`)

**Kod joyi:** `src/components/SearchFilters.tsx`

---

## 🔧 3. IMPLEMENTATION STEPS

### Step 1: Search Algorithms Library
**Fayl:** `src/lib/searchAlgorithms.ts`
- `fuzzySearch()` - imlo xatolarini tuzatish
- `normalizeQuery()` - multi-script support
- `expandSynonyms()` - sinonimlarni kengaytirish
- `buildSearchQuery()` - barcha algoritmlarni birlashtirish

### Step 2: Synonyms Database
**Fayl:** `src/lib/synonyms.ts`
- Uzbek → Uzbek sinonimlar
- Russian → Uzbek mapping
- Category-specific keywords

### Step 3: Transliteration
**Fayl:** `src/lib/transliteration.ts`
- Latin ↔ Cyrillic conversion
- Russian → Uzbek keywords

### Step 4: Enhanced Supabase Search
**Fayl:** `src/lib/supabase.ts`
- `getListings()` funksiyasini yangilash
- PostgreSQL full-text search (pg_trgm)
- Advanced filtering logic

### Step 5: Search Filters Component
**Fayl:** `src/components/SearchFilters.tsx`
- UI komponenti
- Filter state management
- Uzbek localization

### Step 6: Search Page Update
**Fayl:** `src/pages/Search.tsx`
- Filtrlar integratsiyasi
- Qidiruv algoritmlarini chaqirish
- Natijalarni ko'rsatish

---

## 🗄️ 4. DATABASE IMPROVEMENTS

### PostgreSQL Extensions
```sql
-- Fuzzy search uchun
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### Indexes
```sql
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_listings_search 
ON listings USING gin(to_tsvector('russian', title || ' ' || description));

-- Trigram index (fuzzy search)
CREATE INDEX IF NOT EXISTS idx_listings_trgm 
ON listings USING gin(title gin_trgm_ops, description gin_trgm_ops);
```

---

## 📝 5. UX IMPROVEMENTS

### 5.1 Auto-suggestions
- Tugallanmagan so'zlarni taklif qilish
- Recent searches
- Popular searches

### 5.2 Search Results
- Relevance score ko'rsatish
- "Did you mean..." suggestions
- Result count

### 5.3 Filter UI
- Collapsible filter panel
- Active filters badges
- Reset filters button

---

## ✅ 6. TESTING SCENARIOS

1. **Typo tolerance:**
   - "kmz" → "kamaz" ✅
   - "telefom" → "telefon" ✅

2. **Synonyms:**
   - "kuchmas mulk" → uy/kvartira ✅
   - "avtomobil" → mashina ✅

3. **Multi-script:**
   - "машина" (Cyrillic) → "mashina" (Latin) ✅
   - "дом" (Russian) → "uy" ✅

4. **Filters:**
   - Kategoriya: "Electronics" ✅
   - Narx: 100000 - 500000 ✅
   - Radius: 10km ✅

---

## 🚀 7. IMPLEMENTATION ORDER

1. ✅ Reja yaratish (bu fayl)
2. 🔄 Search algorithms library
3. 🔄 Synonyms database
4. 🔄 Transliteration
5. 🔄 Database improvements (SQL)
6. 🔄 Supabase search enhancement
7. 🔄 Filters component
8. 🔄 Search page update
9. 🔄 Testing

---

## 📚 8. RESOURCES

- PostgreSQL pg_trgm: https://www.postgresql.org/docs/current/pgtrgm.html
- Levenshtein distance: https://en.wikipedia.org/wiki/Levenshtein_distance
- Uzbek transliteration: https://www.unicode.org/reports/tr35/tr35-general.html

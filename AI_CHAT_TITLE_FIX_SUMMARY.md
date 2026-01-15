# 🔧 AI Chat Title Field Muammosi - Tuzatish

## 🐛 MUAMMO

**User flow:**
1. BOSH SAHIFA > SOQQA > NARSA SOTAMAN > KIYIM KECHAK
2. Taxonomy tanlash (Audience → Segment → Leaf)
3. AI Chat boshlanadi
4. **Muammo:** AI title field'ni so'rayapti, lekin taxonomy tanlanganda title avtomatik generate qilinishi kerak

**Asosiy sabab:**
- `clothing.schema.ts` da `questionOrder: ['title', 'description', 'brand', ...]` - title birinchi o'rinda
- Taxonomy tanlanganda ham AI title so'rayapti
- User title kiritganda yoki boshqa nomda mahsulot kiritganda xatolik yuz beradi

---

## ✅ YECHIM

### 1. Taxonomy Context'da Title Field'ni Skip Qilish

**Fayl:** `src/services/UnifiedGeminiService.ts`

**O'zgarishlar:**
1. Taxonomy tanlanganda, `questionOrder` dan `title` va `description` ni olib tashlash
2. AI prompt'ga qo'shimcha ko'rsatma: "Title field'ni so'ramang - avtomatik generate qilinadi"
3. Title generation logic qo'shish - barcha maydonlar to'ldirilganda avtomatik generate qilish

### 2. Title Generation Logic

**Format:** `{brand} {leafLabel} {color} {size}`

**Misol:**
- Input: Brand="Nike", Leaf="Krossovka", Color="Oq", Size="42"
- Output: "Nike Krossovka Oq 42"

**Fallback:**
- Agar brand yo'q bo'lsa: "{leafLabel} {color} {size}"
- Agar hech narsa yo'q bo'lsa: "{leafLabel}"

### 3. Description Generation

**Format:** `{leafLabel}. Brend: {brand}. Rang: {color}. O'lcham: {size}. Material: {material}. Holati: {condition}. Narx: {price} so'm.`

---

## 📝 KOD O'ZGARISHLARI

### 1. Taxonomy Context Enhancement

```typescript
// Taxonomy context'da title field'ni skip qilish
let questionOrderList = schema.aiInstructions?.questionOrder || []
if (context?.taxonomy) {
  // Skip 'title' and 'description' from question order when taxonomy is selected
  questionOrderList = questionOrderList.filter(key => key !== 'title' && key !== 'description')
}
```

### 2. AI Prompt Update

```typescript
taxonomyContext = `
TAXONOMY TANLANGAN (KATEGORIYA ALLAQACHON TANLANGAN):
- Auditoriya: ${audienceUz}
- Segment: ${segmentUz}
- Tanlangan tur: ${leafUz}

MUHIM QOIDALAR:
1) TITLE FIELD'NI SO'RAMA - Taxonomy tanlanganda, title avtomatik generate qilinadi.
   Title field'ni skip qil va darhol brend, o'lcham, holat, narx kabi maydonlardan boshlash.
   
2) Umumiy savol BERMANG ("qanday kiyim sotmoqchisiz?" yoki "mahsulot nomi nima?").
   
3) Shu tanlov asosida aniq savol bering: brend, o'lcham, holat, narx, stock, discount, rang.

4) TITLE GENERATION:
   - Barcha maydonlar to'ldirilganda, title'ni avtomatik generate qil:
   - Format: "{brand} {leafLabel} {color} {size}" (masalan: "Nike Krossovka Oq 42")
   - Agar brand yo'q bo'lsa: "{leafLabel} {color} {size}" (masalan: "Krossovka Oq 42")
   - Title'ni so'ramasdan, faqat generate qil va JSON'da qaytar.
`
```

### 3. Title Generation Logic

```typescript
// Generate title and description automatically if taxonomy is selected (clothing)
const sessionContext = session.context || {}
if (sessionContext.taxonomy && !core.title) {
  const t: any = sessionContext.taxonomy
  const leafLabel = t.leafUz || t.leaf || t.pathUz || t.path || ''
  const brand = attributes.brand_display || attributes.brand_norm || attributes.brand_raw || attributes.brand || ''
  const color = Array.isArray(attributes.colors) ? attributes.colors[0] : attributes.colors || ''
  const size = Array.isArray(attributes.sizes) ? attributes.sizes[0] : attributes.sizes || ''
  
  // Generate title: "{brand} {leafLabel} {color} {size}"
  let generatedTitle = leafLabel
  if (brand) generatedTitle = `${brand} ${generatedTitle}`
  if (color) generatedTitle = `${generatedTitle} ${color}`
  if (size) generatedTitle = `${generatedTitle} ${size}`
  
  // Ensure title and description exist
  if (!core.title) core.title = generatedTitle.trim()
  
  // Generate description from collected data
  const descParts: string[] = []
  if (brand) descParts.push(`Brend: ${brand}`)
  if (color) descParts.push(`Rang: ${color}`)
  if (size) descParts.push(`O'lcham: ${size}`)
  if (attributes.material) descParts.push(`Material: ${attributes.material}`)
  if (core.condition) descParts.push(`Holati: ${core.condition === 'new' ? 'Yangi' : ...}`)
  if (core.price) descParts.push(`Narx: ${core.price.toLocaleString()} so'm`)
  
  if (!core.description) {
    core.description = descParts.length > 0 
      ? `${leafLabel}. ${descParts.join('. ')}.`
      : `${leafLabel} sotilmoqda.`
  }
}

// Ensure title and description exist (fallback)
if (!core.title) core.title = 'Mahsulot'
if (!core.description) core.description = 'Mahsulot haqida ma\'lumot'
```

### 4. Session Context Storage

```typescript
interface UnifiedChatSession {
  entityType: 'product' | 'service'
  category: string
  schema: CategorySchema
  chatHistory: ChatMessage[]
  filledData: {
    core: Record<string, any>
    attributes: Record<string, any>
  }
  context?: Record<string, any> // Store taxonomy context for title generation
}

// Start session
const session: UnifiedChatSession = {
  entityType,
  category,
  schema,
  chatHistory: [{ role: 'user', parts: [{ text: systemPrompt }] }],
  filledData: { core: {}, attributes: {} },
  context: context || {}, // Store context for title generation
}
```

---

## 🧪 TEST QILISH

### Test Senaryolari

1. **Taxonomy tanlash → AI chat**
   - ✅ AI title so'ramasligi kerak
   - ✅ AI darhol brend, o'lcham, holat, narx so'rashi kerak
   - ✅ Barcha maydonlar to'ldirilganda, title avtomatik generate qilinishi kerak

2. **Title generation**
   - ✅ Brand + Leaf + Color + Size → "Nike Krossovka Oq 42"
   - ✅ Leaf + Color + Size (brand yo'q) → "Krossovka Oq 42"
   - ✅ Leaf (boshqa maydonlar yo'q) → "Krossovka"

3. **Description generation**
   - ✅ Barcha maydonlar to'ldirilganda, description avtomatik generate qilinishi kerak
   - ✅ Format: "{leafLabel}. Brend: {brand}. Rang: {color}. ..."

---

## ✅ NATIJA

### Oldin (Muammo)
1. User taxonomy tanlaydi
2. AI: "Mahsulot nomi nima?" ❌
3. User: "Krossovka" yozadi
4. AI: Xatolik yuz beradi ❌

### Keyin (Tuzatilgan)
1. User taxonomy tanlaydi
2. AI: "Brend nima?" ✅
3. User: "Nike" yozadi
4. AI: "O'lcham qanday?" ✅
5. User: "42" yozadi
6. AI: "Rang qanday?" ✅
7. User: "Oq" yozadi
8. AI: Barcha maydonlar to'ldirildi → Title: "Nike Krossovka Oq 42" ✅

---

## 📊 IMPACT

- ✅ **UX yaxshilandi:** User title kiritish shart emas
- ✅ **Xatoliklar kamaydi:** Title field confusion yo'q
- ✅ **AI aniqroq:** Taxonomy'dan keyin darhol spesifik savollar
- ✅ **Avtomatik generation:** Title va description avtomatik yaratiladi

---

**Status:** ✅ Tuzatildi va test qilindi

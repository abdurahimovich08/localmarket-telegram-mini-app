# 🔧 Greeting Message Fix - Title Field Skip

## 🐛 MUAMMO

Taxonomy tanlanganda ham AI hali ham "title ni kiriting" deb so'rayapti. User xohlaydiki, taxonomy tanlanganda darhol **brend** yoki **ishlab chiqarilgan mamlakati** so'rashi kerak.

---

## ✅ YECHIM

### 1. Question Order'da Title va Description Skip Qilish

**Fayl:** `src/services/UnifiedGeminiService.ts`

**O'zgarish:**
```typescript
// Adjust question order for taxonomy context (skip title if taxonomy selected)
let questionOrderList = schema.aiInstructions?.questionOrder || []
if (context?.taxonomy) {
  // Skip 'title' and 'description' from question order when taxonomy is selected
  questionOrderList = questionOrderList.filter(key => key !== 'title' && key !== 'description')
}

const questionOrder = questionOrderList.length > 0
  ? questionOrderList.map((key, i) => `${i + 1}. ${key}`).join('\n   ')
  : "Schema bo'yicha"
```

### 2. Required Fields'da Title va Description Skip Qilish

**O'zgarish:**
```typescript
// Filter out title and description from required fields if taxonomy is selected
const fieldsToShow = context?.taxonomy 
  ? schema.fields.filter(f => f.key !== 'title' && f.key !== 'description')
  : schema.fields

const requiredFieldDescriptions = fieldsToShow
  .filter(f => f.required)
  .map(f => `- ${f.label} (${f.key}): ${f.aiQuestion || f.description || 'Majburiy maydon'}`)
  .join('\n')
```

### 3. First Field Selection'da Title va Description Skip Qilish

**O'zgarish:**
```typescript
// Get first required field from profiling or schema (skip title and description)
let firstField = 'brand' // default
const profile = context.taxonomyNode?.requiredFieldsOverride?.[0]
if (profile && profile !== 'title' && profile !== 'description') {
  firstField = profile
} else {
  // Get question order, filtering out title and description
  const questionOrderFiltered = schema.aiInstructions?.questionOrder?.filter(
    key => key !== 'title' && key !== 'description'
  ) || []
  
  if (questionOrderFiltered.length > 0) {
    firstField = questionOrderFiltered[0]
  } else {
    // Find first required field from schema (excluding title and description)
    const firstRequired = schema.fields.find(
      f => f.required && f.key !== 'title' && f.key !== 'description'
    )
    if (firstRequired) {
      firstField = firstRequired.key
    }
  }
}
```

### 4. Greeting Message'ni Yaxshilash

**O'zgarish:**
```typescript
// Special greeting for brand/country
let greetingMessage = ''
if (firstField === 'brand' || firstField === 'country_of_origin' || firstField === 'country') {
  greetingMessage = `Iltimos, ushbu ${leafLabel}ning **brendini** yoki **ishlab chiqarilgan mamlakati**ni tanlang.
Agar brendni bilmasangiz, ishlab chiqarilgan mamlakatni ayting.`
} else {
  greetingMessage = `Iltimos, ushbu ${leafLabel}ning **${fieldLabel}**ni kiriting.
Agar bilmasangiz, ayting — birga aniqlaymiz 🙂`
}

greeting = `✅ Tanlandi: ${pathUz}

Zo'r 👍  
Endi aniqlashtiramiz.

${greetingMessage}`
```

---

## 📝 NATIJA

### Oldin (Muammo)
```
✅ Tanlandi: Erkaklar → Oyoq kiyim → Krossovka

Zo'r 👍  
Endi aniqlashtiramiz.

Iltimos, ushbu krossovkaning **sarlavhasi**ni kiriting. ❌
```

### Keyin (Tuzatilgan)
```
✅ Tanlandi: Erkaklar → Oyoq kiyim → Krossovka

Zo'r 👍  
Endi aniqlashtiramiz.

Iltimos, ushbu krossovkaning **brendini** yoki **ishlab chiqarilgan mamlakati**ni tanlang.
Agar brendni bilmasangiz, ishlab chiqarilgan mamlakatni ayting. ✅
```

---

## 🧪 TEST QILISH

1. Taxonomy tanlang (Erkaklar → Oyoq kiyim → Krossovka)
2. AI chat boshlanadi
3. **Kutilgan:** AI "brendini yoki ishlab chiqarilgan mamlakati" so'rashi kerak
4. **Noto'g'ri:** AI "title ni kiriting" so'ramasligi kerak

---

**Status:** ✅ Tuzatildi

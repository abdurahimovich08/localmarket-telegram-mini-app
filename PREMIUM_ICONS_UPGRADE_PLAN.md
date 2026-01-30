# 🎨 Premium Icons Upgrade Plan - "Narsa Sotaman" Sahifasi

## 📋 Maqsad
"Narsa sotaman" sahifasidagi barcha emojilarni premium Icons8 ikonkalariga almashtirish va ishonchli, professional ko'rinish berish.

## 🔍 Hozirgi Holat Tahlili

### 1. ClothingListingWizard.tsx - Asosiy Wizard
**Emojilar:**
- 🏷️ Kategoriya (Step 1)
- 📸 Rasmlar (Step 2)
- ✨ Ma'lumotlar (Step 3)
- 💰 Narx (Step 4)
- 🎨 Variantlar (Step 5)
- 🚀 Joylash (Step 6)

**Audience Selection:**
- 👨 Erkaklar
- 👩 Ayollar
- 👶 Bolalar
- 👥 Unisex

**Segment Selection:**
- 👕 Kiyim
- 👟 Oyoq kiyim
- 👜 Aksessuar
- 🩲 Ichki kiyim
- 🏃 Sport kiyim
- 🎎 Milliy kiyim

**Condition Options:**
- ✨ Yangi
- 👌 Yangi kabi
- 👍 Yaxshi
- 🤏 O'rtacha

**Tips & Info:**
- 💡 Maslahatlar
- 🎯 To'g'ri kategoriya = Tez topilish
- 📈 Yaxshi rasmlar = Tez sotish

### 2. BottomNav.tsx - Action Sheet
- 📦 Narsa sotaman
- 🛠 Xizmat ko'rsataman

### 3. Categories (types/index.ts)
- 📱 Elektronika
- 🪑 Mebel
- 👕 Kiyim-kechak
- 👶 Bolalar uchun
- 🏠 Uy-ro'zg'or
- va boshqalar...

## 🎯 Premium Icons Mapping

### Wizard Steps
1. **Kategoriya (🏷️)** → `tagWindow` yoki `tags` (Icons8)
2. **Rasmlar (📸)** → `PhotoIcon` (Heroicons) yoki custom camera icon
3. **Ma'lumotlar (✨)** → `SparklesIcon` (Heroicons) yoki `product` (Icons8)
4. **Narx (💰)** → `priceTag` yoki `dollarBag` (Icons8)
5. **Variantlar (🎨)** → `SwatchIcon` (Heroicons) yoki custom color icon
6. **Joylash (🚀)** → `RocketLaunchIcon` (Heroicons) yoki `new` (Icons8)

### Audience Selection
- **Erkaklar (👨)** → Custom male icon yoki `product` (Icons8)
- **Ayollar (👩)** → Custom female icon yoki `product` (Icons8)
- **Bolalar (👶)** → Custom kids icon yoki `product` (Icons8)
- **Unisex (👥)** → Custom unisex icon yoki `product` (Icons8)

### Segment Selection
- **Kiyim (👕)** → `product` (Icons8)
- **Oyoq kiyim (👟)** → `product` (Icons8)
- **Aksessuar (👜)** → `shoppingBag` (Icons8)
- **Ichki kiyim (🩲)** → `product` (Icons8)
- **Sport kiyim (🏃)** → `product` (Icons8)
- **Milliy kiyim (🎎)** → `product` (Icons8)

### Condition Options
- **Yangi (✨)** → `new` (Icons8)
- **Yangi kabi (👌)** → `product` (Icons8)
- **Yaxshi (👍)** → `product` (Icons8)
- **O'rtacha (🤏)** → `product` (Icons8)

### Action Sheet
- **Narsa sotaman (📦)** → `addShoppingCart` yoki `product` (Icons8)
- **Xizmat ko'rsataman (🛠)** → Custom service icon

## 📥 Kerakli Ikonkalar

### Mavjud Icons8 Ikonkalar (public/icons/)
✅ `product` - Mahsulot
✅ `shoppingBag` - Savat
✅ `addShoppingCart` - Savatga qo'shish
✅ `priceTag` - Narx
✅ `dollarBag` - Pul
✅ `tags` - Teglar
✅ `tagWindow` - Teg oynasi
✅ `new` - Yangi
✅ `discount` - Chegirma
✅ `sale` - Sotuv

### Qo'shimcha Kerakli Ikonkalar (Internetdan yuklab olish)
1. **Camera/Photo Icon** - Rasmlar uchun
2. **Male/Female/Kids/Unisex Icons** - Audience selection uchun
3. **Clothing Categories Icons** - Segment selection uchun
4. **Service Icon** - Xizmatlar uchun
5. **Sparkles/Magic Icon** - Ma'lumotlar uchun
6. **Color Swatch Icon** - Variantlar uchun
7. **Rocket/Launch Icon** - Joylash uchun

## 🛠️ Implementatsiya Rejasi

### Phase 1: Ikonkalarni yuklab olish
1. Icons8.com yoki Flaticon.com dan kerakli ikonkalarni yuklab olish
2. PNG formatida, 50x50 yoki 64x64 o'lchamda
3. `public/icons/` papkasiga qo'yish

### Phase 2: Icons8 utility'ni yangilash
1. `src/utils/icons8.ts` ga yangi ikonkalarni qo'shish
2. Mapping'larni yangilash

### Phase 3: Komponentlarni yangilash
1. `ClothingListingWizard.tsx` - barcha emojilarni ikonkalarga almashtirish
2. `BottomNav.tsx` - Action sheet emojilarini almashtirish
3. `types/index.ts` - Categories emojilarini almashtirish (ixtiyoriy)

### Phase 4: Testing va Polish
1. Barcha sahifalarni tekshirish
2. Responsive dizaynni tekshirish
3. Dark mode support (agar bor bo'lsa)

## 📝 Qo'shimcha Eslatmalar
- Ikonkalar PNG formatida bo'lishi kerak (SVG ham mumkin)
- O'lcham: 50x50 yoki 64x64 px
- Rangsiz (outline) yoki rangli bo'lishi mumkin
- Premium ko'rinish uchun professional dizayn
- Mobile-first approach

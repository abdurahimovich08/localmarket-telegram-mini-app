# 📥 Premium Icons Yuklab Olish Qo'llanmasi

## 🎯 Maqsad
"Narsa sotaman" sahifasidagi emojilarni premium ikonkalarga almashtirish uchun qo'shimcha ikonkalarni yuklab olish.

## 📋 Kerakli Ikonkalar Ro'yxati

### 1. Camera/Photo Icon (📸 → Camera)
- **Manba**: Icons8.com → "camera" yoki "photo"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-camera-50.png`
- **URL**: https://icons8.com/icons/set/camera

### 2. Service/Tools Icon (🛠 → Service)
- **Manba**: Icons8.com → "service" yoki "tools" yoki "wrench"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-service-50.png`
- **URL**: https://icons8.com/icons/set/service

### 3. Rocket/Launch Icon (🚀 → Rocket)
- **Manba**: Icons8.com → "rocket" yoki "launch"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-rocket-50.png`
- **URL**: https://icons8.com/icons/set/rocket

### 4. Sparkles/Magic Icon (✨ → Sparkles)
- **Manba**: Icons8.com → "sparkles" yoki "magic" yoki "star"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-sparkles-50.png`
- **URL**: https://icons8.com/icons/set/sparkles

### 5. Target/Bullseye Icon (🎯 → Target)
- **Manba**: Icons8.com → "target" yoki "bullseye"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-target-50.png`
- **URL**: https://icons8.com/icons/set/target

### 6. Chart/Statistics Icon (📈 → Chart)
- **Manba**: Icons8.com → "chart" yoki "statistics" yoki "growth"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-chart-50.png`
- **URL**: https://icons8.com/icons/set/chart

### 7. Lightbulb/Tips Icon (💡 → Lightbulb)
- **Manba**: Icons8.com → "lightbulb" yoki "idea"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-lightbulb-50.png`
- **URL**: https://icons8.com/icons/set/lightbulb

### 8. Handshake Icon (🤝 → Handshake)
- **Manba**: Icons8.com → "handshake" yoki "deal"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-handshake-50.png`
- **URL**: https://icons8.com/icons/set/handshake

### 9. Lightning/Flash Icon (⚡ → Lightning)
- **Manba**: Icons8.com → "lightning" yoki "flash" yoki "bolt"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-lightning-50.png`
- **URL**: https://icons8.com/icons/set/lightning

### 10. Celebration/Party Icon (🎉 → Celebration)
- **Manba**: Icons8.com → "celebration" yoki "party" yoki "confetti"
- **Format**: PNG, 50x50 yoki 64x64 px
- **Fayl nomi**: `icons8-celebration-50.png`
- **URL**: https://icons8.com/icons/set/celebration

## 📥 Yuklab Olish Qadamlari

### Icons8.com dan yuklab olish:
1. https://icons8.com ga kiring
2. Qidiruv qutisiga ikonka nomini kiriting (masalan: "camera")
3. Kerakli ikonkani tanlang
4. "Download" tugmasini bosing
5. Format: **PNG**
6. O'lcham: **50x50** yoki **64x64** px
7. Faylni `public/icons/` papkasiga qo'ying
8. Fayl nomini `icons8-[name]-50.png` formatida qiling

### Alternativ manbalar:
- **Flaticon.com** - https://www.flaticon.com
- **Iconfinder.com** - https://www.iconfinder.com
- **FontAwesome** - https://fontawesome.com (SVG format)

## 🔧 Integratsiya Qadamlari

1. Ikonkani `public/icons/` papkasiga qo'ying
2. `src/utils/icons8.ts` fayliga yangi ikonkani qo'shing:
   ```typescript
   camera: '/icons/icons8-camera-50.png',
   service: '/icons/icons8-service-50.png',
   // va hokazo...
   ```
3. Komponentlarda ishlatish:
   ```tsx
   <Icons8Icon name="camera" size={24} />
   ```

## ✅ Mavjud Ikonkalar (Ishlatish mumkin)

Quyidagi ikonkalar allaqachon mavjud va ishlatish mumkin:
- ✅ `product` - Mahsulot (emoji o'rniga)
- ✅ `priceTag` - Narx
- ✅ `tagWindow` - Kategoriya
- ✅ `shoppingBag` - Savat
- ✅ `new` - Yangi
- ✅ `discount` - Chegirma
- ✅ `sale` - Sotuv

## 📝 Eslatma

- Barcha ikonkalar PNG formatida bo'lishi kerak
- O'lcham: 50x50 yoki 64x64 px
- Rangsiz (outline) yoki rangli bo'lishi mumkin
- Premium ko'rinish uchun professional dizayn
- Mobile-first approach

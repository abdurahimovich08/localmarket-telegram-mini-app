# 📍 Location Feature Test Qo'llanmasi

## ✅ API Key Qo'shilgan

Kodlarda API key integratsiyasi yangilandi va error handling qo'shildi.

---

## 🔧 API Key Qo'shish

### 1. `.env` Fayl Yaratish

Loyiha root papkasida `.env` fayl yaratish:

```bash
# .env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 2. Development Server'ni Qayta Ishga Tushirish

Vite environment variables'ni o'qish uchun server'ni qayta ishga tushirish kerak:

```bash
npm run dev
```

**MUHIM:** `.env` faylini o'zgartirgandan keyin har doim server'ni qayta ishga tushirish kerak!

---

## ✅ Test Qilish

### 1. Sticky Header Test

1. StoreDetail sahifasiga kirish: `/store/:id`
2. Sahifani pastga scroll qilish
3. **Kutilgan:** Header yuqorida qolishi kerak
4. Share tugmasini bosish
5. **Kutilgan:** Share funksiyasi ishlashi kerak

### 2. Location Display Test

1. StoreDetail sahifasiga kirish
2. Sticky header ostida location display ko'rinishi kerak
3. **Kutilgan:** 
   - Avtomatik lokatsiya aniqlanishi
   - Manzil ko'rsatilishi (agar API key bo'lsa)
   - Yoki koordinatalar ko'rsatilishi (agar API key bo'lmasa)

### 3. Location Edit Test

1. Location display'da edit tugmasini bosish
2. **Text Mode:**
   - Manzil yozish (masalan: "Toshkent, Chilonzor")
   - "Saqlash" tugmasini bosish
   - **Kutilgan:** Geocoding ishlashi va koordinatalar olinishi
3. **Map Mode:**
   - "Xarita" tab'ini bosish
   - **Kutilgan:** Google Maps ochilishi (agar API key bo'lsa)
   - Joy tanlash va "Saqlash"

### 4. Error Handling Test

**API Key Yo'q Bo'lsa:**
- Location display: Faqat koordinatalar ko'rsatiladi
- Text mode: Xatolik xabari ko'rsatiladi
- Map mode: "API key topilmadi" xabari ko'rsatiladi

**API Key Noto'g'ri Bo'lsa:**
- Console'da error ko'rsatiladi
- User-friendly xabar ko'rsatiladi

---

## 🐛 Muammolar va Yechimlar

### Muammo 1: API Key Ishlamayapti

**Belgi:** Xarita yuklanmaydi, geocoding ishlamaydi

**Yechim:**
1. `.env` fayl mavjudligini tekshirish
2. `VITE_GOOGLE_MAPS_API_KEY` nomi to'g'riligini tekshirish
3. Server'ni qayta ishga tushirish
4. Browser console'da error'ni tekshirish

### Muammo 2: Location Aniqlanmayapti

**Belgi:** "Lokatsiya topilmadi" ko'rsatiladi

**Yechim:**
1. Browser'da location permission berilganligini tekshirish
2. Telegram Mini App'da location permission so'rash
3. Browser console'da error'ni tekshirish

### Muammo 3: Reverse Geocoding Ishlamayapti

**Belgi:** Koordinatalar ko'rsatiladi, lekin manzil ko'rsatilmaydi

**Yechim:**
1. API key to'g'riligini tekshirish
2. Google Cloud Console'da Geocoding API enable qilinganligini tekshirish
3. Quota tugaganligini tekshirish

---

## 📝 Console'da Tekshirish

Browser console'da quyidagilarni tekshirish:

```javascript
// API key mavjudligini tekshirish
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

// Location cache'ni tekshirish
console.log(localStorage.getItem('localmarket_user_location'))
```

---

## ✅ Test Checklist

- [ ] Sticky header ishlayapti
- [ ] Location avtomatik aniqlanmoqda
- [ ] Location display ko'rsatilmoqda
- [ ] Edit modal ochilmoqda
- [ ] Text mode ishlayapti (geocoding)
- [ ] Map mode ishlayapti (Google Maps)
- [ ] Reverse geocoding ishlayapti
- [ ] Error handling to'g'ri ishlayapti

---

*Status: ✅ API Key integratsiyasi tayyor, test qilish kerak*

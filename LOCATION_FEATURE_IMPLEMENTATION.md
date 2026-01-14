# 📍 Location Feature Implementation Guide

## ✅ Qilingan Ishlar

### 1. Sticky Header ✅
- **Fayl:** `src/pages/StoreDetail.tsx`
- **Xususiyat:** Sahifani pastga tushirganda ham do'kon nomi va share tugmasi yuqorida qoladi
- **Dizayn:** `sticky top-0 z-50` bilan fixed header

### 2. Location Display Komponenti ✅
- **Fayl:** `src/components/LocationDisplay.tsx`
- **Xususiyatlar:**
  - Avtomatik lokatsiyani aniqlash (Telegram API yoki browser geolocation)
  - Reverse geocoding (koordinatalardan manzil olish)
  - Lokatsiyani ko'rsatish va edit qilish imkoniyati
  - Loading state

### 3. Location Edit Modal ✅
- **Fayl:** `src/components/LocationEditModal.tsx`
- **Xususiyatlar:**
  - **Text Mode:** Yozish orqali manzil kiritish
  - **Map Mode:** Google Maps'dan joy tanlash
  - Geocoding (manzildan koordinatalar)
  - Reverse geocoding (koordinatalardan manzil)

### 4. Telegram Location API Integratsiyasi ✅
- **Fayl:** `src/lib/telegram.ts`
- **Xususiyatlar:**
  - Telegram WebApp location API'ni birinchi navbatda ishlatish
  - Browser geolocation fallback
  - Location caching (5 daqiqa)

### 5. StoreDetail.tsx Integratsiyasi ✅
- Sticky header qo'shildi
- LocationDisplay komponenti qo'shildi
- Share funksiyasi qo'shildi

---

## 🔧 Kerakli Ishlar (Siz Bajarasiz)

### 1. Google Maps API Key ⚠️

**Muammo:** Google Maps API key kerak

**Yechim:**
1. Google Cloud Console'ga kirish
2. Yangi project yaratish yoki mavjud project'ni tanlash
3. **Maps JavaScript API** va **Geocoding API** ni enable qilish
4. API key yaratish
5. `.env` fayliga qo'shish:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

**Fayllar:**
- `src/components/LocationDisplay.tsx` - line 30
- `src/components/LocationEditModal.tsx` - lines 30, 91

---

### 2. Telegram Location API Test ⚠️

**Muammo:** Telegram WebApp SDK'da `requestLocation` API mavjudligini tekshirish kerak

**Yechim:**
1. Telegram WebApp SDK versiyasini tekshirish
2. Agar `requestLocation` mavjud bo'lmasa, faqat browser geolocation ishlatish
3. Test qilish: Telegram Mini App'da location permission so'rash

**Fayl:** `src/lib/telegram.ts` - line 220

---

### 3. Google Maps Interactive Map (Ixtiyoriy) 📝

**Hozirgi holat:** Google Maps iframe ishlatilmoqda (static)

**Yaxshilash:**
- Google Maps JavaScript API ishlatish
- Interactive map (marker drag, click to select)
- Real-time location update

**Kerak:**
- Google Maps JavaScript API key
- `@react-google-maps/api` package (yoki vanilla JS)

---

## 📋 Test Qilish

### 1. Sticky Header Test
- [ ] StoreDetail sahifasiga kirish
- [ ] Sahifani pastga scroll qilish
- [ ] Header yuqorida qolishini tekshirish
- [ ] Share tugmasi ishlashini tekshirish

### 2. Location Display Test
- [ ] Avtomatik lokatsiya aniqlanishini tekshirish
- [ ] Lokatsiya ko'rsatilishini tekshirish
- [ ] Edit tugmasini bosish
- [ ] Modal ochilishini tekshirish

### 3. Location Edit Test
- [ ] Text mode - manzil yozish
- [ ] Geocoding ishlashini tekshirish
- [ ] Map mode - Google Maps ochilishini tekshirish
- [ ] Joy tanlash va saqlash

### 4. Telegram Location API Test
- [ ] Telegram Mini App'da location permission so'rash
- [ ] Location olish
- [ ] Fallback (browser geolocation) ishlashini tekshirish

---

## 🐛 Ma'lum Muammolar

### 1. Google Maps API Key Yo'q
**Belgi:** Xarita yuklanmaydi, geocoding ishlamaydi
**Yechim:** API key qo'shish (yuqorida ko'rsatilgan)

### 2. Telegram Location API Mavjud Emas
**Belgi:** Console'da warning
**Yechim:** Browser geolocation fallback ishlaydi (normal)

### 3. Reverse Geocoding Ishlamaydi
**Belgi:** Koordinatalar ko'rsatiladi, lekin manzil ko'rsatilmaydi
**Yechim:** Google Maps Geocoding API key tekshirish

---

## 📝 Keyingi Qadamlar

1. ✅ Google Maps API key qo'shish
2. ✅ Telegram Location API test qilish
3. ✅ Production'da test qilish
4. 📝 Interactive map qo'shish (ixtiyoriy)

---

*Status: ✅ Asosiy funksiyalar tayyor, API key kerak*

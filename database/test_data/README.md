# Test Data

## 📋 Maqsad
Qidiruv, savatcha va recommendation tizimlarini test qilish uchun har bir kategoriyaga namuna listing'lar.

## 🚀 Foydalanish

### Supabase SQL Editor'da:
1. `test_listings.sql` faylini oching
2. Barcha SQL query'larni run qiling
3. Test foydalanuvchilar va listing'lar yaratiladi

## 📊 Test Data Tarkibi

### Test Foydalanuvchilar:
- `1001` - Test Seller 1 (Chilonzor)
- `1002` - Test Seller 2 (Yunusobod)
- `1003` - Test Seller 3 (Mirzo Ulugbek)

### Listing'lar (har bir kategoriyaga 3 ta):
- **Electronics**: iPhone, Samsung, MacBook (3 ta)
- **Furniture**: Divan, Stol/Stullar, Shkaf (3 ta)
- **Clothing**: Kiyimlar, Futbolka, Kurtka (3 ta)
- **Baby & Kids**: O'yinchoqlar, Velosiped, Aravacha (3 ta)
- **Home & Garden**: Bog' uskunalari, Gul idishlari, Dekorlar (3 ta)
- **Games & Hobbies**: PS5, Shaxmat, Gitara (3 ta)
- **Books & Media**: Kitoblar, Elektron kitoblar, Jurnallar (3 ta)
- **Sports & Outdoors**: Velosiped, Futbol to'pi, Fitnes uskunalari (3 ta)
- **Other**: Kamaz, Avtomobil, Telefon, Test listing'lar (4 ta)

**Jami: 28 ta test listing**

## ✅ Test Qilish

### 1. Qidiruv Testi:
- "test" qidiring → "Test E'lon" va "Test Telefon" topilishi kerak
- "telefon" qidiring → telefonlar topilishi kerak
- "kamaz" qidiring → Kamaz topilishi kerak
- "velosiped" qidiring → velosipedlar topilishi kerak

### 2. Savatcha Testi:
- Biror listing'ni savatchaga qo'shing
- Cart sahifasida ko'rinishi kerak
- Cart count badge yangilanadi

### 3. Recommendation Testi:
- "telefon" qidiring
- Keyin home page'ga kiring
- "Siz uchun" tab'ida telefonlar birinchi o'rinlarda bo'lishi kerak
- Listing'ga kiring → o'xshash listing'lar ko'rsatilishi kerak

### 4. Analytics Testi:
- MyListings sahifasiga kiring (seller bo'lsangiz)
- Listing analytics ko'rinishi kerak (view count, favorite count)

## 🔧 Data O'chirish (Agar kerak bo'lsa)

```sql
-- Test listing'larni o'chirish
DELETE FROM listings WHERE seller_telegram_id IN (1001, 1002, 1003);

-- Test foydalanuvchilarni o'chirish
DELETE FROM users WHERE telegram_user_id IN (1001, 1002, 1003);
```

## 📝 Eslatmalar

- Barcha listing'lar "active" holatda
- View count va favorite count ham test qilish uchun qo'shilgan
- Turli sanalar bilan yaratilgan (personalization test qilish uchun)
- Turli mahallalarda (location test qilish uchun)

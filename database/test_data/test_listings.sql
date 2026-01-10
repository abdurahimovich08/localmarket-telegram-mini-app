-- Test Data: Har bir kategoriyaga namuna listing'lar
-- Test qilish uchun: qidiruv, savatcha, recommendation

-- Avval bir nechta test foydalanuvchilarni yaratamiz (agar mavjud bo'lmasa)
INSERT INTO users (telegram_user_id, username, first_name, last_name, search_radius_miles, is_premium, rating_average, total_reviews, items_sold_count, created_at)
VALUES 
  (1001, 'test_seller1', 'Test', 'Seller 1', 10, false, 4.5, 10, 5, NOW()),
  (1002, 'test_seller2', 'Test', 'Seller 2', 10, false, 4.8, 25, 12, NOW()),
  (1003, 'test_seller3', 'Test', 'Seller 3', 10, false, 4.2, 8, 3, NOW())
ON CONFLICT (telegram_user_id) DO NOTHING;

-- Electronics kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1001, 'iPhone 13 Pro Max', 'Yaxshi holatda iPhone 13 Pro Max, 256GB. Barcha aksessuarlar bilan. Tekshirish uchun tushuniladi.', 8500000, false, 'electronics', 'like_new', 
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 45, 8, NOW() - INTERVAL '2 days'),
  
  (1002, 'Samsung Galaxy S21', 'Yangi Samsung Galaxy S21, 128GB. Quti va aksessuarlari bilan birga. Sotiladi.', 6500000, false, 'electronics', 'new',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 32, 5, NOW() - INTERVAL '1 day'),
  
  (1003, 'MacBook Pro 2020', 'MacBook Pro 13 inch, M1 chip, 8GB RAM, 256GB SSD. Ish holatida, tekshirish mumkin.', 12000000, false, 'electronics', 'good',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 67, 12, NOW() - INTERVAL '5 days');

-- Furniture kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1001, 'Yangi Divan', 'Yangi divan, 3 o\'rinli, qulay va chiroyli. Uyga mos keladi.', 2500000, false, 'furniture', 'new',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 28, 4, NOW() - INTERVAL '3 days'),
  
  (1002, 'Oshxona Stol va Stullar', 'Oshxona uchun stol va 4 ta stul. Yaxshi holatda. Tekshirish mumkin.', 800000, false, 'furniture', 'good',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 19, 3, NOW() - INTERVAL '1 day'),
  
  (1001, 'Yotoqxona Shkafi', 'Katta shkaf, 3 eshikli. Yotoqxona uchun juda qulay.', 1500000, false, 'furniture', 'like_new',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 35, 6, NOW() - INTERVAL '4 days');

-- Clothing kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1003, 'Yangi Kiyimlar', 'Yangi kiyimlar to\'plami. Turli o\'lchamlar mavjud. Narxlar arzon.', 150000, false, 'clothing', 'new',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 41, 7, NOW() - INTERVAL '2 days'),
  
  (1002, 'Olimpiada Futbolka', 'Original futbolka, yangi. Xotira uchun.', 80000, false, 'clothing', 'new',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 22, 3, NOW() - INTERVAL '1 day'),
  
  (1001, 'Qishki Kurtka', 'Qalin kurtka, qish uchun. Yaxshi holatda.', 300000, false, 'clothing', 'good',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 18, 2, NOW() - INTERVAL '6 days');

-- Baby & Kids kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1002, 'Bolalar O\'yinchoqlari', 'Ko\'plab o\'yinchoqlar. Yaxshi holatda. Sotiladi.', 200000, false, 'baby_kids', 'good',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 24, 5, NOW() - INTERVAL '3 days'),
  
  (1003, 'Bolalar Velosipedi', 'Yangi velosiped, 5 yosh uchun. Tekshirish mumkin.', 1200000, false, 'baby_kids', 'like_new',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 31, 8, NOW() - INTERVAL '2 days'),
  
  (1001, 'Aravacha', 'Bolalar aravachasi, ishlatilmagan. Yangi holatda.', 600000, false, 'baby_kids', 'new',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 15, 4, NOW() - INTERVAL '1 day');

-- Home & Garden kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1001, 'Bog\' Uskunalari', 'Bog\' uchun asboblar va uskunalar. Hohlagan narsangizni tanlashingiz mumkin.', 500000, false, 'home_garden', 'good',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 20, 3, NOW() - INTERVAL '4 days'),
  
  (1002, 'Gul Idishlari', 'Turli o\'lchamdagi gul idishlari. Bog\' uchun.', 80000, false, 'home_garden', 'new',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 14, 2, NOW() - INTERVAL '2 days'),
  
  (1003, 'Uy Dekorlari', 'Uy bezak buyumlari. Chiroyli va zamonaviy.', 250000, false, 'home_garden', 'like_new',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 26, 5, NOW() - INTERVAL '3 days');

-- Games & Hobbies kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1002, 'PlayStation 5', 'PS5 konsol, yangi. Quti va aksessuarlari bilan.', 8500000, false, 'games_hobbies', 'new',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 89, 15, NOW() - INTERVAL '1 day'),
  
  (1001, 'Shaxmat To\'plami', 'Zamonaviy shaxmat to\'plami. Professional uchun.', 150000, false, 'games_hobbies', 'new',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 12, 1, NOW() - INTERVAL '5 days'),
  
  (1003, 'Gitara', 'Akustik gitara, yangi holatda. O\'rganish uchun juda qulay.', 1800000, false, 'games_hobbies', 'like_new',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 38, 6, NOW() - INTERVAL '2 days');

-- Books & Media kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1001, 'Kitoblar Kolleksiyasi', 'Turli kitoblar. Darsliklar, romanlar va boshqalar.', 200000, false, 'books_media', 'good',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 16, 2, NOW() - INTERVAL '3 days'),
  
  (1003, 'Elektron Kitob O\'qish', 'Kindle yoki shunga o\'xshash qurilma uchun kitoblar.', 50000, false, 'books_media', 'new',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 9, 1, NOW() - INTERVAL '4 days'),
  
  (1002, 'Jurnallar', 'Eski jurnallar, kolleksiya uchun.', 30000, false, 'books_media', 'fair',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 7, 0, NOW() - INTERVAL '6 days');

-- Sports & Outdoors kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1002, 'Velosiped', 'Shahar velosipedi, yaxshi holatda. Tekshirish mumkin.', 2500000, false, 'sports_outdoors', 'good',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 52, 9, NOW() - INTERVAL '1 day'),
  
  (1001, 'Futbol To\'pi', 'Original futbol to\'pi. Professional sifat.', 250000, false, 'sports_outdoors', 'new',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 19, 3, NOW() - INTERVAL '2 days'),
  
  (1003, 'Fitnes Uskunalari', 'Uy uchun fitnes uskunalari. Dumbbell va boshqalar.', 800000, false, 'sports_outdoors', 'good',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 29, 4, NOW() - INTERVAL '3 days');

-- Other kategoriyasi
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1001, 'Kamaz Yuk Mashinasi', 'Kamaz yuk mashinasi, ishlatilgan lekin ishlatishga yaroqli. Tekshirish mumkin.', 85000000, false, 'other', 'fair',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 127, 23, NOW() - INTERVAL '2 days'),
  
  (1002, 'Avtomobil', 'Yaxshi holatda avtomobil, mamlakat ichida yurish uchun.', 45000000, false, 'other', 'good',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 94, 18, NOW() - INTERVAL '1 day'),
  
  (1003, 'Telefon', 'Eski telefon, ishlatishga yaroqli. Narx arzon.', 500000, false, 'other', 'fair',
   ARRAY[]::TEXT[], 'Mirzo Ulugbek', 41.3156, 69.2949, 'active', 33, 5, NOW() - INTERVAL '3 days'),
  
  -- Test uchun maxsus listing - "test" nomi bilan
  (1001, 'Test E\'lon', 'Bu test e\'loni. Qidiruv tizimini sinash uchun yaratilgan.', 100000, false, 'other', 'new',
   ARRAY[]::TEXT[], 'Chilonzor', 41.3111, 69.2797, 'active', 5, 1, NOW());

-- Muammo: "test" nomini qidirishda topilishi kerak
-- Bu listing allaqachon qo'shildi

-- Ko'proq "test" variantlari
INSERT INTO listings (
  seller_telegram_id, title, description, price, is_free, category, condition,
  photos, neighborhood, latitude, longitude, status, view_count, favorite_count, created_at
) VALUES
  (1002, 'Test Telefon', 'Test uchun telefon, ishlaydi.', 200000, false, 'electronics', 'good',
   ARRAY[]::TEXT[], 'Yunusobod', 41.3498, 69.2849, 'active', 8, 2, NOW() - INTERVAL '1 hour');

-- Message: Test data yaratildi
-- Har bir kategoriyaga kamida 3 ta listing qo'shildi
-- Qidiruv, savatcha va recommendation tizimlarini test qilish mumkin

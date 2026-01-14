-- RLS Owner Check Test
-- Migration boshlashdan oldin RLS policies to'g'ri ishlayotganini tekshirish

-- ⚠️ MUHIM: Bu testlarni Supabase SQL Editor'da bajarishdan oldin
-- "anon" key bilan test qilish kerak (production'da ham shunday ishlaydi)

-- 1. Test: Owner bo'lmagan user listing'ni update qilish
-- Kutilgan: RLS block bo'lsin
-- 
-- SQL Editor'da "anon" key bilan:
-- UPDATE listings SET title = 'Hacked' WHERE listing_id = 'some-other-user-listing-id';
-- 
-- Kutilgan natija: ERROR: new row violates row-level security policy

-- 2. Test: Owner listing'ni update qilish
-- Kutilgan: O'tishi kerak
--
-- SQL Editor'da o'z listing_id bilan:
-- UPDATE listings SET title = 'Updated' WHERE listing_id = 'my-listing-id' AND seller_telegram_id = my_telegram_id;
--
-- Kutilgan natija: UPDATE 1

-- 3. Test: Owner bo'lmagan user store'ni update qilish
-- Kutilgan: RLS block bo'lsin
--
-- UPDATE stores SET name = 'Hacked Store' WHERE store_id = 'some-other-user-store-id';
--
-- Kutilgan natija: ERROR: new row violates row-level security policy

-- 4. Test: Owner store'ni update qilish
-- Kutilgan: O'tishi kerak
--
-- UPDATE stores SET name = 'Updated Store' WHERE store_id = 'my-store-id' AND owner_telegram_id = my_telegram_id;
--
-- Kutilgan natija: UPDATE 1

-- 5. Test: Owner bo'lmagan user store_category yaratish
-- Kutilgan: RLS block bo'lsin
--
-- INSERT INTO store_categories (store_id, title, emoji, order_index, is_active)
-- VALUES ('some-other-user-store-id', 'Hacked Category', '🔴', 1, true);
--
-- Kutilgan natija: ERROR: new row violates row-level security policy

-- 6. Test: Owner store_category yaratish
-- Kutilgan: O'tishi kerak
--
-- INSERT INTO store_categories (store_id, title, emoji, order_index, is_active)
-- VALUES ('my-store-id', 'My Category', '✅', 1, true);
--
-- Kutilgan natija: INSERT 0 1

-- 7. Test: Owner bo'lmagan user listing'ni o'chirish
-- Kutilgan: RLS block bo'lsin
--
-- DELETE FROM listings WHERE listing_id = 'some-other-user-listing-id';
--
-- Kutilgan natija: ERROR: new row violates row-level security policy

-- 8. Test: Owner listing'ni o'chirish
-- Kutilgan: O'tishi kerak
--
-- DELETE FROM listings WHERE listing_id = 'my-listing-id' AND seller_telegram_id = my_telegram_id;
--
-- Kutilgan natija: DELETE 1

-- ⚠️ Eslatma: Bu testlarni UI'dan ham qilish kerak, lekin SQL testlar erta xatolarni ushlaydi

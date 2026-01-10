-- ============================================
-- RLS TEST UCHUN VAQTINCHA DISABLE QILISH
-- ============================================
-- 
-- MUHIM: Bu faqat test uchun!
-- Agar RLS disabled qilgandan keyin muammo yo'qolsa,
-- bu RLS + connection pooling muammosini tasdiqlaydi
--
-- FOYDALANISH:
-- 1. Bu faylni Supabase SQL Editor'da bajarish
-- 2. App'ni test qilish
-- 3. Agar ishlasa - RLS muammo ekan
-- 4. Keyin RLS ni qayta yoqish va query'larni optimizatsiya qilish
--
-- PRODUCTION'DA HECH QACHON RLS NI DISABLE QILMANG!
-- ============================================

-- Disable RLS on all tables (TEST ONLY)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_listing_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_last_seen DISABLE ROW LEVEL SECURITY;

-- ============================================
-- QAYTA YOQISH UCHUN:
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
-- ... va hokazo
--
-- Yoki MIGRATION_COMPLETE.sql ni qayta bajarish

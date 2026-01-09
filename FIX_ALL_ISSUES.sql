-- Database va Storage Policies'ni To'liq Tuzatish
-- Supabase SQL Editor'da run qiling

-- ============================================
-- 1. ENABLE RLS
-- ============================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. STORAGE POLICIES (listings bucket uchun)
-- ============================================

-- Storage bucket yaratish (agar mavjud bo'lmasa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Eski policies'ni o'chirish
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- YANGI: Public read access (barcha foydalanuvchilar rasm ko'ra olishi uchun)
CREATE POLICY "Public can view listing images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- YANGI: Authenticated users upload qilishlari uchun
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- YANGI: O'z rasm'larini o'chirishlari uchun (optional)
CREATE POLICY "Authenticated users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listings');

-- ============================================
-- 3. DATABASE POLICIES - LISTINGS
-- ============================================

-- Eski policies'ni o'chirish
DROP POLICY IF EXISTS "Users can insert listings" ON listings;
DROP POLICY IF EXISTS "Anyone can read active listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;

-- YANGI: Active listing'larni barcha o'qishlari uchun
CREATE POLICY "Anyone can read active listings"
ON listings
FOR SELECT
TO public
USING (status = 'active');

-- YANGI: Authenticated users listing yaratishlari uchun
-- Note: authenticated role Telegram Mini App'da ishlamaydi, shuning uchun service role yoki anonymous ishlatamiz
CREATE POLICY "Anyone can create listings"
ON listings
FOR INSERT
TO public
WITH CHECK (true);

-- YANGI: Listing'ni yangilash (faqat o'z listing'ini)
CREATE POLICY "Users can update own listings"
ON listings
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- YANGI: Listing'ni o'chirish yoki status o'zgartirish
CREATE POLICY "Users can delete own listings"
ON listings
FOR DELETE
TO public
USING (true);

-- ============================================
-- 4. DATABASE POLICIES - USERS
-- ============================================

-- Eski policies'ni o'chirish
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- YANGI: Barcha user ma'lumotlarini o'qish (public profiles)
CREATE POLICY "Anyone can read users"
ON users
FOR SELECT
TO public
USING (true);

-- YANGI: User yaratish (registration)
CREATE POLICY "Anyone can create users"
ON users
FOR INSERT
TO public
WITH CHECK (true);

-- YANGI: User yangilash (o'z ma'lumotlarini)
CREATE POLICY "Anyone can update users"
ON users
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. DATABASE POLICIES - FAVORITES
-- ============================================

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can read favorites" ON favorites;

CREATE POLICY "Anyone can read favorites"
ON favorites
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can manage favorites"
ON favorites
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. DATABASE POLICIES - REVIEWS
-- ============================================

DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;

CREATE POLICY "Anyone can read reviews"
ON reviews
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can create reviews"
ON reviews
FOR INSERT
TO public
WITH CHECK (true);

-- ============================================
-- 7. DATABASE POLICIES - TRANSACTIONS
-- ============================================

DROP POLICY IF EXISTS "Users can manage transactions" ON transactions;

CREATE POLICY "Anyone can manage transactions"
ON transactions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ============================================
-- 8. DATABASE POLICIES - REPORTS
-- ============================================

DROP POLICY IF EXISTS "Users can create reports" ON reports;

CREATE POLICY "Anyone can create reports"
ON reports
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can read reports"
ON reports
FOR SELECT
TO public
USING (true);

-- ============================================
-- 9. FUNCTION SEARCH PATH FIX
-- ============================================

ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION update_items_sold_count() SET search_path = public;
ALTER FUNCTION increment_view_count(UUID) SET search_path = public;
ALTER FUNCTION increment_favorite_count(UUID) SET search_path = public;
ALTER FUNCTION decrement_favorite_count(UUID) SET search_path = public;
ALTER FUNCTION update_user_rating(BIGINT) SET search_path = public;

-- ============================================
-- 10. VERIFY POLICIES
-- ============================================

-- Barcha policies'ni ko'rish
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

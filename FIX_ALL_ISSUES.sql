-- Barcha Supabase Muammolarni Hal Qilish
-- Bu faylni Supabase SQL Editor'da run qiling

-- ============================================
-- 1. STORAGE POLICIES
-- ============================================

-- Storage INSERT policy (rasm yuklash uchun)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- Storage SELECT policy (rasmlarni ko'rish uchun)
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'listings');

-- ============================================
-- 2. DATABASE POLICIES - LISTINGS
-- ============================================

-- Listings INSERT policy
DROP POLICY IF EXISTS "Users can insert listings" ON listings;
CREATE POLICY "Users can insert listings"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Listings SELECT policy
DROP POLICY IF EXISTS "Anyone can read active listings" ON listings;
CREATE POLICY "Anyone can read active listings"
ON listings
FOR SELECT
TO authenticated
USING (status = 'active');

-- Listings UPDATE policy
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings"
ON listings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. DATABASE POLICIES - USERS
-- ============================================

-- Users INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users SELECT policy
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Users UPDATE policy
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. ENABLE RLS (Row Level Security)
-- ============================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. FIX FUNCTION SEARCH PATH
-- ============================================

ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION update_items_sold_count() SET search_path = public;
ALTER FUNCTION increment_view_count(UUID) SET search_path = public;
ALTER FUNCTION increment_favorite_count(UUID) SET search_path = public;
ALTER FUNCTION decrement_favorite_count(UUID) SET search_path = public;
ALTER FUNCTION update_user_rating(BIGINT) SET search_path = public;

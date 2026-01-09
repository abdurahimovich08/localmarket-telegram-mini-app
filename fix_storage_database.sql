-- Storage va Database Policies Sozlash
-- Supabase SQL Editor'da run qiling

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

-- Listings INSERT policy (listing yaratish uchun)
DROP POLICY IF EXISTS "Users can insert listings" ON listings;
CREATE POLICY "Users can insert listings"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Listings SELECT policy (listing'larni o'qish uchun)
DROP POLICY IF EXISTS "Anyone can read active listings" ON listings;
CREATE POLICY "Anyone can read active listings"
ON listings
FOR SELECT
TO authenticated
USING (status = 'active');

-- Listings UPDATE policy (listing yangilash uchun)
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

-- Users INSERT policy (user yaratish uchun)
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users SELECT policy (user ma'lumotlarini o'qish uchun)
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Users UPDATE policy (user ma'lumotlarini yangilash uchun)
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. ALTERNATIVE: RLS'ni O'chirish (Development uchun)
-- ============================================
-- Agar yukoridagi policy'lar ishlamasa, development uchun RLS'ni o'chirishingiz mumkin:

-- ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. TEKSHIRISH
-- ============================================

-- Storage policies'ni tekshirish
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Database policies'ni tekshirish
SELECT * FROM pg_policies WHERE tablename IN ('listings', 'users');

-- Database va Storage Connection Test
-- Supabase SQL Editor'da run qiling

-- ============================================
-- 1. Database Tables Tekshirish
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. Users Table Ma'lumotlarini Tekshirish
-- ============================================
SELECT 
  telegram_user_id,
  username,
  first_name,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 3. Listings Table Ma'lumotlarini Tekshirish
-- ============================================
SELECT 
  listing_id,
  seller_telegram_id,
  title,
  status,
  created_at
FROM listings
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 4. RLS Status Tekshirish
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'listings', 'favorites', 'reviews', 'transactions', 'reports')
ORDER BY tablename;

-- ============================================
-- 5. RLS Policies Tekshirish
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- ============================================
-- 6. Storage Bucket Tekshirish
-- ============================================
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'listings';

-- ============================================
-- 7. Storage Policies Tekshirish
-- ============================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- 8. Test INSERT (agar kerak bo'lsa)
-- ============================================
-- Test user yaratish (agar mavjud bo'lmasa)
-- INSERT INTO users (telegram_user_id, first_name, username)
-- VALUES (123456789, 'Test User', 'testuser')
-- ON CONFLICT (telegram_user_id) DO NOTHING;

-- Test listing yaratish (agar user mavjud bo'lsa)
-- INSERT INTO listings (
--   seller_telegram_id,
--   title,
--   description,
--   category,
--   condition,
--   is_free,
--   status
-- )
-- VALUES (
--   123456789,
--   'Test Listing',
--   'This is a test listing',
--   'other',
--   'good',
--   true,
--   'active'
-- )
-- ON CONFLICT DO NOTHING;

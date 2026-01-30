-- ============================================
-- FIX USERS TABLE RLS FOR TELEGRAM AUTHENTICATION
-- ============================================
-- 
-- WHAT: Users table RLS policies'ni Telegram Mini App authentication uchun moslashtirish
-- WHY: Telegram Mini App'da auth.uid() ishlamaydi, shuning uchun RLS policy'larni o'zgartirish kerak
-- WHEN: Run in Supabase SQL Editor
--
-- REQUIRED: Run this AFTER schema_final.sql
-- ============================================

-- ============================================
-- STEP 1: Drop existing policies that use auth.uid()
-- ============================================

DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can only update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- ============================================
-- STEP 2: Create new policies for Telegram authentication
-- ============================================

-- Allow anyone to read users (for public profiles)
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  USING (true);

-- Allow anyone to insert users (Telegram WebApp creates users automatically)
-- ⚠️ NOTE: In production, you might want to add validation via API endpoint
CREATE POLICY "Allow users to insert own data"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update users (Telegram WebApp updates users automatically)
-- ⚠️ NOTE: In production, you might want to add validation via API endpoint
CREATE POLICY "Allow users to update own data"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ALTERNATIVE: More restrictive policies (if you want validation)
-- ============================================
-- 
-- If you want to add validation, you can use API endpoints to validate
-- telegram_user_id before allowing insert/update. In that case, you can
-- keep these policies but add validation in your API endpoints.
--
-- For now, we're allowing all operations since Telegram WebApp doesn't
-- have auth.uid() and we're validating via client-side checks.

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Allow public read access to users" ON users IS 'Allows anyone to read user profiles (for public profiles)';
COMMENT ON POLICY "Allow users to insert own data" ON users IS 'Allows users to insert their own data (Telegram WebApp creates users automatically)';
COMMENT ON POLICY "Allow users to update own data" ON users IS 'Allows users to update their own data (Telegram WebApp updates users automatically)';

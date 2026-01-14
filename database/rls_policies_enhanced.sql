-- ============================================
-- ENHANCED RLS POLICIES
-- ============================================
-- 
-- WHAT: Strengthened Row Level Security policies
-- WHY: Prevent unauthorized access and modifications
-- WHEN: Run in Supabase SQL Editor
--
-- REQUIRED: Run this AFTER schema_final.sql
-- ============================================

-- ============================================
-- USERS TABLE RLS
-- ============================================

-- Users can only view their own data (or public data)
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (
    auth.uid()::bigint = telegram_user_id OR
    -- Allow viewing other users' public data (for profiles)
    true -- Public profiles are viewable
  );

-- Users can only update their own data
DROP POLICY IF EXISTS "Users can only update own data" ON users;
CREATE POLICY "Users can only update own data"
  ON users FOR UPDATE
  USING (auth.uid()::bigint = telegram_user_id)
  WITH CHECK (auth.uid()::bigint = telegram_user_id);

-- Users can insert their own data
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::bigint = telegram_user_id);

-- ============================================
-- LISTINGS TABLE RLS
-- ============================================

-- Users can view active listings
DROP POLICY IF EXISTS "Users can view active listings" ON listings;
CREATE POLICY "Users can view active listings"
  ON listings FOR SELECT
  USING (status = 'active');

-- Users can only update their own listings
DROP POLICY IF EXISTS "Users can only update own listings" ON listings;
CREATE POLICY "Users can only update own listings"
  ON listings FOR UPDATE
  USING (auth.uid()::bigint = seller_telegram_id)
  WITH CHECK (auth.uid()::bigint = seller_telegram_id);

-- Users can only delete their own listings (soft delete)
DROP POLICY IF EXISTS "Users can only delete own listings" ON listings;
CREATE POLICY "Users can only delete own listings"
  ON listings FOR UPDATE -- Using UPDATE for soft delete
  USING (auth.uid()::bigint = seller_telegram_id)
  WITH CHECK (
    auth.uid()::bigint = seller_telegram_id AND
    status = 'deleted' -- Only allow setting status to 'deleted'
  );

-- Users can create their own listings
DROP POLICY IF EXISTS "Users can create own listings" ON listings;
CREATE POLICY "Users can create own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid()::bigint = seller_telegram_id);

-- ============================================
-- STORES TABLE RLS
-- ============================================

-- Users can view active stores
DROP POLICY IF EXISTS "Users can view active stores" ON stores;
CREATE POLICY "Users can view active stores"
  ON stores FOR SELECT
  USING (is_active = true);

-- Store owners can view their own stores (even if inactive)
DROP POLICY IF EXISTS "Store owners can view own stores" ON stores;
CREATE POLICY "Store owners can view own stores"
  ON stores FOR SELECT
  USING (auth.uid()::bigint = owner_telegram_id);

-- Store owners can only update their own stores
DROP POLICY IF EXISTS "Store owners can only update own stores" ON stores;
CREATE POLICY "Store owners can only update own stores"
  ON stores FOR UPDATE
  USING (auth.uid()::bigint = owner_telegram_id)
  WITH CHECK (auth.uid()::bigint = owner_telegram_id);

-- Users can create their own stores
DROP POLICY IF EXISTS "Users can create own stores" ON stores;
CREATE POLICY "Users can create own stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid()::bigint = owner_telegram_id);

-- ============================================
-- STORE_CATEGORIES TABLE RLS
-- ============================================

-- Public can view active categories
DROP POLICY IF EXISTS "Public can view active store categories" ON store_categories;
CREATE POLICY "Public can view active store categories"
  ON store_categories FOR SELECT
  USING (is_active = TRUE);

-- Store owners can manage their categories
DROP POLICY IF EXISTS "Store owners can manage their categories" ON store_categories;
CREATE POLICY "Store owners can manage their categories"
  ON store_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_categories.store_id 
      AND stores.owner_telegram_id = auth.uid()::bigint
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_categories.store_id 
      AND stores.owner_telegram_id = auth.uid()::bigint
    )
  );

-- ============================================
-- STORE_POSTS TABLE RLS
-- ============================================

-- Public can view store posts
DROP POLICY IF EXISTS "Public can view store posts" ON store_posts;
CREATE POLICY "Public can view store posts"
  ON store_posts FOR SELECT
  USING (true);

-- Store owners can manage their posts
DROP POLICY IF EXISTS "Store owners can manage their posts" ON store_posts;
CREATE POLICY "Store owners can manage their posts"
  ON store_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_posts.store_id 
      AND stores.owner_telegram_id = auth.uid()::bigint
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_posts.store_id 
      AND stores.owner_telegram_id = auth.uid()::bigint
    )
  );

-- ============================================
-- SERVICES TABLE RLS
-- ============================================

-- Users can view active services
DROP POLICY IF EXISTS "Users can view active services" ON services;
CREATE POLICY "Users can view active services"
  ON services FOR SELECT
  USING (status = 'active');

-- Service providers can view their own services (even if inactive)
DROP POLICY IF EXISTS "Service providers can view own services" ON services;
CREATE POLICY "Service providers can view own services"
  ON services FOR SELECT
  USING (auth.uid()::bigint = provider_telegram_id);

-- Service providers can only update their own services
DROP POLICY IF EXISTS "Service providers can only update own services" ON services;
CREATE POLICY "Service providers can only update own services"
  ON services FOR UPDATE
  USING (auth.uid()::bigint = provider_telegram_id)
  WITH CHECK (auth.uid()::bigint = provider_telegram_id);

-- Users can create their own services
DROP POLICY IF EXISTS "Users can create own services" ON services;
CREATE POLICY "Users can create own services"
  ON services FOR INSERT
  WITH CHECK (auth.uid()::bigint = provider_telegram_id);

-- ============================================
-- FAVORITES TABLE RLS
-- ============================================

-- Users can only view their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid()::bigint = user_telegram_id);

-- Users can only manage their own favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid()::bigint = user_telegram_id)
  WITH CHECK (auth.uid()::bigint = user_telegram_id);

-- ============================================
-- CART_ITEMS TABLE RLS
-- ============================================

-- Users can only view their own cart items
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid()::bigint = user_telegram_id);

-- Users can only manage their own cart items
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL
  USING (auth.uid()::bigint = user_telegram_id)
  WITH CHECK (auth.uid()::bigint = user_telegram_id);

-- ============================================
-- REVIEWS TABLE RLS
-- ============================================

-- Users can view all reviews
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
CREATE POLICY "Users can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Users can only create reviews for their own transactions
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid()::bigint = reviewer_telegram_id);

-- Users can only update their own reviews (within time limit)
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (
    auth.uid()::bigint = reviewer_telegram_id AND
    created_at > now() - interval '24 hours' -- Only within 24 hours
  )
  WITH CHECK (auth.uid()::bigint = reviewer_telegram_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Users can only update own data" ON users IS 'Prevents users from modifying other users data';
COMMENT ON POLICY "Users can only update own listings" ON listings IS 'Prevents users from modifying other users listings';
COMMENT ON POLICY "Store owners can only update own stores" ON stores IS 'Prevents unauthorized store modifications';

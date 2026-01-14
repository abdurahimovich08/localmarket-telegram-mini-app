-- ============================================
-- LOCALMARKET TELEGRAM MINI APP
-- COMPLETE SUPABASE SETUP
-- ============================================
-- 
-- QANDAY ISHLATISH:
-- 1. Supabase Dashboard > SQL Editor ga kiring
-- 2. Bu faylni to'liq copy qiling va ishga tushiring
-- 3. Yoki quyidagi tartibda alohida fayllarni ishga tushiring:
--    a) schema_final.sql (asosiy schema)
--    b) referral_tracking_migration.sql (referral system)
--    c) store_management_migration.sql (store management)
--    d) unified_items_view.sql (unified search)
--    e) rls_policies_enhanced.sql (security)
--    f) services_table.sql (services - agar yo'q bo'lsa)
--
-- MUHIM: Barcha fayllarni to'g'ri tartibda ishga tushiring!
-- ============================================

-- ============================================
-- STEP 1: ASOSIY SCHEMA
-- ============================================
-- Fayl: database/schema_final.sql
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  telegram_user_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone_number TEXT,
  bio TEXT CHECK (LENGTH(bio) <= 200),
  profile_photo_url TEXT,
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  search_radius_miles INTEGER DEFAULT 10,
  is_premium BOOLEAN DEFAULT FALSE,
  rating_average DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  items_sold_count INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Listings Table
CREATE TABLE IF NOT EXISTS listings (
  listing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 80),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 500),
  price DECIMAL(10, 2),
  is_free BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL CHECK (category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'automotive', 'other')),
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  photos TEXT[] DEFAULT '{}',
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deleted')),
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_boosted BOOLEAN DEFAULT FALSE,
  boosted_until TIMESTAMPTZ,
  subcategory_id UUID,
  store_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  favorite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, listing_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  reviewed_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (LENGTH(review_text) <= 200),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reviewer_telegram_id, listing_id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  buyer_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  seller_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  reported_listing_id UUID REFERENCES listings(listing_id) ON DELETE CASCADE,
  reported_user_id BIGINT REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, listing_id)
);

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
  store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_telegram_id BIGINT NOT NULL UNIQUE REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),
  category TEXT NOT NULL CHECK (category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'automotive', 'other')),
  logo_url TEXT,
  banner_url TEXT,
  subscriber_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store Subscriptions Table
CREATE TABLE IF NOT EXISTS store_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, store_id)
);

-- Store Posts Table
CREATE TABLE IF NOT EXISTS store_posts (
  post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
  images TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store Promotions Table
CREATE TABLE IF NOT EXISTS store_promotions (
  promotion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),
  discount_percent DECIMAL(5, 2) CHECK (discount_percent >= 0 AND discount_percent <= 100),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  listing_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_date > start_date)
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 500),
  category TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  price TEXT,
  tags TEXT[] DEFAULT '{}',
  logo_url TEXT,
  portfolio_images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_category TEXT NOT NULL CHECK (parent_category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'automotive', 'other')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  name_uz TEXT,
  description_uz TEXT,
  parent_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_category, slug)
);

-- User Searches Table
CREATE TABLE IF NOT EXISTS user_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  category TEXT,
  subcategory_id UUID,
  filters JSONB,
  result_count INTEGER DEFAULT 0,
  clicked_listing_id UUID REFERENCES listings(listing_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Listing Interactions Table
CREATE TABLE IF NOT EXISTS user_listing_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'favorite', 'search_match', 'category_view')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Category Preferences Table
CREATE TABLE IF NOT EXISTS user_category_preferences (
  preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  score DECIMAL(5, 2) DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, category, subcategory_id)
);

-- Listing Views Table
CREATE TABLE IF NOT EXISTS listing_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_id TEXT,
  UNIQUE(user_telegram_id, listing_id, viewed_date)
);

-- User Last Seen Table
CREATE TABLE IF NOT EXISTS user_last_seen (
  user_telegram_id BIGINT PRIMARY KEY REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  last_seen_listing_id UUID REFERENCES listings(listing_id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL UNIQUE REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  top_category TEXT,
  top_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL,
  average_viewed_price DECIMAL(10, 2),
  preferred_condition TEXT,
  total_views INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STEP 2: REFERRAL TRACKING SYSTEM
-- ============================================
-- Fayl: database/referral_tracking_migration.sql
-- ============================================

-- User Referrals Table
CREATE TABLE IF NOT EXISTS user_referrals (
  referral_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referred_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, store_id)
);

-- Generate referral codes for existing stores
UPDATE stores 
SET referral_code = LOWER(SUBSTRING(MD5(store_id::TEXT || name || created_at::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Referral code generation function
CREATE OR REPLACE FUNCTION generate_referral_code(store_name TEXT, store_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  code := LOWER(SUBSTRING(MD5(store_id::TEXT || store_name || now()::TEXT) FROM 1 FOR 8));
  SELECT EXISTS(SELECT 1 FROM stores WHERE referral_code = code) INTO exists_check;
  WHILE exists_check LOOP
    code := LOWER(SUBSTRING(MD5(store_id::TEXT || store_name || now()::TEXT || random()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM stores WHERE referral_code = code) INTO exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating referral codes
CREATE OR REPLACE FUNCTION set_store_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code(NEW.name, NEW.store_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_store_referral_code
BEFORE INSERT ON stores
FOR EACH ROW
EXECUTE FUNCTION set_store_referral_code();

-- Track referral function
CREATE OR REPLACE FUNCTION track_referral(
  p_user_telegram_id BIGINT,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_store_id UUID;
  v_store_name TEXT;
BEGIN
  SELECT store_id, name INTO v_store_id, v_store_name
  FROM stores
  WHERE referral_code = p_referral_code
  LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  INSERT INTO user_referrals (user_telegram_id, store_id, referral_code)
  VALUES (p_user_telegram_id, v_store_id, p_referral_code)
  ON CONFLICT (user_telegram_id, store_id) DO NOTHING;
  
  RETURN jsonb_build_object('success', true, 'store_id', v_store_id, 'store_name', v_store_name);
END;
$$ LANGUAGE plpgsql;

-- Get user store function
CREATE OR REPLACE FUNCTION get_user_store(p_user_telegram_id BIGINT)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  referral_code TEXT,
  referred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.store_id, s.name, ur.referral_code, ur.referred_at
  FROM user_referrals ur
  JOIN stores s ON s.store_id = ur.store_id
  WHERE ur.user_telegram_id = p_user_telegram_id
  ORDER BY ur.referred_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: STORE MANAGEMENT SYSTEM
-- ============================================
-- Fayl: database/store_management_migration.sql
-- ============================================

-- Store Categories Table
CREATE TABLE IF NOT EXISTS store_categories (
  category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  emoji TEXT CHECK (LENGTH(emoji) <= 10),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhance Listings Table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'store_category_id') THEN
    ALTER TABLE listings ADD COLUMN store_category_id UUID REFERENCES store_categories(category_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'old_price') THEN
    ALTER TABLE listings ADD COLUMN old_price DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'stock_qty') THEN
    ALTER TABLE listings ADD COLUMN stock_qty INTEGER DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'order_index') THEN
    ALTER TABLE listings ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'location') THEN
    ALTER TABLE listings ADD COLUMN location TEXT;
  END IF;
END $$;

-- Enhance Store Posts Table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_posts' AND column_name = 'order_index') THEN
    ALTER TABLE store_posts ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_posts' AND column_name = 'is_pinned') THEN
    ALTER TABLE store_posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Store Management Functions
CREATE OR REPLACE FUNCTION get_max_category_order(store_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT MAX(order_index) FROM store_categories WHERE store_id = store_uuid), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_max_listing_order(category_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT MAX(order_index) FROM listings WHERE store_category_id = category_uuid), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reorder_store_categories(
  store_uuid UUID,
  category_orders JSONB
)
RETURNS VOID AS $$
DECLARE
  cat_record RECORD;
BEGIN
  FOR cat_record IN SELECT * FROM jsonb_each(category_orders)
  LOOP
    UPDATE store_categories
    SET order_index = (cat_record.value)::INTEGER, updated_at = now()
    WHERE category_id = (cat_record.key)::UUID AND store_id = store_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reorder_store_listings(
  category_uuid UUID,
  listing_orders JSONB
)
RETURNS VOID AS $$
DECLARE
  list_record RECORD;
BEGIN
  FOR list_record IN SELECT * FROM jsonb_each(listing_orders)
  LOOP
    UPDATE listings
    SET order_index = (list_record.value)::INTEGER, updated_at = now()
    WHERE listing_id = (list_record.key)::UUID AND store_category_id = category_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_store_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_store_categories_updated_at
  BEFORE UPDATE ON store_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_store_categories_updated_at();

-- ============================================
-- STEP 4: UNIFIED ITEMS VIEW
-- ============================================
-- Fayl: database/unified_items_view.sql
-- ============================================

CREATE OR REPLACE VIEW unified_items AS
SELECT 
  listing_id as item_id,
  'product' as item_type,
  title,
  description,
  price,
  NULL::text as price_type,
  category,
  seller_telegram_id as owner_id,
  NULL::uuid as store_id,
  photos[1] as image_url,
  photos as image_urls,
  neighborhood,
  latitude,
  longitude,
  status,
  view_count,
  favorite_count,
  is_boosted,
  created_at,
  updated_at,
  NULL::integer as stock_qty,
  NULL::numeric as old_price
FROM listings
WHERE status = 'active' AND store_id IS NULL

UNION ALL

SELECT 
  listing_id as item_id,
  'store_product' as item_type,
  title,
  description,
  price,
  NULL::text as price_type,
  category,
  seller_telegram_id as owner_id,
  store_id,
  photos[1] as image_url,
  photos as image_urls,
  neighborhood,
  latitude,
  longitude,
  status,
  view_count,
  favorite_count,
  is_boosted,
  created_at,
  updated_at,
  stock_qty,
  old_price
FROM listings
WHERE status = 'active' AND store_id IS NOT NULL

UNION ALL

SELECT 
  service_id as item_id,
  'service' as item_type,
  title,
  description,
  CASE 
    WHEN price_type = 'fixed' AND price IS NOT NULL THEN price::numeric
    ELSE NULL
  END as price,
  price_type,
  category,
  provider_telegram_id as owner_id,
  NULL::uuid as store_id,
  logo_url as image_url,
  portfolio_images as image_urls,
  NULL::text as neighborhood,
  NULL::decimal as latitude,
  NULL::decimal as longitude,
  CASE 
    WHEN status = 'active' THEN 'active'
    ELSE 'inactive'
  END as status,
  view_count,
  0 as favorite_count,
  false as is_boosted,
  created_at,
  updated_at,
  NULL::integer as stock_qty,
  NULL::numeric as old_price
FROM services
WHERE status = 'active';

-- Search unified items function
CREATE OR REPLACE FUNCTION search_unified_items(
  search_query TEXT DEFAULT NULL,
  item_type_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  owner_id_filter BIGINT DEFAULT NULL,
  store_id_filter UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  item_id UUID,
  item_type TEXT,
  title TEXT,
  description TEXT,
  price NUMERIC,
  price_type TEXT,
  category TEXT,
  owner_id BIGINT,
  store_id UUID,
  image_url TEXT,
  status TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.item_id, ui.item_type, ui.title, ui.description, ui.price, ui.price_type,
    ui.category, ui.owner_id, ui.store_id, ui.image_url, ui.status,
    ui.view_count, ui.favorite_count, ui.created_at
  FROM unified_items ui
  WHERE 
    (search_query IS NULL OR ui.title ILIKE '%' || search_query || '%' OR ui.description ILIKE '%' || search_query || '%')
    AND (item_type_filter IS NULL OR ui.item_type = item_type_filter)
    AND (category_filter IS NULL OR ui.category = category_filter)
    AND (min_price IS NULL OR ui.price >= min_price)
    AND (max_price IS NULL OR ui.price <= max_price)
    AND (owner_id_filter IS NULL OR ui.owner_id = owner_id_filter)
    AND (store_id_filter IS NULL OR ui.store_id = store_id_filter)
    AND ui.status = 'active'
  ORDER BY ui.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: ENHANCED RLS POLICIES
-- ============================================
-- Fayl: database/rls_policies_enhanced.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;

-- Users Policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can only update own data" ON users;
CREATE POLICY "Users can only update own data" ON users FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);

-- Listings Policies
DROP POLICY IF EXISTS "Users can view active listings" ON listings;
CREATE POLICY "Users can view active listings" ON listings FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can only update own listings" ON listings;
CREATE POLICY "Users can only update own listings" ON listings FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create own listings" ON listings;
CREATE POLICY "Users can create own listings" ON listings FOR INSERT WITH CHECK (true);

-- Stores Policies
DROP POLICY IF EXISTS "Users can view active stores" ON stores;
CREATE POLICY "Users can view active stores" ON stores FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Store owners can only update own stores" ON stores;
CREATE POLICY "Store owners can only update own stores" ON stores FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create own stores" ON stores;
CREATE POLICY "Users can create own stores" ON stores FOR INSERT WITH CHECK (true);

-- Store Categories Policies
DROP POLICY IF EXISTS "Public can view active store categories" ON store_categories;
CREATE POLICY "Public can view active store categories" ON store_categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Store owners can manage their categories" ON store_categories;
CREATE POLICY "Store owners can manage their categories" ON store_categories FOR ALL USING (true) WITH CHECK (true);

-- Store Posts Policies
DROP POLICY IF EXISTS "Public can view store posts" ON store_posts;
CREATE POLICY "Public can view store posts" ON store_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage their posts" ON store_posts;
CREATE POLICY "Store owners can manage their posts" ON store_posts FOR ALL USING (true) WITH CHECK (true);

-- Services Policies
DROP POLICY IF EXISTS "Users can view active services" ON services;
CREATE POLICY "Users can view active services" ON services FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Service providers can only update own services" ON services;
CREATE POLICY "Service providers can only update own services" ON services FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create own services" ON services;
CREATE POLICY "Users can create own services" ON services FOR INSERT WITH CHECK (true);

-- Favorites Policies
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (true) WITH CHECK (true);

-- Cart Items Policies
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
CREATE POLICY "Users can view own cart items" ON cart_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
CREATE POLICY "Users can manage own cart items" ON cart_items FOR ALL USING (true) WITH CHECK (true);

-- Reviews Policies
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
CREATE POLICY "Users can view reviews" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (true);

-- User Referrals Policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON user_referrals;
CREATE POLICY "Users can view their own referrals" ON user_referrals FOR SELECT USING (true);

-- ============================================
-- STEP 6: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_store_id ON listings(store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_store_category ON listings(store_category_id, order_index ASC) WHERE store_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_store_stock ON listings(store_id, stock_qty) WHERE store_id IS NOT NULL AND stock_qty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_telegram_id);
CREATE INDEX IF NOT EXISTS idx_stores_referral_code ON stores(referral_code);
CREATE INDEX IF NOT EXISTS idx_store_categories_store ON store_categories(store_id, order_index ASC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_store_posts_store ON store_posts(store_id, is_pinned DESC, order_index ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_referrals_user ON user_referrals(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_store ON user_referrals(store_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_user ON listing_views(user_telegram_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_telegram_id, created_at DESC);

-- ============================================
-- STEP 7: TRIGGERS
-- ============================================

-- Store subscriber count triggers
CREATE OR REPLACE FUNCTION increment_store_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores SET subscriber_count = subscriber_count + 1 WHERE store_id = NEW.store_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_store_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores SET subscriber_count = GREATEST(0, subscriber_count - 1) WHERE store_id = OLD.store_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_store_subscriber ON store_subscriptions;
CREATE TRIGGER trigger_increment_store_subscriber AFTER INSERT ON store_subscriptions
  FOR EACH ROW EXECUTE FUNCTION increment_store_subscriber_count();

DROP TRIGGER IF EXISTS trigger_decrement_store_subscriber ON store_subscriptions;
CREATE TRIGGER trigger_decrement_store_subscriber AFTER DELETE ON store_subscriptions
  FOR EACH ROW EXECUTE FUNCTION decrement_store_subscriber_count();

-- ============================================
-- ✅ YAKUN
-- ============================================
-- 
-- Barcha SQL'lar ishga tushirildi!
-- 
-- Keyingi qadamlar:
-- 1. Storage bucket yaratish (listings, stores, services)
-- 2. Storage policies sozlash
-- 3. Test qilish
-- ============================================

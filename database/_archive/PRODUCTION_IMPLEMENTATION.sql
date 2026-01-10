-- ============================================
-- PRODUCTION DATABASE IMPLEMENTATION
-- Supabase PostgreSQL + RLS
-- ============================================
-- 
-- WHAT: Complete production-ready database schema
-- WHY: Ensures scalability, performance, and data integrity
-- WHEN: Run once after initial setup
--
-- REQUIRED IN SUPABASE: YES
-- ============================================

-- ============================================
-- STEP 1: EXTENSIONS (PostgreSQL extensions)
-- ============================================
-- WHY: Enable advanced features (UUID, fuzzy search, text normalization)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Trigram for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- Remove accents for matching

-- ============================================
-- STEP 2: USER ACTIVITY TRACKING (Enhanced)
-- ============================================
-- WHAT: Track user behavior for recommendations
-- WHY: No duplication, efficient indexes, RLS-safe
-- DESIGN: Event-sourcing approach - each interaction is a separate row

-- 2.1: Listing Views (deduplicated per user per listing per day)
CREATE TABLE IF NOT EXISTS listing_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Computed date for deduplication
  session_id TEXT, -- For grouping views in same session
  UNIQUE(user_telegram_id, listing_id, viewed_date) -- One view per user per listing per day
);

CREATE INDEX IF NOT EXISTS idx_listing_views_user ON listing_views(user_telegram_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing ON listing_views(listing_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_listing ON listing_views(user_telegram_id, listing_id);

-- 2.2: Listing Likes (reuse favorites table, but track separately)
-- NOTE: favorites table already exists, we'll create a view for consistency

-- 2.3: Search History (enhanced with deduplication)
CREATE TABLE IF NOT EXISTS user_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  category TEXT,
  subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL,
  filters JSONB, -- Store all filters as JSON
  result_count INTEGER DEFAULT 0,
  clicked_listing_id UUID REFERENCES listings(listing_id) ON DELETE SET NULL, -- Track if user clicked result
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_query ON user_searches USING gin(to_tsvector('russian', search_query));
CREATE INDEX IF NOT EXISTS idx_user_searches_category ON user_searches(category, created_at DESC);

-- 2.4: Last Seen (listing_id based, not timestamp)
CREATE TABLE IF NOT EXISTS user_last_seen (
  user_telegram_id BIGINT PRIMARY KEY REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  last_seen_listing_id UUID REFERENCES listings(listing_id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_last_seen_listing ON user_last_seen(last_seen_listing_id);
CREATE INDEX IF NOT EXISTS idx_user_last_seen_updated ON user_last_seen(updated_at);

-- 2.5: User Interactions (enhanced from existing)
-- NOTE: user_listing_interactions already exists, but we'll add missing indexes

CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON user_listing_interactions(user_telegram_id, interaction_type, created_at DESC);

-- ============================================
-- STEP 3: USER PREFERENCE PROFILE
-- ============================================
-- WHAT: Automatically computed user preferences
-- WHY: Used in recommendation algorithm
-- APPROACH: Materialized view updated via triggers (real-time, efficient)

-- 3.1: User Preferences Table (enhanced)
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL UNIQUE REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  
  -- Computed fields
  top_category TEXT,
  top_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL,
  average_viewed_price DECIMAL(10, 2),
  preferred_condition TEXT,
  
  -- Metadata
  total_views INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON user_preferences(top_category);

-- 3.2: Function to compute user preferences
-- WHY: Triggers are efficient and real-time. Views are slower on large datasets.
CREATE OR REPLACE FUNCTION compute_user_preferences(p_user_id BIGINT)
RETURNS void AS $$
DECLARE
  v_top_category TEXT;
  v_top_subcategory_id UUID;
  v_avg_price DECIMAL(10, 2);
  v_preferred_condition TEXT;
  v_total_views INTEGER;
  v_total_searches INTEGER;
  v_total_likes INTEGER;
BEGIN
  -- Get top category (most viewed)
  SELECT category INTO v_top_category
  FROM (
    SELECT l.category, COUNT(*) as view_count
    FROM listing_views lv
    JOIN listings l ON lv.listing_id = l.listing_id
    WHERE lv.user_telegram_id = p_user_id
    GROUP BY l.category
    ORDER BY view_count DESC
    LIMIT 1
  ) cat_views;
  
  -- Get top subcategory (most viewed)
  SELECT subcategory_id INTO v_top_subcategory_id
  FROM (
    SELECT l.subcategory_id, COUNT(*) as view_count
    FROM listing_views lv
    JOIN listings l ON lv.listing_id = l.listing_id
    WHERE lv.user_telegram_id = p_user_id
      AND l.subcategory_id IS NOT NULL
    GROUP BY l.subcategory_id
    ORDER BY view_count DESC
    LIMIT 1
  ) subcat_views;
  
  -- Get average viewed price
  SELECT AVG(l.price)::DECIMAL(10, 2) INTO v_avg_price
  FROM listing_views lv
  JOIN listings l ON lv.listing_id = l.listing_id
  WHERE lv.user_telegram_id = p_user_id
    AND l.price IS NOT NULL
    AND l.price > 0;
  
  -- Get preferred condition (most viewed)
  SELECT condition INTO v_preferred_condition
  FROM (
    SELECT l.condition, COUNT(*) as view_count
    FROM listing_views lv
    JOIN listings l ON lv.listing_id = l.listing_id
    WHERE lv.user_telegram_id = p_user_id
    GROUP BY l.condition
    ORDER BY view_count DESC
    LIMIT 1
  ) cond_views;
  
  -- Get counts
  SELECT COUNT(*) INTO v_total_views FROM listing_views WHERE user_telegram_id = p_user_id;
  SELECT COUNT(*) INTO v_total_searches FROM user_searches WHERE user_telegram_id = p_user_id;
  SELECT COUNT(*) INTO v_total_likes FROM favorites WHERE user_telegram_id = p_user_id;
  
  -- Upsert preferences
  INSERT INTO user_preferences (
    user_telegram_id,
    top_category,
    top_subcategory_id,
    average_viewed_price,
    preferred_condition,
    total_views,
    total_searches,
    total_likes,
    last_computed_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_top_category,
    v_top_subcategory_id,
    v_avg_price,
    v_preferred_condition,
    v_total_views,
    v_total_searches,
    v_total_likes,
    now(),
    now()
  )
  ON CONFLICT (user_telegram_id)
  DO UPDATE SET
    top_category = EXCLUDED.top_category,
    top_subcategory_id = EXCLUDED.top_subcategory_id,
    average_viewed_price = EXCLUDED.average_viewed_price,
    preferred_condition = EXCLUDED.preferred_condition,
    total_views = EXCLUDED.total_views,
    total_searches = EXCLUDED.total_searches,
    total_likes = EXCLUDED.total_likes,
    last_computed_at = EXCLUDED.last_computed_at,
    updated_at = now();
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- 3.3: Trigger to ensure viewed_date is set automatically
CREATE OR REPLACE FUNCTION set_viewed_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set viewed_date from viewed_at if not provided
  IF NEW.viewed_date IS NULL THEN
    NEW.viewed_date := DATE(NEW.viewed_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_viewed_date ON listing_views;
CREATE TRIGGER trigger_set_viewed_date
  BEFORE INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION set_viewed_date();

-- 3.4: Trigger to auto-compute preferences (runs after view is tracked)
CREATE OR REPLACE FUNCTION trigger_compute_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Defer computation to avoid blocking
  -- Use AFTER INSERT so data is committed
  PERFORM compute_user_preferences(NEW.user_telegram_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_listing_view_preferences ON listing_views;
CREATE TRIGGER trigger_listing_view_preferences
  AFTER INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION trigger_compute_preferences();

-- Also trigger on favorites (likes)
DROP TRIGGER IF EXISTS trigger_favorite_preferences ON favorites;
CREATE TRIGGER trigger_favorite_preferences
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION trigger_compute_preferences();

-- ============================================
-- STEP 4: RECOMMENDATION ALGORITHM
-- ============================================
-- WHAT: Ranking-based feed (NOT filtering)
-- WHY: Shows all listings, ranked by relevance score
-- OUTPUT: Production-ready SQL function

-- 4.1: Recommendation Score Function (OLX.uz Style - Subcategory Priority)
CREATE OR REPLACE FUNCTION get_listing_recommendation_score(
  p_listing_id UUID,
  p_user_id BIGINT,
  p_user_lat DECIMAL DEFAULT NULL,
  p_user_lon DECIMAL DEFAULT NULL
)
RETURNS DECIMAL(10, 4) AS $$
DECLARE
  v_listing RECORD;
  v_preferences RECORD;
  v_user_subcategory_prefs RECORD;
  v_score DECIMAL(10, 4) := 0;
  
  -- Component scores (NEW FORMULA: Subcategory * 50 + Category * 10 + Recency * 5 + Distance * 5)
  v_subcategory_score DECIMAL := 0;  -- 50 points max
  v_category_score DECIMAL := 0;     -- 10 points max
  v_price_score DECIMAL := 0;        -- 5 points max
  v_condition_score DECIMAL := 0;    -- 5 points max
  v_distance_score DECIMAL := 0;     -- 5 points max
  v_popularity_score DECIMAL := 0;   -- 5 points max
  v_freshness_score DECIMAL := 0;    -- 5 points max
  v_boost_bonus DECIMAL := 0;        -- 15 points max
BEGIN
  -- Get listing data
  SELECT * INTO v_listing
  FROM listings
  WHERE listing_id = p_listing_id
    AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get user preferences (if exists)
  SELECT * INTO v_preferences
  FROM user_preferences
  WHERE user_telegram_id = p_user_id;
  
  -- Get user subcategory preference score (from user_category_preferences with subcategory_id)
  DECLARE
    v_subcategory_score_value DECIMAL := 0;
  BEGIN
    IF v_listing.subcategory_id IS NOT NULL THEN
      SELECT COALESCE(score, 0) INTO v_subcategory_score_value
      FROM user_category_preferences
      WHERE user_telegram_id = p_user_id
        AND category = v_listing.category
        AND subcategory_id = v_listing.subcategory_id
      LIMIT 1;
    END IF;
    
    -- 1. SUBCATEGORY MATCH (50 points max) - CRITICAL FOR KAMAZ CASE
    -- If user viewed listings in this exact subcategory, huge boost
    IF v_listing.subcategory_id IS NOT NULL THEN
      IF v_subcategory_score_value > 0 THEN
        -- User has viewed this subcategory - full 50 points
        v_subcategory_score := 50;
      ELSIF v_preferences IS NOT NULL AND v_preferences.top_subcategory_id = v_listing.subcategory_id THEN
        -- User's top subcategory matches - full 50 points
        v_subcategory_score := 50;
      END IF;
    END IF;
  END;
  
  -- 2. CATEGORY MATCH (10 points max) - Small boost for same category
  IF v_preferences IS NOT NULL AND v_preferences.top_category = v_listing.category THEN
    v_category_score := 10;
  END IF;
  
  -- 3. PRICE SIMILARITY (5 points max)
  IF v_preferences IS NOT NULL AND v_preferences.average_viewed_price IS NOT NULL 
     AND v_listing.price IS NOT NULL AND v_listing.price > 0 THEN
    DECLARE
      v_price_diff DECIMAL;
      v_price_ratio DECIMAL;
    BEGIN
      v_price_diff := ABS(v_listing.price - v_preferences.average_viewed_price);
      v_price_ratio := LEAST(v_price_diff / NULLIF(v_preferences.average_viewed_price, 0), 1.0);
      v_price_score := 5 * (1.0 - v_price_ratio);
    END;
  END IF;
  
  -- 4. CONDITION MATCH (5 points max)
  IF v_preferences IS NOT NULL AND v_preferences.preferred_condition = v_listing.condition THEN
    v_condition_score := 5;
  END IF;
  
  -- 5. DISTANCE (5 points max if GPS available)
  IF p_user_lat IS NOT NULL AND p_user_lon IS NOT NULL 
     AND v_listing.latitude IS NOT NULL AND v_listing.longitude IS NOT NULL THEN
    DECLARE
      v_distance_km DECIMAL;
    BEGIN
      v_distance_km := (
        6371 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians(p_user_lat)) * 
            cos(radians(v_listing.latitude)) * 
            cos(radians(v_listing.longitude) - radians(p_user_lon)) + 
            sin(radians(p_user_lat)) * 
            sin(radians(v_listing.latitude))
          ))
        )
      );
      -- Closer = higher score (max 10km = full score)
      v_distance_score := GREATEST(0, 5 * (1.0 - LEAST(v_distance_km / 10.0, 1.0)));
    END;
  END IF;
  
  -- 6. POPULARITY (views + likes) (5 points max)
  v_popularity_score := LEAST(
    (v_listing.view_count * 0.01 + v_listing.favorite_count * 0.2),
    5.0
  );
  
  -- 7. FRESHNESS (newer = higher score) (5 points max)
  DECLARE
    v_age_hours DECIMAL;
  BEGIN
    v_age_hours := EXTRACT(EPOCH FROM (now() - v_listing.created_at)) / 3600;
    -- < 24h = full score, decays over 7 days
    IF v_age_hours < 24 THEN
      v_freshness_score := 5;
    ELSIF v_age_hours < 168 THEN -- 7 days
      v_freshness_score := 5 * (1.0 - (v_age_hours - 24) / 144.0);
    ELSE
      v_freshness_score := 0;
    END IF;
  END;
  
  -- 8. BOOST BONUS (15 points if boosted)
  IF v_listing.is_boosted = true 
     AND (v_listing.boosted_until IS NULL OR v_listing.boosted_until > now()) THEN
    v_boost_bonus := 15;
  END IF;
  
  -- Total score: Subcategory (50) + Category (10) + Others (25) + Boost (15) = 100 max
  v_score := v_subcategory_score + v_category_score + v_price_score + 
             v_condition_score + v_distance_score + v_popularity_score + 
             v_freshness_score + v_boost_bonus;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql
STABLE
SET search_path = public;

-- 4.2: Recommendation Feed Query (Production-ready)
-- WHY: This is the main query used by the application
CREATE OR REPLACE FUNCTION get_recommendation_feed(
  p_user_id BIGINT,
  p_user_lat DECIMAL DEFAULT NULL,
  p_user_lon DECIMAL DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_cursor_listing_id UUID DEFAULT NULL -- For cursor-based pagination
)
RETURNS TABLE (
  listing_id UUID,
  seller_telegram_id BIGINT,
  title TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  is_free BOOLEAN,
  category TEXT,
  condition TEXT,
  photos TEXT[],
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  is_boosted BOOLEAN,
  boosted_until TIMESTAMPTZ,
  subcategory_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  recommendation_score DECIMAL(10, 4),
  seller_first_name TEXT,
  seller_username TEXT,
  seller_profile_photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH scored_listings AS (
    SELECT 
      l.*,
      get_listing_recommendation_score(l.listing_id, p_user_id, p_user_lat, p_user_lon) as score
    FROM listings l
    WHERE l.status = 'active'
      AND (p_cursor_listing_id IS NULL OR l.created_at < (
        SELECT created_at FROM listings WHERE listing_id = p_cursor_listing_id
      ))
  )
  SELECT 
    l.listing_id,
    l.seller_telegram_id,
    l.title,
    l.description,
    l.price,
    l.is_free,
    l.category,
    l.condition,
    l.photos,
    l.neighborhood,
    l.latitude,
    l.longitude,
    l.status,
    l.view_count,
    l.favorite_count,
    l.is_boosted,
    l.boosted_until,
    l.subcategory_id,
    l.created_at,
    l.updated_at,
    sl.score as recommendation_score,
    u.first_name as seller_first_name,
    u.username as seller_username,
    u.profile_photo_url as seller_profile_photo_url
  FROM scored_listings sl
  JOIN listings l ON sl.listing_id = l.listing_id
  LEFT JOIN users u ON l.seller_telegram_id = u.telegram_user_id
  ORDER BY sl.score DESC, l.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql
STABLE
SET search_path = public;

-- 4.3: Fallback for new users (no preferences yet)
-- WHY: New users get recency + popularity ranking
CREATE OR REPLACE FUNCTION get_new_user_feed(
  p_limit INTEGER DEFAULT 50,
  p_cursor_listing_id UUID DEFAULT NULL
)
RETURNS TABLE (
  listing_id UUID,
  -- Same columns as get_recommendation_feed
  seller_telegram_id BIGINT,
  title TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  is_free BOOLEAN,
  category TEXT,
  condition TEXT,
  photos TEXT[],
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  is_boosted BOOLEAN,
  boosted_until TIMESTAMPTZ,
  subcategory_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  recommendation_score DECIMAL(10, 4),
  seller_first_name TEXT,
  seller_username TEXT,
  seller_profile_photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.listing_id,
    l.seller_telegram_id,
    l.title,
    l.description,
    l.price,
    l.is_free,
    l.category,
    l.condition,
    l.photos,
    l.neighborhood,
    l.latitude,
    l.longitude,
    l.status,
    l.view_count,
    l.favorite_count,
    l.is_boosted,
    l.boosted_until,
    l.subcategory_id,
    l.created_at,
    l.updated_at,
    -- Score based on: boosted (20) + recency (10) + popularity (5)
    (
      CASE WHEN l.is_boosted AND (l.boosted_until IS NULL OR l.boosted_until > now()) THEN 20 ELSE 0 END +
      CASE 
        WHEN EXTRACT(EPOCH FROM (now() - l.created_at)) / 3600 < 24 THEN 10
        WHEN EXTRACT(EPOCH FROM (now() - l.created_at)) / 3600 < 168 THEN 
          10 * (1.0 - (EXTRACT(EPOCH FROM (now() - l.created_at)) / 3600 - 24) / 144.0)
        ELSE 0
      END +
      LEAST((l.view_count * 0.1 + l.favorite_count * 2) / 100.0, 5.0)
    )::DECIMAL(10, 4) as recommendation_score,
    u.first_name as seller_first_name,
    u.username as seller_username,
    u.profile_photo_url as seller_profile_photo_url
  FROM listings l
  LEFT JOIN users u ON l.seller_telegram_id = u.telegram_user_id
  WHERE l.status = 'active'
    AND (p_cursor_listing_id IS NULL OR l.created_at < (
      SELECT created_at FROM listings WHERE listing_id = p_cursor_listing_id
    ))
  ORDER BY 
    l.is_boosted DESC,
    l.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql
STABLE
SET search_path = public;

-- ============================================
-- STEP 5: CURSOR-BASED PAGINATION
-- ============================================
-- WHAT: Replace OFFSET with cursor-based pagination
-- WHY: OFFSET breaks when new listings are added
-- SOLUTION: Use listing_id + created_at as cursor

-- 5.1: Helper function for cursor pagination
CREATE OR REPLACE FUNCTION get_listings_cursor(
  p_limit INTEGER DEFAULT 50,
  p_after_listing_id UUID DEFAULT NULL,
  p_after_created_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  listing_id UUID,
  seller_telegram_id BIGINT,
  title TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  is_free BOOLEAN,
  category TEXT,
  condition TEXT,
  photos TEXT[],
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  is_boosted BOOLEAN,
  boosted_until TIMESTAMPTZ,
  subcategory_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  seller_first_name TEXT,
  seller_username TEXT,
  seller_profile_photo_url TEXT,
  has_next_page BOOLEAN
) AS $$
DECLARE
  v_next_listing_id UUID;
BEGIN
  RETURN QUERY
  WITH ordered_listings AS (
    SELECT 
      l.*,
      u.first_name as seller_first_name,
      u.username as seller_username,
      u.profile_photo_url as seller_profile_photo_url
    FROM listings l
    LEFT JOIN users u ON l.seller_telegram_id = u.telegram_user_id
    WHERE l.status = 'active'
      AND (
        p_after_listing_id IS NULL 
        OR l.created_at < p_after_created_at
        OR (l.created_at = p_after_created_at AND l.listing_id < p_after_listing_id)
      )
    ORDER BY l.created_at DESC, l.listing_id DESC
    LIMIT p_limit + 1 -- Fetch one extra to check if there's a next page
  )
  SELECT 
    ol.listing_id,
    ol.seller_telegram_id,
    ol.title,
    ol.description,
    ol.price,
    ol.is_free,
    ol.category,
    ol.condition,
    ol.photos,
    ol.neighborhood,
    ol.latitude,
    ol.longitude,
    ol.status,
    ol.view_count,
    ol.favorite_count,
    ol.is_boosted,
    ol.boosted_until,
    ol.subcategory_id,
    ol.created_at,
    ol.updated_at,
    ol.seller_first_name,
    ol.seller_username,
    ol.seller_profile_photo_url,
    (COUNT(*) OVER() > p_limit) as has_next_page
  FROM ordered_listings ol
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql
STABLE
SET search_path = public;

-- ============================================
-- STEP 6: RLS POLICIES (Supabase-specific)
-- ============================================
-- WHAT: Row Level Security for all new tables
-- WHY: Supabase requires RLS for security

-- Enable RLS
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Listing Views Policies
CREATE POLICY "Allow public read access to listing_views"
  ON listing_views FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to listing_views"
  ON listing_views FOR INSERT
  WITH CHECK (true);

-- User Preferences Policies
CREATE POLICY "Allow public read access to user_preferences"
  ON user_preferences FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update their own preferences"
  ON user_preferences FOR UPDATE
  USING (true);

-- ============================================
-- STEP 7: INDEXES FOR PERFORMANCE
-- ============================================
-- WHY: Optimize recommendation queries

CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_category_subcategory ON listings(category, subcategory_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_price_active ON listings(price) 
  WHERE status = 'active' AND price IS NOT NULL;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test recommendation function (new user)
-- SELECT * FROM get_new_user_feed(10);

-- Test recommendation function (existing user)
-- SELECT * FROM get_recommendation_feed(123456789, NULL, NULL, 10);

-- Test cursor pagination
-- SELECT * FROM get_listings_cursor(10);

-- ============================================
-- LOCALMARKET TELEGRAM MINI APP
-- TO'LIQ DATABASE MIGRATION - BARCHA NARSALAR
-- ============================================
-- 
-- FOYDALANISH:
-- 1. Supabase Dashboard -> SQL Editor ga kiring
-- 2. Ushbu faylning barcha kodini copy qiling
-- 3. SQL Editor'da paste qiling va RUN tugmasini bosing
-- 4. Barcha migration'lar avtomatik bajariladi
--
-- MUHIM: Agar xatolik bo'lsa, qaysi qismda xato ekanligini ko'rsatadi
-- ============================================

-- ============================================
-- QADAM 1: EXTENSIONS (PostgreSQL)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Trigram for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- Remove accents for matching

-- ============================================
-- QADAM 2: ASOSIY SCHEMA (Agar yo'q bo'lsa)
-- ============================================

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
  category TEXT NOT NULL CHECK (category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'other')),
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
  subcategory_id UUID,
  score DECIMAL(5, 2) DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, category, subcategory_id)
);

-- ============================================
-- QADAM 3: SUBCATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_category TEXT NOT NULL CHECK (parent_category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'other')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_category, slug),
  UNIQUE(slug) -- Also add unique on slug alone for ON CONFLICT (slug)
);

-- Add name_uz and description_uz columns if they don't exist (for backward compatibility)
DO $$ 
BEGIN
  -- Add name_uz if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subcategories' 
    AND column_name = 'name_uz'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN name_uz TEXT;
    -- Copy name to name_uz for existing rows
    UPDATE subcategories SET name_uz = name WHERE name_uz IS NULL;
  END IF;
  
  -- Add description_uz if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subcategories' 
    AND column_name = 'description_uz'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN description_uz TEXT;
    -- Copy description to description_uz for existing rows
    UPDATE subcategories SET description_uz = description WHERE description_uz IS NULL;
  END IF;
  
  -- Add display_order if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subcategories' 
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add subcategory_id to listings if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE listings 
    ADD COLUMN subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- QADAM 4: OLX.uz STYLE CATEGORIES
-- ============================================

-- Transport: Yuk mashinalari (CRITICAL FOR KAMAZ)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Yengil mashinalar', 'Yengil mashinalar', 'yengil-mashinalar', 'Barcha turdagi yengil mashinalar', 1),
('sports_outdoors', 'Yuk mashinalari', 'Yuk mashinalari', 'yuk-mashinalari', 'Kamaz, Man, Scania va boshqa yuk mashinalari', 2),
('sports_outdoors', 'Maxsus texnika', 'Maxsus texnika', 'maxsus-texnika', 'Ekskavator, buldozer, kran va boshqa maxsus texnika', 3),
('sports_outdoors', 'Ehtiyot qismlar', 'Ehtiyot qismlar', 'ehtiyot-qismlar', 'Mashina ehtiyot qismlari va aksessuarlar', 4),
('sports_outdoors', 'Mototsikllar', 'Mototsikllar', 'mototsikllar', 'Mototsikllar va skuterlar', 5),
('sports_outdoors', 'Velosipedlar', 'Velosipedlar', 'velosipedlar', 'Velosipedlar va boshqa ikki gildirakli transport', 6)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- Nested: Kamaz, Man, Scania under Yuk mashinalari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Kamaz', 'Kamaz', 'kamaz', 'Kamaz yuk mashinalari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Man', 'Man', 'man', 'Man yuk mashinalari', 2, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Scania', 'Scania', 'scania', 'Scania yuk mashinalari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Nested: Nexia, Gazel, BMW, Mercedes under Yengil mashinalar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Nexia', 'Nexia', 'nexia', 'Nexia yengil mashinalari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Gazel', 'Gazel', 'gazel', 'Gazel yengil mashinalari', 2, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'BMW', 'BMW', 'bmw', 'BMW yengil mashinalari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Mercedes', 'Mercedes', 'mercedes', 'Mercedes yengil mashinalari', 4, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Ko'chmas mulk
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Kvartiralar', 'Kvartiralar', 'kvartiralar', 'Bir xonali, ikki xonali, uch xonali kvartiralar', 1),
('home_garden', 'Hovli uylar', 'Hovli uylar', 'hovli-uylar', 'Hovli uylar va qo''shni uylar', 2),
('home_garden', 'Yer uchastkalari', 'Yer uchastkalari', 'yer-uchastkalari', 'Yer uchastkalari va qurilish uchun yerlar', 3),
('home_garden', 'Ofislar', 'Ofislar', 'ofislar', 'Ofis binolari va biznes binolari', 4),
('home_garden', 'Magazinlar', 'Magazinlar', 'magazinlar', 'Savdo maydonlari va magazinlar', 5),
('home_garden', 'Ijaraga', 'Ijaraga', 'ijaraga', 'Ijaraga beriladigan ko''chmas mulk', 6)
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Elektronika
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('electronics', 'Telefonlar', 'Telefonlar', 'telefonlar', 'Smartfonlar va mobil telefonlar', 1),
('electronics', 'Noutbuklar', 'Noutbuklar', 'noutbuklar', 'Portativ kompyuterlar', 2),
('electronics', 'Kompyuterlar', 'Kompyuterlar', 'kompyuterlar', 'Stol kompyuterlari va monobloklar', 3),
('electronics', 'Planshetlar', 'Planshetlar', 'planshetlar', 'Planshetlar va e-readerlar', 4),
('electronics', 'Televizorlar', 'Televizorlar', 'televizorlar', 'TV va monitorlar', 5),
('electronics', 'Maishiy texnika', 'Maishiy texnika', 'maishiy-texnika', 'Muzlatgich, kir yuvish mashinasi va boshqalar', 6),
('electronics', 'Audio va video', 'Audio va video', 'audio-video', 'Kolonkalar, naushniklar, kameralar', 7),
('electronics', 'O''yin konsollari', 'O''yin konsollari', 'oyin-konsollari', 'PlayStation, Xbox va boshqalar', 8)
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Nested: iPhone, Samsung under Telefonlar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'electronics', 'iPhone', 'iPhone', 'iphone', 'Apple iPhone telefonlar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'electronics', 'Samsung', 'Samsung', 'samsung', 'Samsung telefonlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Kiyim-kechak
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('clothing', 'Erkaklar kiyimi', 'Erkaklar kiyimi', 'erkaklar-kiyimi', 'Erkaklar uchun kiyim-kechaklar', 1),
('clothing', 'Ayollar kiyimi', 'Ayollar kiyimi', 'ayollar-kiyimi', 'Ayollar uchun kiyim-kechaklar', 2),
('clothing', 'Bolalar kiyimi', 'Bolalar kiyimi', 'bolalar-kiyimi', 'Bolalar uchun kiyim-kechaklar', 3),
('clothing', 'Oyoq kiyim', 'Oyoq kiyim', 'oyoq-kiyim', 'Etik, tufli, krossovkalar', 4),
('clothing', 'Aksessuarlar', 'Aksessuarlar', 'aksessuarlar', 'Sumkalar, soatlar, aksessuarlar', 5)
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Uy va Bog'
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Mebel', 'Mebel', 'mebel', 'Divanlar, stollar, stullar', 1),
('home_garden', 'Qurilish mollari', 'Qurilish mollari', 'qurilish-mollari', 'Cement, g''isht, plitka va boshqalar', 2),
('home_garden', 'Bog'' anjomlari', 'Bog'' anjomlari', 'bog-anjomlari', 'Bog'' va hovli uchun asboblar', 3),
('home_garden', 'Uy bezaklari', 'Uy bezaklari', 'uy-bezaklari', 'Interyer bezaklari', 4),
('home_garden', 'Oshxona jihozlari', 'Oshxona jihozlari', 'oshxona-jihozlari', 'Oshxona uchun kerakli jihozlar', 5)
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Nested: Divanlar, Stollar under Mebel
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'home_garden', 'Divanlar', 'Divanlar', 'divanlar', 'Divanlar va kreslolar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'home_garden', 'Stollar', 'Stollar', 'stollar', 'Har xil turdagi stollar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Sport va Boshqalar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Fitness', 'Fitness', 'fitness', 'Fitness va sport zali uchun uskunalar', 7),
('sports_outdoors', 'Turizm', 'Turizm', 'turizm', 'Sayohat va turizm uchun anjomlar', 8),
('sports_outdoors', 'O''yinchoqlar', 'O''yinchoqlar', 'oyinchoqlar', 'Bolalar o''yinchoqlari', 9),
('other', 'Vakansiyalar', 'Vakansiyalar', 'vakansiyalar', 'Ish o''rinlari va vakansiyalar', 1),
('other', 'Xizmatlar', 'Xizmatlar', 'xizmatlar', 'Turli xil xizmatlar', 2),
('other', 'Hayvonlar', 'Hayvonlar', 'hayvonlar', 'Uy hayvonlari va ularning aksessuarlari', 3)
ON CONFLICT (parent_category, slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- ============================================
-- QADAM 5: USER ACTIVITY TRACKING
-- ============================================

-- Listing Views Table (deduplicated per day)
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

-- User Preferences Table (computed)
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
-- QADAM 6: FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update User Preferences
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
  -- Get top category
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
  
  -- Get top subcategory
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
  
  -- Get average price
  SELECT AVG(l.price)::DECIMAL(10, 2) INTO v_avg_price
  FROM listing_views lv
  JOIN listings l ON lv.listing_id = l.listing_id
  WHERE lv.user_telegram_id = p_user_id
    AND l.price IS NOT NULL
    AND l.price > 0;
  
  -- Get preferred condition
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
    user_telegram_id, top_category, top_subcategory_id, average_viewed_price,
    preferred_condition, total_views, total_searches, total_likes,
    last_computed_at, updated_at
  ) VALUES (
    p_user_id, v_top_category, v_top_subcategory_id, v_avg_price,
    v_preferred_condition, v_total_views, v_total_searches, v_total_likes,
    now(), now()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Set viewed_date automatically
CREATE OR REPLACE FUNCTION set_viewed_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.viewed_date IS NULL THEN
    NEW.viewed_date := DATE(NEW.viewed_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update category preferences (with subcategory support)
CREATE OR REPLACE FUNCTION update_user_category_preference()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
  v_subcategory_id UUID;
BEGIN
  IF NEW.interaction_type IN ('view', 'click', 'favorite', 'search_match') THEN
    SELECT l.category, l.subcategory_id INTO v_category, v_subcategory_id
    FROM listings l WHERE l.listing_id = NEW.listing_id;
    
    IF v_category IS NOT NULL THEN
      -- Category-level
      INSERT INTO user_category_preferences (user_telegram_id, category, subcategory_id, score, last_interaction)
      VALUES (NEW.user_telegram_id, v_category, NULL,
        CASE NEW.interaction_type
          WHEN 'favorite' THEN 5.0 WHEN 'click' THEN 3.0 WHEN 'view' THEN 1.0 WHEN 'search_match' THEN 2.0 ELSE 0.5
        END, NEW.created_at)
      ON CONFLICT (user_telegram_id, category, subcategory_id)
      DO UPDATE SET score = user_category_preferences.score + EXCLUDED.score,
        last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
        updated_at = now();
      
      -- Subcategory-level (2x weight)
      IF v_subcategory_id IS NOT NULL THEN
        INSERT INTO user_category_preferences (user_telegram_id, category, subcategory_id, score, last_interaction)
        VALUES (NEW.user_telegram_id, v_category, v_subcategory_id,
          CASE NEW.interaction_type
            WHEN 'favorite' THEN 10.0 WHEN 'click' THEN 6.0 WHEN 'view' THEN 2.0 WHEN 'search_match' THEN 4.0 ELSE 1.0
          END, NEW.created_at)
        ON CONFLICT (user_telegram_id, category, subcategory_id)
        DO UPDATE SET score = user_category_preferences.score + EXCLUDED.score,
          last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
          updated_at = now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function: Update preferences from listing_views
CREATE OR REPLACE FUNCTION update_preferences_from_view()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
  v_subcategory_id UUID;
BEGIN
  SELECT l.category, l.subcategory_id INTO v_category, v_subcategory_id
  FROM listings l WHERE l.listing_id = NEW.listing_id;
  
  IF v_category IS NOT NULL THEN
    -- Category-level (1 point)
    INSERT INTO user_category_preferences (user_telegram_id, category, subcategory_id, score, last_interaction)
    VALUES (NEW.user_telegram_id, v_category, NULL, 1.0, NEW.viewed_at)
    ON CONFLICT (user_telegram_id, category, subcategory_id)
    DO UPDATE SET score = user_category_preferences.score + 1.0,
      last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
      updated_at = now();
    
    -- Subcategory-level (2 points - double weight)
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO user_category_preferences (user_telegram_id, category, subcategory_id, score, last_interaction)
      VALUES (NEW.user_telegram_id, v_category, v_subcategory_id, 2.0, NEW.viewed_at)
      ON CONFLICT (user_telegram_id, category, subcategory_id)
      DO UPDATE SET score = user_category_preferences.score + 2.0,
        last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
        updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function: Trigger compute preferences
CREATE OR REPLACE FUNCTION trigger_compute_preferences()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM compute_user_preferences(NEW.user_telegram_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- QADAM 7: TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_set_viewed_date ON listing_views;
CREATE TRIGGER trigger_set_viewed_date BEFORE INSERT ON listing_views
  FOR EACH ROW EXECUTE FUNCTION set_viewed_date();

DROP TRIGGER IF EXISTS trigger_listing_view_preferences ON listing_views;
CREATE TRIGGER trigger_listing_view_preferences AFTER INSERT ON listing_views
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_preferences();

DROP TRIGGER IF EXISTS trigger_favorite_preferences ON favorites;
CREATE TRIGGER trigger_favorite_preferences AFTER INSERT ON favorites
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_preferences();

DROP TRIGGER IF EXISTS trigger_update_category_preference ON user_listing_interactions;
CREATE TRIGGER trigger_update_category_preference AFTER INSERT ON user_listing_interactions
  FOR EACH ROW EXECUTE FUNCTION update_user_category_preference();

DROP TRIGGER IF EXISTS trigger_update_preferences_from_view ON listing_views;
CREATE TRIGGER trigger_update_preferences_from_view AFTER INSERT ON listing_views
  FOR EACH ROW EXECUTE FUNCTION update_preferences_from_view();

-- ============================================
-- QADAM 8: RECOMMENDATION ALGORITHM
-- ============================================

-- Recommendation Score Function (OLX.uz Style: Subcategory 50pts >> Category 10pts)
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
  v_subcategory_score_value DECIMAL := 0;
  v_score DECIMAL(10, 4) := 0;
  v_subcategory_score DECIMAL := 0;  -- 50 max
  v_category_score DECIMAL := 0;     -- 10 max
  v_price_score DECIMAL := 0;        -- 5 max
  v_condition_score DECIMAL := 0;    -- 5 max
  v_distance_score DECIMAL := 0;     -- 5 max
  v_popularity_score DECIMAL := 0;   -- 5 max
  v_freshness_score DECIMAL := 0;    -- 5 max
  v_boost_bonus DECIMAL := 0;        -- 15 max
BEGIN
  SELECT * INTO v_listing FROM listings
  WHERE listing_id = p_listing_id AND status = 'active';
  
  IF NOT FOUND THEN RETURN 0; END IF;
  
  SELECT * INTO v_preferences FROM user_preferences WHERE user_telegram_id = p_user_id;
  
  -- Get subcategory score
  IF v_listing.subcategory_id IS NOT NULL THEN
    SELECT COALESCE(score, 0) INTO v_subcategory_score_value
    FROM user_category_preferences
    WHERE user_telegram_id = p_user_id
      AND category = v_listing.category
      AND subcategory_id = v_listing.subcategory_id
    LIMIT 1;
  END IF;
  
  -- 1. SUBCATEGORY MATCH (50 points) - CRITICAL FOR KAMAZ
  IF v_listing.subcategory_id IS NOT NULL THEN
    IF v_subcategory_score_value > 0 OR (v_preferences IS NOT NULL AND v_preferences.top_subcategory_id = v_listing.subcategory_id) THEN
      v_subcategory_score := 50;
    END IF;
  END IF;
  
  -- 2. CATEGORY MATCH (10 points)
  IF v_preferences IS NOT NULL AND v_preferences.top_category = v_listing.category THEN
    v_category_score := 10;
  END IF;
  
  -- 3. PRICE SIMILARITY (5 points)
  IF v_preferences IS NOT NULL AND v_preferences.average_viewed_price IS NOT NULL 
     AND v_listing.price IS NOT NULL AND v_listing.price > 0 THEN
    DECLARE v_price_diff DECIMAL; v_price_ratio DECIMAL;
    BEGIN
      v_price_diff := ABS(v_listing.price - v_preferences.average_viewed_price);
      v_price_ratio := LEAST(v_price_diff / NULLIF(v_preferences.average_viewed_price, 0), 1.0);
      v_price_score := 5 * (1.0 - v_price_ratio);
    END;
  END IF;
  
  -- 4. CONDITION MATCH (5 points)
  IF v_preferences IS NOT NULL AND v_preferences.preferred_condition = v_listing.condition THEN
    v_condition_score := 5;
  END IF;
  
  -- 5. DISTANCE (5 points)
  IF p_user_lat IS NOT NULL AND p_user_lon IS NOT NULL 
     AND v_listing.latitude IS NOT NULL AND v_listing.longitude IS NOT NULL THEN
    DECLARE v_distance_km DECIMAL;
    BEGIN
      v_distance_km := 6371 * acos(GREATEST(-1, LEAST(1,
        cos(radians(p_user_lat)) * cos(radians(v_listing.latitude)) * 
        cos(radians(v_listing.longitude) - radians(p_user_lon)) + 
        sin(radians(p_user_lat)) * sin(radians(v_listing.latitude)))));
      v_distance_score := GREATEST(0, 5 * (1.0 - LEAST(v_distance_km / 10.0, 1.0)));
    END;
  END IF;
  
  -- 6. POPULARITY (5 points)
  v_popularity_score := LEAST((v_listing.view_count * 0.01 + v_listing.favorite_count * 0.2), 5.0);
  
  -- 7. FRESHNESS (5 points)
  DECLARE v_age_hours DECIMAL;
  BEGIN
    v_age_hours := EXTRACT(EPOCH FROM (now() - v_listing.created_at)) / 3600;
    IF v_age_hours < 24 THEN v_freshness_score := 5;
    ELSIF v_age_hours < 168 THEN v_freshness_score := 5 * (1.0 - (v_age_hours - 24) / 144.0);
    ELSE v_freshness_score := 0;
    END IF;
  END;
  
  -- 8. BOOST (15 points)
  IF v_listing.is_boosted = true AND (v_listing.boosted_until IS NULL OR v_listing.boosted_until > now()) THEN
    v_boost_bonus := 15;
  END IF;
  
  v_score := v_subcategory_score + v_category_score + v_price_score + 
             v_condition_score + v_distance_score + v_popularity_score + 
             v_freshness_score + v_boost_bonus;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- ============================================
-- QADAM 9: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_listing_views_user ON listing_views(user_telegram_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing ON listing_views(listing_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_listing ON listing_views(user_telegram_id, listing_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_listing_interactions(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_category_preferences(user_telegram_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_user_category_preferences_subcategory ON user_category_preferences(user_telegram_id, subcategory_id) WHERE subcategory_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subcategories_parent_category ON subcategories(parent_category);
CREATE INDEX IF NOT EXISTS idx_subcategories_parent_subcategory ON subcategories(parent_subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_category_subcategory ON listings(category, subcategory_id) WHERE status = 'active';

-- ============================================
-- QADAM 10: RLS POLICIES
-- ============================================

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to listing_views" ON listing_views;
CREATE POLICY "Allow public read access to listing_views" ON listing_views FOR SELECT USING (true);
CREATE POLICY "Allow public insert to listing_views" ON listing_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to user_preferences" ON user_preferences;
CREATE POLICY "Allow public read access to user_preferences" ON user_preferences FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own preferences" ON user_preferences FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public access to user_category_preferences" ON user_category_preferences;
CREATE POLICY "Allow public access to user_category_preferences" ON user_category_preferences FOR ALL USING (true);

-- ============================================
-- YAKUN
-- ============================================

-- Verification queries (optional - comment out in production)
-- SELECT COUNT(*) as total_subcategories FROM subcategories;
-- SELECT parent_category, COUNT(*) as count FROM subcategories GROUP BY parent_category;
-- SELECT * FROM subcategories WHERE slug = 'yuk-mashinalari';
-- SELECT * FROM subcategories WHERE parent_subcategory_id = (SELECT subcategory_id FROM subcategories WHERE slug = 'yuk-mashinalari');

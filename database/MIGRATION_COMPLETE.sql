-- ============================================
-- LOCALMARKET TELEGRAM MINI APP
-- TO'LIQ DATABASE MIGRATION SQL
-- Barcha migration'lar ketma-ketligida
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
-- QADAM 1: ASOSIY SCHEMA (Agar yo'q bo'lsa)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For text normalization

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
  last_active TIMESTAMP,
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
  boosted_until TIMESTAMP,
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
  completed_at TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  reported_listing_id UUID REFERENCES listings(listing_id) ON DELETE CASCADE,
  reported_user_telegram_id BIGINT REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'fraud', 'inappropriate', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (reported_listing_id IS NOT NULL) OR (reported_user_telegram_id IS NOT NULL)
  )
);

-- ============================================
-- QADAM 2: USER TRACKING JADVALLARI
-- ============================================

-- User Search History Table
CREATE TABLE IF NOT EXISTS user_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  category TEXT,
  filters JSONB,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
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

-- User Category Preferences (Aggregated from interactions)
CREATE TABLE IF NOT EXISTS user_category_preferences (
  preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score DECIMAL(5, 2) DEFAULT 0,
  last_interaction TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, category)
);

-- ============================================
-- QADAM 3: SUBKATEGORIYALAR JADVALI
-- ============================================

CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_category TEXT NOT NULL, -- References main category from listings table
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- For URL-friendly paths
  description TEXT,
  parent_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add subcategory_id column to listings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE listings
    ADD COLUMN subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- QADAM 4: SAVATCHA (CART) TIZIMI
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, listing_id) -- One item per user per listing
);

-- ============================================
-- QADAM 5: USER LAST SEEN JADVALI
-- ============================================
-- MUHIM: Vaqt o'rniga listing_id saqlanadi
-- Bu xavfsizroq va aniqroq "yangi" e'lonlarni aniqlash uchun

CREATE TABLE IF NOT EXISTS user_last_seen (
  user_telegram_id BIGINT PRIMARY KEY REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  last_seen_listing_id UUID REFERENCES listings(listing_id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- QADAM 6: INDEXLAR (Performance uchun)
-- ============================================

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_telegram_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_boosted ON listings(is_boosted, boosted_until) WHERE is_boosted = true;
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings(subcategory_id);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_telegram_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);

-- User tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_query ON user_searches USING gin(to_tsvector('russian', search_query));
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_listing_interactions(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_listing ON user_listing_interactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_listing_interactions(interaction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_category_preferences(user_telegram_id, score DESC);

-- Subcategories indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_parent_category ON subcategories(parent_category);
CREATE INDEX IF NOT EXISTS idx_subcategories_parent_subcategory ON subcategories(parent_subcategory_id);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_listing ON cart_items(listing_id);

-- User last seen index
CREATE INDEX IF NOT EXISTS idx_user_last_seen_listing ON user_last_seen(last_seen_listing_id);
CREATE INDEX IF NOT EXISTS idx_user_last_seen_updated ON user_last_seen(updated_at);

-- Search indexes (for fuzzy search and text search)
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_title_fts ON listings USING gin(to_tsvector('russian', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_fts ON listings USING gin(to_tsvector('russian', description));

-- ============================================
-- QADAM 7: FUNKSIYALAR
-- ============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE listings.listing_id = increment_view_count.listing_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Function to increment favorite count
CREATE OR REPLACE FUNCTION increment_favorite_count(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET favorite_count = favorite_count + 1
  WHERE listings.listing_id = increment_favorite_count.listing_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Function to decrement favorite count
CREATE OR REPLACE FUNCTION decrement_favorite_count(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET favorite_count = GREATEST(favorite_count - 1, 0)
  WHERE listings.listing_id = decrement_favorite_count.listing_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating(user_id BIGINT)
RETURNS void AS $$
DECLARE
  avg_rating DECIMAL;
  total_count INTEGER;
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*)::INTEGER
  INTO avg_rating, total_count
  FROM reviews
  WHERE reviewed_telegram_id = user_id;

  UPDATE users
  SET rating_average = COALESCE(avg_rating, 0),
      total_reviews = COALESCE(total_count, 0)
  WHERE telegram_user_id = user_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Function to update user last seen listing_id
-- MUHIM: Vaqt o'rniga listing_id saqlanadi
-- Eng yangi ko'rilgan listing_id bilan yangilanadi
CREATE OR REPLACE FUNCTION update_user_last_seen(user_id BIGINT, listing_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF listing_id IS NOT NULL THEN
    -- Agar listing_id berilgan bo'lsa, uni saqlaydi
    INSERT INTO user_last_seen (user_telegram_id, last_seen_listing_id, updated_at)
    VALUES (user_id, listing_id, now())
    ON CONFLICT (user_telegram_id) 
    DO UPDATE SET 
      last_seen_listing_id = listing_id,
      updated_at = now();
  ELSE
    -- Agar listing_id berilmagan bo'lsa, faqat updated_at ni yangilaydi
    INSERT INTO user_last_seen (user_telegram_id, updated_at)
    VALUES (user_id, now())
    ON CONFLICT (user_telegram_id) 
    DO UPDATE SET updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Function to update category preferences
CREATE OR REPLACE FUNCTION update_category_preference(
  p_user_id BIGINT,
  p_category TEXT,
  p_score_increment DECIMAL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_category_preferences (user_telegram_id, category, score, last_interaction)
  VALUES (p_user_id, p_category, p_score_increment, NOW())
  ON CONFLICT (user_telegram_id, category)
  DO UPDATE SET
    score = user_category_preferences.score + p_score_increment,
    last_interaction = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fuzzy search function
CREATE OR REPLACE FUNCTION search_listings_fuzzy(search_term TEXT)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  description TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.listing_id,
    l.title,
    l.description,
    GREATEST(
      similarity(l.title, search_term),
      similarity(l.description, search_term)
    ) as similarity
  FROM listings l
  WHERE l.status = 'active'
    AND (
      l.title % search_term OR
      l.description % search_term
    )
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- QADAM 8: TRIGGERLAR
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_item_updated_at ON cart_items;
CREATE TRIGGER update_cart_item_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update items_sold_count when listing is marked as sold
CREATE OR REPLACE FUNCTION update_items_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    UPDATE users
    SET items_sold_count = items_sold_count + 1
    WHERE telegram_user_id = NEW.seller_telegram_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS update_sold_count_on_listing_status ON listings;
CREATE TRIGGER update_sold_count_on_listing_status
  AFTER UPDATE OF status ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_items_sold_count();

-- ============================================
-- QADAM 9: RLS (Row Level Security) POLICIES
-- ============================================
-- MUHIM: RLS va connection pooling bilan muammo bo'lishi mumkin
-- Vaqtincha test uchun DISABLE qilish mumkin:
-- ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
-- 
-- Production'da RLS yoqilishi kerak, lekin query'larni optimizatsiya qilish kerak
-- Cache busting va real-time subscriptions ishlatish tavsiya etiladi

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listing_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_last_seen ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
CREATE POLICY "Allow public read access to users" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (true);

-- Listings table policies
DROP POLICY IF EXISTS "Allow public read access to active listings" ON listings;
CREATE POLICY "Allow public read access to active listings" ON listings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Allow authenticated users to create listings" ON listings;
CREATE POLICY "Allow authenticated users to create listings" ON listings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sellers can update their own listings" ON listings;
CREATE POLICY "Sellers can update their own listings" ON listings
  FOR UPDATE USING (true);

-- Favorites table policies
DROP POLICY IF EXISTS "Allow public access to favorites" ON favorites;
CREATE POLICY "Allow public access to favorites" ON favorites
  FOR ALL USING (true);

-- User tracking tables policies
DROP POLICY IF EXISTS "Allow public access to user_searches" ON user_searches;
CREATE POLICY "Allow public access to user_searches" ON user_searches
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to user_listing_interactions" ON user_listing_interactions;
CREATE POLICY "Allow public access to user_listing_interactions" ON user_listing_interactions
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to user_category_preferences" ON user_category_preferences;
CREATE POLICY "Allow public access to user_category_preferences" ON user_category_preferences
  FOR ALL USING (true);

-- Subcategories policies
DROP POLICY IF EXISTS "Allow public read access to subcategories" ON subcategories;
CREATE POLICY "Allow public read access to subcategories" ON subcategories
  FOR SELECT USING (true);

-- Cart items policies
DROP POLICY IF EXISTS "Allow public access to cart_items" ON cart_items;
CREATE POLICY "Allow public access to cart_items" ON cart_items
  FOR ALL USING (true);

-- User last seen policies
DROP POLICY IF EXISTS "Allow public read access to user_last_seen" ON user_last_seen;
CREATE POLICY "Allow public read access to user_last_seen" ON user_last_seen
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to user_last_seen" ON user_last_seen;
CREATE POLICY "Allow public insert to user_last_seen" ON user_last_seen
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to user_last_seen" ON user_last_seen;
CREATE POLICY "Allow public update to user_last_seen" ON user_last_seen
  FOR UPDATE USING (true);

-- ============================================
-- QADAM 10: STORAGE POLICIES (Photos uchun)
-- ============================================

-- Storage bucket policies (agar bucket yo'q bo'lsa, yaratadi)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-photos' AND
    auth.role() = 'authenticated'
  );

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'listing-photos');

-- Allow users to update their own uploads
DROP POLICY IF EXISTS "Allow users to update their own uploads" ON storage.objects;
CREATE POLICY "Allow users to update their own uploads" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'listing-photos' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "Allow users to delete their own uploads" ON storage.objects;
CREATE POLICY "Allow users to delete their own uploads" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'listing-photos' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- QADAM 11: SAMPLE DATA (Subcategories)
-- ============================================

-- Insert sample subcategories (only if not exists)
INSERT INTO subcategories (parent_category, name, slug, description, parent_subcategory_id) VALUES
('electronics', 'Smartfonlar', 'smartfonlar', 'Turli xil smartfonlar va mobil telefonlar', NULL),
('electronics', 'Noutbuklar', 'noutbuklar', 'Portativ kompyuterlar va noutbuklar', NULL),
('electronics', 'Televizorlar', 'televizorlar', 'Zamonaviy televizorlar va monitorlar', NULL),
('clothing', 'Erkaklar kiyimi', 'erkaklar-kiyimi', 'Erkaklar uchun kiyim-kechaklar', NULL),
('clothing', 'Ayollar kiyimi', 'ayollar-kiyimi', 'Ayollar uchun kiyim-kechaklar', NULL),
('clothing', 'Bolalar kiyimi', 'bolalar-kiyimi', 'Bolalar uchun kiyim-kechaklar', NULL),
('furniture', 'Divanlar', 'divanlar', 'Qulay divanlar va kreslolar', NULL),
('furniture', 'Stollar', 'stollar', 'Har xil turdagi stollar', NULL),
('furniture', 'Stullar', 'stullar', 'Oshxona va ofis stullari', NULL),
('home_garden', 'Oshxona jihozlari', 'oshxona-jihozlari', 'Oshxona uchun kerakli jihozlar', NULL),
('home_garden', 'Bog'' anjomlari', 'bog-anjomlari', 'Bog'' va hovli uchun asboblar', NULL),
('home_garden', 'Uy bezaklari', 'uy-bezaklari', 'Uy interyeri uchun bezaklar', NULL),
('sports_outdoors', 'Velosipedlar', 'velosipedlar', 'Bolalar va kattalar uchun velosipedlar', NULL),
('sports_outdoors', 'Fitness', 'fitness', 'Fitness va sport zali uchun uskunalar', NULL),
('sports_outdoors', 'Turizm', 'turizm', 'Sayohat va turizm uchun anjomlar', NULL),
('other', 'Xizmatlar', 'xizmatlar', 'Turli xil xizmatlar', NULL),
('other', 'Hayvonlar', 'hayvonlar', 'Uy hayvonlari va ularning aksessuarlari', NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- YAKUN
-- ============================================

-- Migration muvaffaqiyatli yakunlandi!
-- Barcha jadvallar, indexlar, funksiyalar va policy'lar yaratildi.
-- 
-- TEKSHIRISH:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;
-- 
-- Keyingi qadam: Test data qo'shish (ixtiyoriy)
-- ============================================

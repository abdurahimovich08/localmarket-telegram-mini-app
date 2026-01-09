-- LocalMarket Telegram Mini App Database Schema
-- For PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  favorite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
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
  created_at TIMESTAMP DEFAULT NOW(),
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
  created_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    (reported_listing_id IS NOT NULL) OR (reported_user_telegram_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_telegram_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_telegram_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);

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

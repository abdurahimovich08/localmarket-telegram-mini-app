-- Add Subcategories System
-- This migration adds support for subcategories (eBay-style category hierarchy)

-- Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_category TEXT NOT NULL CHECK (parent_category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'other')),
  subcategory_key TEXT NOT NULL, -- e.g., 'kamaz', 'nexia', 'gazel'
  subcategory_label TEXT NOT NULL, -- e.g., 'Kamaz', 'Nexia', 'Gazel'
  emoji TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_category, subcategory_key)
);

-- Add subcategory_id to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE SET NULL;

-- Create index for subcategory lookups
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_parent ON subcategories(parent_category);

-- Insert sample subcategories for vehicles (example)
-- Electronics subcategories
INSERT INTO subcategories (parent_category, subcategory_key, subcategory_label, emoji, display_order) VALUES
('electronics', 'telefon', 'Telefonlar', '📱', 1),
('electronics', 'noutbuk', 'Noutbuklar', '💻', 2),
('electronics', 'kompyuter', 'Kompyuterlar', '🖥️', 3),
('electronics', 'planshet', 'Planshetlar', '📱', 4),
('electronics', 'televizor', 'Televizorlar', '📺', 5)
ON CONFLICT (parent_category, subcategory_key) DO NOTHING;

-- Clothing subcategories
INSERT INTO subcategories (parent_category, subcategory_key, subcategory_label, emoji, display_order) VALUES
('clothing', 'erkak_kiyim', 'Erkaklar kiyimi', '👔', 1),
('clothing', 'ayol_kiyim', 'Ayollar kiyimi', '👗', 2),
('clothing', 'oyoq_kiyim', 'Oyoq kiyim', '👟', 3),
('clothing', 'aksesuar', 'Aksessuarlar', '👜', 4)
ON CONFLICT (parent_category, subcategory_key) DO NOTHING;

-- Sports subcategories (vehicles example - mashinalar)
INSERT INTO subcategories (parent_category, subcategory_key, subcategory_label, emoji, display_order) VALUES
('sports_outdoors', 'mashina', 'Mashinalar', '🚗', 1),
('sports_outdoors', 'kamaz', 'Kamaz', '🚛', 2),
('sports_outdoors', 'nexia', 'Nexia', '🚙', 3),
('sports_outdoors', 'gazel', 'Gazel', '🚐', 4),
('sports_outdoors', 'bmw', 'BMW', '🚗', 5)
ON CONFLICT (parent_category, subcategory_key) DO NOTHING;

-- Nested subcategories (sub-subcategories) - e.g., Kamaz > Yevro Kamaz
-- We'll use a path-based approach: parent_category + subcategory_key forms the path
-- For now, we'll add a parent_subcategory_id for nested structure
ALTER TABLE subcategories 
ADD COLUMN IF NOT EXISTS parent_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE;

-- Add nested subcategories example: Kamaz > Yevro Kamaz
INSERT INTO subcategories (parent_category, subcategory_key, subcategory_label, emoji, display_order, parent_subcategory_id) 
SELECT 
  'sports_outdoors',
  'yevro_kamaz',
  'Yevro Kamaz',
  '🚛',
  1,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND subcategory_key = 'kamaz'
ON CONFLICT (parent_category, subcategory_key) DO NOTHING;

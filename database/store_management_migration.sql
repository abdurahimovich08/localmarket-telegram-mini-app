-- ============================================
-- STORE MANAGEMENT SYSTEM MIGRATION
-- ============================================
-- 
-- WHAT: Adds store categories, product management, and enhanced posts
-- WHY: Enable full store management (Shopify-like) within Telegram Mini App
-- WHEN: Run in Supabase SQL Editor
--
-- REQUIRED: Run this AFTER schema_final.sql
-- ============================================

-- ============================================
-- STEP 1: STORE CATEGORIES TABLE
-- ============================================

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

-- Index for store categories
CREATE INDEX IF NOT EXISTS idx_store_categories_store ON store_categories(store_id, order_index ASC) WHERE is_active = TRUE;

-- ============================================
-- STEP 2: ENHANCE LISTINGS TABLE FOR STORE PRODUCTS
-- ============================================

-- Add store category reference
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'store_category_id'
  ) THEN
    ALTER TABLE listings ADD COLUMN store_category_id UUID REFERENCES store_categories(category_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add old_price for promotions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'old_price'
  ) THEN
    ALTER TABLE listings ADD COLUMN old_price DECIMAL(10, 2);
  END IF;
END $$;

-- Add stock quantity
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'stock_qty'
  ) THEN
    ALTER TABLE listings ADD COLUMN stock_qty INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Add order_index for sorting within category
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE listings ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add location fields if not exist (for store products)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE listings ADD COLUMN location TEXT;
  END IF;
END $$;

-- Indexes for store products
CREATE INDEX IF NOT EXISTS idx_listings_store_category ON listings(store_category_id, order_index ASC) WHERE store_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_store_stock ON listings(store_id, stock_qty) WHERE store_id IS NOT NULL AND stock_qty IS NOT NULL;

-- ============================================
-- STEP 3: ENHANCE STORE POSTS TABLE
-- ============================================

-- Add order_index for sorting
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'store_posts' 
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE store_posts ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add is_pinned for pinning posts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'store_posts' 
    AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE store_posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update index for store posts
DROP INDEX IF EXISTS idx_store_posts_store;
CREATE INDEX IF NOT EXISTS idx_store_posts_store ON store_posts(store_id, is_pinned DESC, order_index ASC, created_at DESC);

-- ============================================
-- STEP 4: RLS POLICIES FOR STORE CATEGORIES
-- ============================================

-- Enable RLS
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

-- Store owners can manage their categories
CREATE POLICY "Store owners can view their categories"
  ON store_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_categories.store_id 
      AND stores.owner_telegram_id = (SELECT current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::BIGINT
    )
  );

CREATE POLICY "Store owners can insert their categories"
  ON store_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_categories.store_id 
      AND stores.owner_telegram_id = (SELECT current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::BIGINT
    )
  );

CREATE POLICY "Store owners can update their categories"
  ON store_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_categories.store_id 
      AND stores.owner_telegram_id = (SELECT current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::BIGINT
    )
  );

CREATE POLICY "Store owners can delete their categories"
  ON store_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id = store_categories.store_id 
      AND stores.owner_telegram_id = (SELECT current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::BIGINT
    )
  );

-- Public can view active categories (for customer view)
CREATE POLICY "Public can view active store categories"
  ON store_categories FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- STEP 5: HELPER FUNCTIONS
-- ============================================

-- Function to get max order_index for a store category
CREATE OR REPLACE FUNCTION get_max_category_order(store_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(order_index) FROM store_categories WHERE store_id = store_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get max order_index for listings in a category
CREATE OR REPLACE FUNCTION get_max_listing_order(category_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(order_index) FROM listings WHERE store_category_id = category_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to reorder categories
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
    SET order_index = (cat_record.value)::INTEGER,
        updated_at = now()
    WHERE category_id = (cat_record.key)::UUID
      AND store_id = store_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to reorder listings in a category
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
    SET order_index = (list_record.value)::INTEGER,
        updated_at = now()
    WHERE listing_id = (list_record.key)::UUID
      AND store_category_id = category_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: TRIGGERS
-- ============================================

-- Update updated_at for store_categories
CREATE OR REPLACE FUNCTION update_store_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_store_categories_updated_at ON store_categories;
CREATE TRIGGER trigger_update_store_categories_updated_at
  BEFORE UPDATE ON store_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_store_categories_updated_at();

-- ============================================
-- STEP 7: COMMENTS
-- ============================================

COMMENT ON TABLE store_categories IS 'Store-specific product categories';
COMMENT ON COLUMN store_categories.order_index IS 'Display order within store (lower = first)';
COMMENT ON COLUMN listings.store_category_id IS 'Reference to store category (if product belongs to a store)';
COMMENT ON COLUMN listings.old_price IS 'Previous price for promotions (shows discount)';
COMMENT ON COLUMN listings.stock_qty IS 'Available stock quantity (NULL = unlimited)';
COMMENT ON COLUMN listings.order_index IS 'Display order within category (lower = first)';
COMMENT ON COLUMN store_posts.order_index IS 'Display order (lower = first)';
COMMENT ON COLUMN store_posts.is_pinned IS 'Pinned posts appear first';

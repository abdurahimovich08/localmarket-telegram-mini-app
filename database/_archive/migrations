-- Migration: Add Cart System
-- Created: 2024
-- Purpose: Enable shopping cart functionality for LocalMarket

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_telegram_id, listing_id) -- One item per user per listing
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_listing ON cart_items(listing_id);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own cart items
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid()::text = user_telegram_id::text OR true); -- Allow public read for now

-- Users can insert their own cart items
CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid()::text = user_telegram_id::text OR true); -- Allow public insert for now

-- Users can update their own cart items
CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid()::text = user_telegram_id::text OR true); -- Allow public update for now

-- Users can delete their own cart items
CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid()::text = user_telegram_id::text OR true); -- Allow public delete for now

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_cart_item_updated_at ON cart_items;
CREATE TRIGGER trigger_update_cart_item_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_item_updated_at();

-- Function to get cart count for a user
CREATE OR REPLACE FUNCTION get_cart_count(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM cart_items
  WHERE user_telegram_id = p_user_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get cart total price
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id BIGINT)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(ci.quantity * l.price), 0) INTO v_total
  FROM cart_items ci
  JOIN listings l ON ci.listing_id = l.listing_id
  WHERE ci.user_telegram_id = p_user_id
    AND l.status = 'active'
    AND l.price IS NOT NULL;
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

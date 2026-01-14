-- ============================================
-- UNIFIED ITEMS VIEW
-- ============================================
-- 
-- WHAT: Unified view for all items (listings, services, store products)
-- WHY: Enable unified search, favorites, and analytics
-- WHEN: Run in Supabase SQL Editor
--
-- REQUIRED: Run this AFTER schema_final.sql
-- ============================================

-- ============================================
-- UNIFIED ITEMS VIEW
-- ============================================

CREATE OR REPLACE VIEW unified_items AS
SELECT 
  listing_id as item_id,
  CONCAT('product:', listing_id::text) as stable_id,
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
  CONCAT('store_product:', listing_id::text) as stable_id,
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
  CONCAT('service:', service_id::text) as stable_id,
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
  0 as favorite_count, -- Services don't have favorites table yet
  false as is_boosted,
  created_at,
  updated_at,
  NULL::integer as stock_qty,
  NULL::numeric as old_price
FROM services
WHERE status = 'active';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for search by type
CREATE INDEX IF NOT EXISTS idx_unified_items_type ON listings(status, store_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_unified_items_service_status ON services(status) WHERE status = 'active';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to search unified items
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
    ui.item_id,
    ui.stable_id,
    ui.item_type,
    ui.title,
    ui.description,
    ui.price,
    ui.price_type,
    ui.category,
    ui.owner_id,
    ui.store_id,
    ui.image_url,
    ui.status,
    ui.view_count,
    ui.favorite_count,
    ui.created_at
  FROM unified_items ui
  WHERE 
    (search_query IS NULL OR 
     ui.title ILIKE '%' || search_query || '%' OR 
     ui.description ILIKE '%' || search_query || '%')
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
-- COMMENTS
-- ============================================

COMMENT ON VIEW unified_items IS 'Unified view of all items (listings, services, store products) for search and analytics';
COMMENT ON FUNCTION search_unified_items IS 'Search function for unified items with filters';

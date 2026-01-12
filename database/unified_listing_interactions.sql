-- =====================================================
-- UNIFIED LISTING INTERACTIONS TABLE
-- 
-- Phase 1: Creates unified analytics table
-- Phase 2: Migrates service_interactions data
-- Phase 3: Adds product and store_product interactions
-- 
-- This allows unified analytics across all entity types
-- =====================================================

-- Unified listing interactions table
CREATE TABLE IF NOT EXISTS listing_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('service', 'product', 'store_product')),
  user_telegram_id BIGINT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'contact', 'order')),
  matched_tags TEXT[],
  search_query TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_listing_interactions_listing ON listing_interactions(listing_id, listing_type);
CREATE INDEX IF NOT EXISTS idx_listing_interactions_user ON listing_interactions(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_listing_interactions_type ON listing_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_listing_interactions_created ON listing_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_interactions_tags ON listing_interactions USING GIN(matched_tags);
CREATE INDEX IF NOT EXISTS idx_listing_interactions_listing_type ON listing_interactions(listing_type);

-- Tag conversion metrics (unified materialized view)
DROP MATERIALIZED VIEW IF EXISTS unified_tag_conversion_metrics;
CREATE MATERIALIZED VIEW unified_tag_conversion_metrics AS
SELECT
  tag,
  listing_type,
  COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN listing_id END) as view_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN listing_id END) as click_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN listing_id END) as contact_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'order' THEN listing_id END) as order_count,
  COUNT(DISTINCT listing_id) as total_listings,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN listing_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN listing_id END)::FLOAT / 
         COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN listing_id END)::FLOAT
    ELSE 0
  END as click_through_rate,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN listing_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN listing_id END)::FLOAT / 
         COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN listing_id END)::FLOAT
    ELSE 0
  END as contact_rate,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN listing_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN interaction_type = 'order' THEN listing_id END)::FLOAT / 
         COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN listing_id END)::FLOAT
    ELSE 0
  END as conversion_rate,
  MAX(created_at) as last_used
FROM listing_interactions,
LATERAL unnest(matched_tags) as tag
GROUP BY tag, listing_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_tag_conversion_metrics_tag_type 
  ON unified_tag_conversion_metrics(tag, listing_type);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_unified_tag_conversion_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY unified_tag_conversion_metrics;
END;
$$ LANGUAGE plpgsql;

-- Migration function: Copy service_interactions to listing_interactions
-- Phase 1: Run this to migrate existing service data
CREATE OR REPLACE FUNCTION migrate_service_interactions_to_unified()
RETURNS void AS $$
BEGIN
  INSERT INTO listing_interactions (
    listing_id,
    listing_type,
    user_telegram_id,
    interaction_type,
    matched_tags,
    search_query,
    created_at
  )
  SELECT 
    service_id as listing_id,
    'service' as listing_type,
    user_telegram_id,
    interaction_type,
    matched_tags,
    search_query,
    created_at
  FROM service_interactions
  WHERE NOT EXISTS (
    SELECT 1 FROM listing_interactions li
    WHERE li.listing_id = service_interactions.service_id
      AND li.listing_type = 'service'
      AND li.user_telegram_id = service_interactions.user_telegram_id
      AND li.interaction_type = service_interactions.interaction_type
      AND li.created_at = service_interactions.created_at
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE listing_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to listing_interactions" ON listing_interactions;
CREATE POLICY "Allow public insert to listing_interactions"
ON listing_interactions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to listing_interactions" ON listing_interactions;
CREATE POLICY "Allow public read access to listing_interactions"
ON listing_interactions FOR SELECT
USING (true);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This table unifies analytics across all listing types
-- 2. Phase 1: Only services use this (via adapter)
-- 3. Phase 2: Products will start using this
-- 4. Phase 3: Store products will use this
-- 5. service_interactions table remains for backward compatibility
-- 6. Migration function copies existing service data
-- 7. Materialized view provides unified tag metrics per listing type

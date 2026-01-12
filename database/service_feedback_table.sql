-- =====================================================
-- SERVICE FEEDBACK TABLE (Priority A: Conversion Tracking)
-- Tracks which tags lead to views, clicks, and conversions
-- =====================================================

-- Service interactions table (tracks user actions)
CREATE TABLE IF NOT EXISTS service_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
  user_telegram_id BIGINT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'contact', 'order')),
  matched_tags TEXT[], -- Tags that matched in search
  search_query TEXT, -- Original search query
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_interactions_service ON service_interactions(service_id);
CREATE INDEX IF NOT EXISTS idx_service_interactions_user ON service_interactions(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_service_interactions_type ON service_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_service_interactions_created ON service_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_interactions_tags ON service_interactions USING GIN(matched_tags);

-- Tag conversion metrics (aggregated view)
CREATE MATERIALIZED VIEW IF NOT EXISTS tag_conversion_metrics AS
SELECT
  tag,
  COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN service_id END) as view_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN service_id END) as click_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN service_id END) as contact_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'order' THEN service_id END) as order_count,
  COUNT(DISTINCT service_id) as total_services,
  -- Conversion rates
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN service_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN service_id END)::FLOAT / 
         COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN service_id END)::FLOAT
    ELSE 0
  END as click_through_rate,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN service_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN service_id END)::FLOAT / 
         COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN service_id END)::FLOAT
    ELSE 0
  END as contact_rate,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN service_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN interaction_type = 'order' THEN service_id END)::FLOAT / 
         COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN service_id END)::FLOAT
    ELSE 0
  END as conversion_rate,
  MAX(created_at) as last_used
FROM service_interactions,
LATERAL unnest(matched_tags) as tag
GROUP BY tag;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_conversion_metrics_tag ON tag_conversion_metrics(tag);

-- Refresh function (call periodically, e.g., every hour)
CREATE OR REPLACE FUNCTION refresh_tag_conversion_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tag_conversion_metrics;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE service_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to service_interactions" ON service_interactions;
CREATE POLICY "Allow public insert to service_interactions"
ON service_interactions FOR INSERT
USING (true);

DROP POLICY IF EXISTS "Allow public read access to service_interactions" ON service_interactions;
CREATE POLICY "Allow public read access to service_interactions"
ON service_interactions FOR SELECT
USING (true);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. service_interactions tracks all user actions (view, click, contact, order)
-- 2. matched_tags stores which tags matched in the search that led to this interaction
-- 3. tag_conversion_metrics provides aggregated conversion rates per tag
-- 4. Conversion-based ranking: tags with higher conversion_rate get higher weight
-- 5. Refresh materialized view periodically (e.g., via cron job)

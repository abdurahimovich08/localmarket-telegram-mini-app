-- =====================================================
-- SUPABASE COMPLETE SETUP
-- Barcha kerakli jadvallar, funksiyalar va RLS policies
-- Bu faylni Supabase SQL Editor'da ishga tushiring
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SERVICES TABLE (asosiy jadval)
-- =====================================================

-- Services jadvali allaqachon mavjud bo'lishi kerak
-- Faqat fingerprint column qo'shamiz (agar yo'q bo'lsa)
DO $$ 
BEGIN
  -- Check if services table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    -- Add fingerprint column if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'services' AND column_name = 'fingerprint'
    ) THEN
      ALTER TABLE services ADD COLUMN fingerprint TEXT;
      CREATE INDEX IF NOT EXISTS idx_services_fingerprint ON services(fingerprint);
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. TAG ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tag_usage (
  tag_value TEXT PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT now(),
  search_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tag_usage_count ON tag_usage(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_usage_last_used ON tag_usage(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_tag_usage_search_count ON tag_usage(search_count DESC);

-- Function to update tag usage
CREATE OR REPLACE FUNCTION update_tag_usage(tags_array TEXT[])
RETURNS void AS $$
BEGIN
  INSERT INTO tag_usage (tag_value, usage_count, last_used, updated_at)
  SELECT 
    tag,
    1,
    now(),
    now()
  FROM unnest(tags_array) AS tag
  ON CONFLICT (tag_value) 
  DO UPDATE SET
    usage_count = tag_usage.usage_count + 1,
    last_used = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to increment search count for tags
CREATE OR REPLACE FUNCTION increment_tag_search_count(tags_array TEXT[])
RETURNS void AS $$
BEGIN
  INSERT INTO tag_usage (tag_value, search_count, updated_at)
  SELECT 
    tag,
    1,
    now()
  FROM unnest(tags_array) AS tag
  ON CONFLICT (tag_value) 
  DO UPDATE SET
    search_count = tag_usage.search_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to increment match count for tags
CREATE OR REPLACE FUNCTION increment_tag_match_count(tags_array TEXT[])
RETURNS void AS $$
BEGIN
  INSERT INTO tag_usage (tag_value, match_count, updated_at)
  SELECT 
    tag,
    1,
    now()
  FROM unnest(tags_array) AS tag
  ON CONFLICT (tag_value) 
  DO UPDATE SET
    match_count = tag_usage.match_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger for tag_usage
CREATE OR REPLACE FUNCTION update_tag_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tag_usage_updated_at ON tag_usage;
CREATE TRIGGER update_tag_usage_updated_at
  BEFORE UPDATE ON tag_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_updated_at();

-- RLS Policies for tag_usage
ALTER TABLE tag_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to tag_usage" ON tag_usage;
CREATE POLICY "Allow public read access to tag_usage"
ON tag_usage FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow system to insert tag_usage" ON tag_usage;
CREATE POLICY "Allow system to insert tag_usage"
ON tag_usage FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow system to update tag_usage" ON tag_usage;
CREATE POLICY "Allow system to update tag_usage"
ON tag_usage FOR UPDATE
USING (true) WITH CHECK (true);

-- =====================================================
-- 3. SERVICE FEEDBACK TABLE (Conversion Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS service_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
  user_telegram_id BIGINT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'contact', 'order')),
  matched_tags TEXT[],
  search_query TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_interactions_service ON service_interactions(service_id);
CREATE INDEX IF NOT EXISTS idx_service_interactions_user ON service_interactions(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_service_interactions_type ON service_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_service_interactions_created ON service_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_interactions_tags ON service_interactions USING GIN(matched_tags);

-- Tag conversion metrics (materialized view)
DROP MATERIALIZED VIEW IF EXISTS tag_conversion_metrics;
CREATE MATERIALIZED VIEW tag_conversion_metrics AS
SELECT
  tag,
  COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN service_id END) as view_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'click' THEN service_id END) as click_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'contact' THEN service_id END) as contact_count,
  COUNT(DISTINCT CASE WHEN interaction_type = 'order' THEN service_id END) as order_count,
  COUNT(DISTINCT service_id) as total_services,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_conversion_metrics_tag ON tag_conversion_metrics(tag);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_tag_conversion_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tag_conversion_metrics;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for service_interactions
ALTER TABLE service_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to service_interactions" ON service_interactions;
CREATE POLICY "Allow public insert to service_interactions"
ON service_interactions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to service_interactions" ON service_interactions;
CREATE POLICY "Allow public read access to service_interactions"
ON service_interactions FOR SELECT
USING (true);

-- =====================================================
-- 4. A/B TESTING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT NOT NULL,
  experiment_type TEXT NOT NULL CHECK (experiment_type IN ('ranking_formula', 'ai_tag_variants', 'ui_variant')),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B', 'C')),
  user_telegram_id BIGINT,
  service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiments_experiment_id ON experiments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiments_type ON experiments(experiment_type);
CREATE INDEX IF NOT EXISTS idx_experiments_variant ON experiments(variant);
CREATE INDEX IF NOT EXISTS idx_experiments_user ON experiments(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_experiments_created ON experiments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiments_metadata ON experiments USING GIN(metadata);

-- RLS Policies for experiments
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to experiments" ON experiments;
CREATE POLICY "Allow public insert to experiments"
ON experiments FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to experiments" ON experiments;
CREATE POLICY "Allow public read access to experiments"
ON experiments FOR SELECT
USING (true);

-- =====================================================
-- 5. DASHBOARD ANALYTICS TABLES
-- =====================================================

-- Dashboard visits (for streak tracking)
CREATE TABLE IF NOT EXISTS dashboard_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_telegram_id BIGINT NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_visits_user_date ON dashboard_visits(user_telegram_id, visit_date DESC);

-- Recommendation applications (track what recommendations were applied)
CREATE TABLE IF NOT EXISTS recommendation_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_telegram_id BIGINT NOT NULL,
  service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  recommendation_description TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  impact_metrics JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_recommendation_applications_user ON recommendation_applications(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_service ON recommendation_applications(service_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_date ON recommendation_applications(applied_at DESC);

-- Health score history (daily snapshots)
CREATE TABLE IF NOT EXISTS health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL,
  factors JSONB NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, date)
);

CREATE INDEX IF NOT EXISTS idx_health_score_history_service_date ON health_score_history(service_id, date DESC);

-- Rank history (track rank changes over time)
CREATE TABLE IF NOT EXISTS rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  rank INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rank_history_service_date ON rank_history(service_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_rank_history_query ON rank_history(query);

-- Seller metrics summary (aggregated daily)
CREATE TABLE IF NOT EXISTS seller_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_telegram_id BIGINT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  dashboard_visits INTEGER DEFAULT 0,
  recommendations_applied INTEGER DEFAULT 0,
  avg_health_score NUMERIC(5,2),
  rank_recovery_count INTEGER DEFAULT 0,
  services_active INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, date)
);

CREATE INDEX IF NOT EXISTS idx_seller_metrics_daily_user_date ON seller_metrics_daily(user_telegram_id, date DESC);

-- RLS Policies for dashboard analytics tables
ALTER TABLE dashboard_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Dashboard visits policies
DROP POLICY IF EXISTS "Allow public select dashboard_visits" ON dashboard_visits;
CREATE POLICY "Allow public select dashboard_visits" ON dashboard_visits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert dashboard_visits" ON dashboard_visits;
CREATE POLICY "Allow public insert dashboard_visits" ON dashboard_visits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update dashboard_visits" ON dashboard_visits;
CREATE POLICY "Allow public update dashboard_visits" ON dashboard_visits
  FOR UPDATE USING (true) WITH CHECK (true);

-- Recommendation applications policies
DROP POLICY IF EXISTS "Allow public select recommendation_applications" ON recommendation_applications;
CREATE POLICY "Allow public select recommendation_applications" ON recommendation_applications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert recommendation_applications" ON recommendation_applications;
CREATE POLICY "Allow public insert recommendation_applications" ON recommendation_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update recommendation_applications" ON recommendation_applications;
CREATE POLICY "Allow public update recommendation_applications" ON recommendation_applications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Health score history policies
DROP POLICY IF EXISTS "Allow public select health_score_history" ON health_score_history;
CREATE POLICY "Allow public select health_score_history" ON health_score_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert health_score_history" ON health_score_history;
CREATE POLICY "Allow public insert health_score_history" ON health_score_history
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update health_score_history" ON health_score_history;
CREATE POLICY "Allow public update health_score_history" ON health_score_history
  FOR UPDATE USING (true) WITH CHECK (true);

-- Rank history policies
DROP POLICY IF EXISTS "Allow public select rank_history" ON rank_history;
CREATE POLICY "Allow public select rank_history" ON rank_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert rank_history" ON rank_history;
CREATE POLICY "Allow public insert rank_history" ON rank_history
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update rank_history" ON rank_history;
CREATE POLICY "Allow public update rank_history" ON rank_history
  FOR UPDATE USING (true) WITH CHECK (true);

-- Seller metrics daily policies
DROP POLICY IF EXISTS "Allow public select seller_metrics_daily" ON seller_metrics_daily;
CREATE POLICY "Allow public select seller_metrics_daily" ON seller_metrics_daily
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert seller_metrics_daily" ON seller_metrics_daily;
CREATE POLICY "Allow public insert seller_metrics_daily" ON seller_metrics_daily
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update seller_metrics_daily" ON seller_metrics_daily;
CREATE POLICY "Allow public update seller_metrics_daily" ON seller_metrics_daily
  FOR UPDATE USING (true) WITH CHECK (true);

-- Function to update seller metrics daily
CREATE OR REPLACE FUNCTION update_seller_metrics_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO seller_metrics_daily (user_telegram_id, date, dashboard_visits, recommendations_applied, services_active)
  SELECT
    s.provider_telegram_id,
    CURRENT_DATE,
    COUNT(DISTINCT dv.id) as dashboard_visits,
    COUNT(DISTINCT ra.id) as recommendations_applied,
    COUNT(DISTINCT s.service_id) as services_active
  FROM services s
  LEFT JOIN dashboard_visits dv ON dv.user_telegram_id = s.provider_telegram_id AND dv.visit_date = CURRENT_DATE
  LEFT JOIN recommendation_applications ra ON ra.service_id = s.service_id AND DATE(ra.applied_at) = CURRENT_DATE
  WHERE s.status = 'active'
  GROUP BY s.provider_telegram_id
  ON CONFLICT (user_telegram_id, date) DO UPDATE
  SET
    dashboard_visits = EXCLUDED.dashboard_visits,
    recommendations_applied = EXCLUDED.recommendations_applied,
    services_active = EXCLUDED.services_active;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Bu fayl barcha kerakli jadvallarni yaratadi
-- 2. RLS policies public access uchun sozlangan (telegram_user_id asosida)
-- 3. Materialized view: tag_conversion_metrics - refresh qilish kerak (cron job orqali)
-- 4. Fingerprint column services jadvaliga qo'shildi (cold start abuse prevention)
-- 5. Barcha funksiyalar va triggerlar yaratildi
-- 6. Indexes performance uchun optimizatsiya qilindi

-- =====================================================
-- DASHBOARD ANALYTICS & METRICS TABLES
-- Tracks 6 key metrics for investor-ready analytics
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
  impact_metrics JSONB DEFAULT '{}' -- Store before/after metrics
);

CREATE INDEX IF NOT EXISTS idx_recommendation_applications_user ON recommendation_applications(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_service ON recommendation_applications(service_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_date ON recommendation_applications(applied_at DESC);

-- Health score history (daily snapshots)
CREATE TABLE IF NOT EXISTS health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL,
  factors JSONB NOT NULL, -- Store all factor scores
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
  rank_recovery_count INTEGER DEFAULT 0, -- How many times rank recovered after alert
  services_active INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_telegram_id, date)
);

CREATE INDEX IF NOT EXISTS idx_seller_metrics_daily_user_date ON seller_metrics_daily(user_telegram_id, date DESC);

-- RLS Policies
ALTER TABLE dashboard_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Allow public insert/select for all (using user_telegram_id)
CREATE POLICY "Allow public access to dashboard_visits" ON dashboard_visits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to recommendation_applications" ON recommendation_applications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to health_score_history" ON health_score_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to rank_history" ON rank_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to seller_metrics_daily" ON seller_metrics_daily
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FUNCTIONS FOR METRICS CALCULATION
-- =====================================================

-- Function to update seller metrics daily
CREATE OR REPLACE FUNCTION update_seller_metrics_daily()
RETURNS void AS $$
BEGIN
  -- Aggregate daily metrics for all sellers
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
-- 1. dashboard_visits: Tracks daily dashboard visits (for streak)
-- 2. recommendation_applications: Tracks applied recommendations (for conversion delta)
-- 3. health_score_history: Daily health score snapshots (for trend analysis)
-- 4. rank_history: Rank changes over time (for rank recovery tracking)
-- 5. seller_metrics_daily: Aggregated daily metrics (for 6 key metrics)
--
-- 6 Key Metrics:
-- 1. Dashboard weekly visits (from dashboard_visits)
-- 2. Recommendations applied % (from recommendation_applications)
-- 3. Health score avg ↑/↓ (from health_score_history)
-- 4. Rank recovery after alert (from rank_history)
-- 5. Seller churn (before/after dashboard) (calculated from seller_metrics_daily)
-- 6. Conversion delta after apply (from recommendation_applications impact_metrics)

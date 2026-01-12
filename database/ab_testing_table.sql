-- =====================================================
-- A/B TESTING TABLE
-- Tracks experiments and conversions for scientific growth
-- =====================================================

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT NOT NULL, -- e.g., 'ranking_formula_v1'
  experiment_type TEXT NOT NULL CHECK (experiment_type IN ('ranking_formula', 'ai_tag_variants', 'ui_variant')),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B', 'C')),
  user_telegram_id BIGINT,
  service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_experiments_experiment_id ON experiments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiments_type ON experiments(experiment_type);
CREATE INDEX IF NOT EXISTS idx_experiments_variant ON experiments(variant);
CREATE INDEX IF NOT EXISTS idx_experiments_user ON experiments(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_experiments_created ON experiments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiments_metadata ON experiments USING GIN(metadata);

-- RLS Policies
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to experiments" ON experiments;
CREATE POLICY "Allow public insert to experiments"
ON experiments FOR INSERT
USING (true);

DROP POLICY IF EXISTS "Allow public read access to experiments" ON experiments;
CREATE POLICY "Allow public read access to experiments"
ON experiments FOR SELECT
USING (true);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. experiment_id: Unique identifier for each experiment (e.g., 'ranking_formula_v1')
-- 2. experiment_type: Type of experiment (ranking, AI, UI)
-- 3. variant: A, B, or C (depending on experiment)
-- 4. metadata: Stores conversion status, query tags, etc.
-- 5. Consistent hashing ensures same user gets same variant
-- 6. Conversion is tracked via metadata.converted flag

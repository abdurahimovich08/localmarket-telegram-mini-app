-- =====================================================
-- TAG ANALYTICS TABLE
-- Tracks tag usage, popularity, and performance
-- =====================================================

-- Tag usage statistics table
CREATE TABLE IF NOT EXISTS tag_usage (
  tag_value TEXT PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT now(),
  search_count INTEGER DEFAULT 0, -- How many times this tag was used in searches
  match_count INTEGER DEFAULT 0,  -- How many times this tag matched in search results
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
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

-- Updated_at trigger
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

-- RLS Policies
ALTER TABLE tag_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to tag_usage" ON tag_usage;
CREATE POLICY "Allow public read access to tag_usage"
ON tag_usage FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow system to update tag_usage" ON tag_usage;
CREATE POLICY "Allow system to update tag_usage"
ON tag_usage FOR ALL
USING (true); -- Allow all for now (using functions, not direct access)

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This table tracks tag usage statistics
-- 2. Usage count: How many services use this tag
-- 3. Search count: How many times users searched for this tag
-- 4. Match count: How many times this tag matched in search results
-- 5. Functions are called from backend when services are created/updated
-- 6. Functions are called from search API when users search

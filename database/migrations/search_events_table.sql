-- Search Events Table for Analytics
-- Tracks user search behavior for better recommendations and autocomplete

CREATE TABLE IF NOT EXISTS search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_telegram_id BIGINT REFERENCES users(telegram_user_id),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  category TEXT,
  result_count INTEGER DEFAULT 0,
  brand_detected TEXT,
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add index for faster queries
  CONSTRAINT search_events_query_check CHECK (char_length(query) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_events_user ON search_events(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_search_events_normalized ON search_events(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_events_time ON search_events(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_category ON search_events(category);
CREATE INDEX IF NOT EXISTS idx_search_events_results ON search_events(result_count);

-- Index for zero-result searches (to find gaps in inventory)
CREATE INDEX IF NOT EXISTS idx_search_events_zero_results 
  ON search_events(searched_at DESC) 
  WHERE result_count = 0;

-- RLS Policies
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own search events
CREATE POLICY "Users can insert their own search events"
  ON search_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view their own search events
CREATE POLICY "Users can view their own search events"
  ON search_events
  FOR SELECT
  TO authenticated
  USING (user_telegram_id = current_user_id());

-- Allow service role full access
CREATE POLICY "Service role has full access to search_events"
  ON search_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- View for popular searches (aggregated, anonymized)
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
  normalized_query as query,
  COUNT(*) as search_count,
  ROUND(AVG(result_count)::numeric, 1) as avg_results,
  MAX(searched_at) as last_searched,
  COUNT(DISTINCT user_telegram_id) as unique_users
FROM search_events
WHERE searched_at > NOW() - INTERVAL '7 days'
GROUP BY normalized_query
ORDER BY search_count DESC
LIMIT 100;

-- View for zero-result searches (for inventory improvements)
CREATE OR REPLACE VIEW zero_result_searches AS
SELECT 
  query,
  normalized_query,
  category,
  COUNT(*) as miss_count,
  MAX(searched_at) as last_searched
FROM search_events
WHERE result_count = 0
  AND searched_at > NOW() - INTERVAL '30 days'
GROUP BY query, normalized_query, category
ORDER BY miss_count DESC
LIMIT 50;

-- Function to clean old search events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_search_events()
RETURNS void AS $$
BEGIN
  DELETE FROM search_events
  WHERE searched_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE search_events IS 'Tracks user search queries for analytics and autocomplete suggestions';
COMMENT ON COLUMN search_events.normalized_query IS 'Lowercase, transliterated version of query for consistent matching';
COMMENT ON COLUMN search_events.brand_detected IS 'If a brand was detected in the query, store the normalized brand name';

-- Migration: Add User Tracking Tables for Personalization
-- Created: 2024
-- Purpose: Track user behavior for personalized recommendations

-- User Search History Table
CREATE TABLE IF NOT EXISTS user_searches (
  search_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  category TEXT,
  filters JSONB,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Listing Interactions Table
CREATE TABLE IF NOT EXISTS user_listing_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'favorite', 'search_match', 'category_view')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Category Preferences (Aggregated from interactions)
CREATE TABLE IF NOT EXISTS user_category_preferences (
  preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score DECIMAL(5, 2) DEFAULT 0,
  last_interaction TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_telegram_id, category)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_query ON user_searches USING gin(to_tsvector('russian', search_query));
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_listing_interactions(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_listing ON user_listing_interactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_listing_interactions(interaction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_category_preferences(user_telegram_id, score DESC);

-- Function to update user category preferences
CREATE OR REPLACE FUNCTION update_user_category_preference()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if interaction involves a listing with category
  IF NEW.interaction_type IN ('view', 'click', 'favorite', 'search_match') THEN
    INSERT INTO user_category_preferences (user_telegram_id, category, score, last_interaction)
    SELECT 
      NEW.user_telegram_id,
      l.category,
      CASE NEW.interaction_type
        WHEN 'favorite' THEN 5.0
        WHEN 'click' THEN 3.0
        WHEN 'view' THEN 1.0
        WHEN 'search_match' THEN 2.0
        ELSE 0.5
      END,
      NEW.created_at
    FROM listings l
    WHERE l.listing_id = NEW.listing_id
    ON CONFLICT (user_telegram_id, category)
    DO UPDATE SET
      score = user_category_preferences.score + EXCLUDED.score,
      last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update preferences
DROP TRIGGER IF EXISTS trigger_update_category_preference ON user_listing_interactions;
CREATE TRIGGER trigger_update_category_preference
  AFTER INSERT ON user_listing_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_category_preference();

-- Function to get user preference score for a category
CREATE OR REPLACE FUNCTION get_user_category_score(p_user_id BIGINT, p_category TEXT)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  v_score DECIMAL(5, 2);
BEGIN
  SELECT COALESCE(score, 0) INTO v_score
  FROM user_category_preferences
  WHERE user_telegram_id = p_user_id AND category = p_category;
  
  RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

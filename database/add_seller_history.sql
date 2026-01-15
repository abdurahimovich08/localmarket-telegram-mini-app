-- =====================================================
-- SELLER HISTORY TABLE FOR TAXONOMY MEMORY
-- =====================================================
-- This table tracks seller's taxonomy selections to enable
-- "Seller Memory" feature - remembering what sellers previously listed
--
-- Purpose: Enable Netflix-level UX where app "remembers" user preferences

-- Create seller_history table
CREATE TABLE IF NOT EXISTS seller_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  taxonomy_leaf_id VARCHAR(100) NOT NULL,
  taxonomy_path_uz TEXT NOT NULL,
  audience VARCHAR(50),
  segment VARCHAR(50),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for fast user history queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_seller_history_user_recent 
ON seller_history(user_id, created_at DESC);

-- Index for taxonomy frequency queries (top categories per user)
CREATE INDEX IF NOT EXISTS idx_seller_history_user_taxonomy 
ON seller_history(user_id, taxonomy_leaf_id);

-- Index for listing lookup
CREATE INDEX IF NOT EXISTS idx_seller_history_listing 
ON seller_history(listing_id) 
WHERE listing_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE seller_history IS 
'Stores seller taxonomy selections to enable "Seller Memory" feature. Tracks what sellers previously listed to suggest same category on next listing.';

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Get last taxonomy for a user:
-- SELECT taxonomy_leaf_id, taxonomy_path_uz, created_at
-- FROM seller_history
-- WHERE user_id = '...'
-- ORDER BY created_at DESC
-- LIMIT 1;

-- Get top 3 most used taxonomies for a user:
-- SELECT taxonomy_leaf_id, taxonomy_path_uz, COUNT(*) as count
-- FROM seller_history
-- WHERE user_id = '...'
-- GROUP BY taxonomy_leaf_id, taxonomy_path_uz
-- ORDER BY count DESC
-- LIMIT 3;

-- Get all history for a user (last 30 days):
-- SELECT * FROM seller_history
-- WHERE user_id = '...'
-- AND created_at >= NOW() - INTERVAL '30 days'
-- ORDER BY created_at DESC;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- 1. Table tracks taxonomy selections per user
-- 2. Links to listings table (optional, for future analytics)
-- 3. Indexes optimized for:
--    - Recent history lookup (user_id + created_at DESC)
--    - Top categories (user_id + taxonomy_leaf_id)
--    - Listing lookup (listing_id)
-- 4. CASCADE delete on user deletion
-- 5. SET NULL on listing deletion (preserve history)

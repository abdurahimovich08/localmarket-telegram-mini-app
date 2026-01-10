-- Migration: Add Search Indexes for Advanced Search
-- Created: 2024
-- Purpose: Enable fuzzy search, full-text search, and typo tolerance

-- Enable PostgreSQL extensions for advanced search
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS unaccent; -- Remove accents for better matching

-- Full-text search index (for title and description)
-- Uses 'russian' config which works well for Uzbek/Latin/Russian text
CREATE INDEX IF NOT EXISTS idx_listings_search 
ON listings USING gin(
  to_tsvector('russian', 
    COALESCE(title, '') || ' ' || COALESCE(description, '')
  )
);

-- Trigram index for fuzzy matching (typo tolerance)
-- This allows finding "kmz" when searching for "kamaz"
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm 
ON listings USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_description_trgm 
ON listings USING gin(description gin_trgm_ops);

-- Combined trigram index for both fields
CREATE INDEX IF NOT EXISTS idx_listings_text_trgm 
ON listings USING gin(
  (COALESCE(title, '') || ' ' || COALESCE(description, '')) gin_trgm_ops
);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_category_status 
ON listings(category, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_price_active 
ON listings(price) 
WHERE status = 'active' AND price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_boosted_created 
ON listings(is_boosted, created_at DESC) 
WHERE status = 'active';

-- Note: We cannot use NOW() in index predicate (not IMMUTABLE)
-- Recent listings filtering will be done at query time in application code
-- This index is still useful for sorting recent listings
CREATE INDEX IF NOT EXISTS idx_listings_recent_created 
ON listings(created_at DESC) 
WHERE status = 'active';

-- Function to search listings with fuzzy matching
CREATE OR REPLACE FUNCTION search_listings_fuzzy(
  p_query TEXT,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_boosted_only BOOLEAN DEFAULT FALSE,
  p_recent_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  category TEXT,
  condition TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.listing_id,
    l.title,
    l.description,
    l.price,
    l.category,
    l.condition,
    GREATEST(
      similarity(l.title, p_query),
      similarity(l.description, p_query)
    ) as similarity
  FROM listings l
  WHERE l.status = 'active'
    AND (
      l.title % p_query OR -- Trigram similarity (fuzzy match)
      l.description % p_query OR
      l.title ILIKE '%' || p_query || '%' OR -- Simple ILIKE match
      l.description ILIKE '%' || p_query || '%'
    )
    AND (p_category IS NULL OR l.category = p_category)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_condition IS NULL OR l.condition = p_condition)
    AND (NOT p_boosted_only OR l.is_boosted = TRUE)
    AND (NOT p_recent_only OR l.created_at > NOW() - INTERVAL '7 days')
  ORDER BY 
    similarity DESC,
    l.is_boosted DESC,
    l.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Set similarity threshold (lower = more matches, default is 0.3)
-- You can adjust this based on your needs
-- SET pg_trgm.similarity_threshold = 0.3;

-- Instructions:
-- After running this migration:
-- 1. Test the fuzzy search with: SELECT * FROM search_listings_fuzzy('kmz');
-- 2. Adjust similarity_threshold if needed
-- 3. Monitor query performance and adjust indexes as needed

-- =====================================================
-- ADD ATTRIBUTES JSONB COLUMN TO LISTINGS TABLE
-- =====================================================
-- This migration adds a JSONB column to store category-specific attributes
-- while keeping core searchable/sortable fields as columns

-- Add attributes column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_listings_attributes_gin 
ON listings USING GIN (attributes);

-- Create index for common attribute queries (e.g., brand, size)
CREATE INDEX IF NOT EXISTS idx_listings_attributes_brand 
ON listings ((attributes->>'brand')) 
WHERE attributes->>'brand' IS NOT NULL;

-- Create index for numeric attributes (e.g., year, mileage)
CREATE INDEX IF NOT EXISTS idx_listings_attributes_year 
ON listings (((attributes->>'year')::integer)) 
WHERE attributes->>'year' IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN listings.attributes IS 
'Category-specific attributes stored as JSONB. Core fields (price, condition, etc.) remain as columns for indexing and querying.';

-- =====================================================
-- EXAMPLE QUERIES FOR ATTRIBUTES
-- =====================================================

-- Query by attribute (e.g., find cars by brand):
-- SELECT * FROM listings 
-- WHERE category = 'automotive' 
-- AND attributes->>'brand' = 'Toyota';

-- Query by numeric attribute (e.g., find cars by year):
-- SELECT * FROM listings 
-- WHERE category = 'automotive' 
-- AND (attributes->>'year')::integer >= 2020;

-- Query by array attribute (e.g., find clothing by size):
-- SELECT * FROM listings 
-- WHERE category = 'clothing' 
-- AND attributes->'sizes' @> '"M"';

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- 1. Existing listings will have empty JSONB object: {}
-- 2. New listings can store category-specific data in attributes
-- 3. Core fields (price, condition, etc.) remain as columns
-- 4. GIN index enables fast JSONB queries
-- 5. No breaking changes to existing queries

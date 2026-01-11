-- Update services table to support logo_url and portfolio_images
-- Run this in Supabase SQL Editor

-- Add logo_url column (for square/circular logo)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add portfolio_images column (array of image URLs, max 4)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT '{}';

-- Update existing services: move image_url to logo_url if image_url exists
UPDATE services 
SET logo_url = image_url 
WHERE logo_url IS NULL AND image_url IS NOT NULL;

-- Add check constraint to limit portfolio_images to 4 items
ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_portfolio_images_limit;

ALTER TABLE services
ADD CONSTRAINT services_portfolio_images_limit 
CHECK (array_length(portfolio_images, 1) <= 4);

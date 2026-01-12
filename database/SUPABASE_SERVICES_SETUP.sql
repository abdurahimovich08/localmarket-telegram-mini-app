-- =====================================================
-- SUPABASE SERVICES TABLE SETUP
-- Bu fayl services jadvalini yaratadi va sozlaydi
-- Supabase SQL Editor'da ishga tushiring
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SERVICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS services (
  service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 500),
  category TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  price TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  logo_url TEXT,
  portfolio_images TEXT[] DEFAULT '{}',
  image_url TEXT, -- Backward compatibility (deprecated, use logo_url)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_telegram_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_fingerprint ON services(fingerprint);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Limit portfolio_images to maximum 4 items
ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_portfolio_images_limit;

ALTER TABLE services
ADD CONSTRAINT services_portfolio_images_limit 
CHECK (array_length(portfolio_images, 1) IS NULL OR array_length(portfolio_images, 1) <= 4);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-runs)
DROP POLICY IF EXISTS "Allow public read access to active services" ON services;
DROP POLICY IF EXISTS "Allow users to insert their own services" ON services;
DROP POLICY IF EXISTS "Allow users to update their own services" ON services;
DROP POLICY IF EXISTS "Allow users to delete their own services" ON services;

-- Policy: Allow public read access to active services
CREATE POLICY "Allow public read access to active services"
ON services FOR SELECT
USING (status = 'active');

-- Policy: Allow users to insert their own services
CREATE POLICY "Allow users to insert their own services"
ON services FOR INSERT
WITH CHECK (true); -- Allow all (using telegram_user_id, not auth.uid)

-- Policy: Allow users to update their own services
CREATE POLICY "Allow users to update their own services"
ON services FOR UPDATE
USING (true); -- Allow all (using telegram_user_id, not auth.uid)

-- Policy: Allow users to delete their own services
CREATE POLICY "Allow users to delete their own services"
ON services FOR DELETE
USING (true); -- Allow all (using telegram_user_id, not auth.uid)

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_services_updated_at ON services;

-- Create trigger
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Bu fayl services jadvalini to'liq yaratadi
-- 2. users jadvali allaqachon mavjud bo'lishi kerak (FOREIGN KEY)
-- 3. RLS policy'lar hozircha barcha foydalanuvchilar uchun ochiq
-- 4. Kelajakda auth.uid() yoki telegram_user_id tekshiruvi qo'shilishi mumkin
-- 5. image_url column backward compatibility uchun qoldirilgan (logo_url ishlatiladi)

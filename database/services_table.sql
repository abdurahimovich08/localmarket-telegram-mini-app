-- Services Table for AI Service Creator Feature
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS services (
  service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 500),
  category TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  price TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_telegram_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);

-- RLS Policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active services
CREATE POLICY "Allow public read access to active services" ON services
  FOR SELECT
  USING (status = 'active');

-- Allow users to insert their own services
CREATE POLICY "Allow users to insert their own services" ON services
  FOR INSERT
  WITH CHECK (auth.uid()::text = provider_telegram_id::text OR true); -- Allow all for now (using telegram_user_id, not auth.uid)

-- Allow users to update their own services
CREATE POLICY "Allow users to update their own services" ON services
  FOR UPDATE
  USING (auth.uid()::text = provider_telegram_id::text OR true); -- Allow all for now

-- Allow users to delete their own services
CREATE POLICY "Allow users to delete their own services" ON services
  FOR DELETE
  USING (auth.uid()::text = provider_telegram_id::text OR true); -- Allow all for now

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

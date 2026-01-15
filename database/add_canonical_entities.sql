-- =====================================================
-- CANONICAL ENTITIES TABLES
-- =====================================================
-- Stores platform-known entities (brands, countries, etc.)
-- for 3-layer data normalization architecture
--
-- Purpose: Enable search, filter, and recommendation
-- regardless of user input language/typos

-- =====================================================
-- BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(50) PRIMARY KEY,  -- "brand_000123"
  display_uz VARCHAR(100) NOT NULL,
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[] NOT NULL DEFAULT '{}',  -- ["nike", "найк", "nayk", "niike"]
  category VARCHAR(50),  -- "clothing", "electronics", "automotive"
  subcategory VARCHAR(50),  -- "sportswear", "smartphones", "sedan"
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for fast alias lookup
CREATE INDEX IF NOT EXISTS idx_brands_aliases 
ON brands USING GIN(aliases);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_brands_category 
ON brands(category) 
WHERE is_active = true;

-- Index for search
CREATE INDEX IF NOT EXISTS idx_brands_display_uz 
ON brands(display_uz) 
WHERE is_active = true;

-- =====================================================
-- COUNTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS countries (
  id VARCHAR(50) PRIMARY KEY,  -- "country_001"
  display_uz VARCHAR(100) NOT NULL,
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[] NOT NULL DEFAULT '{}',  -- ["russia", "россия", "rossiya"]
  code VARCHAR(3),  -- ISO code: "RU", "UZ", "CN"
  region VARCHAR(50),  -- "europe", "asia", "america"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for fast alias lookup
CREATE INDEX IF NOT EXISTS idx_countries_aliases 
ON countries USING GIN(aliases);

-- Index for code lookup
CREATE INDEX IF NOT EXISTS idx_countries_code 
ON countries(code) 
WHERE is_active = true;

-- =====================================================
-- CAR BRANDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS car_brands (
  id VARCHAR(50) PRIMARY KEY,  -- "car_brand_001"
  display_uz VARCHAR(100) NOT NULL,
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[] NOT NULL DEFAULT '{}',
  country_id VARCHAR(50) REFERENCES countries(id),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_car_brands_aliases 
ON car_brands USING GIN(aliases);

-- =====================================================
-- CAR MODELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS car_models (
  id VARCHAR(50) PRIMARY KEY,  -- "car_model_001"
  brand_id VARCHAR(50) NOT NULL REFERENCES car_brands(id),
  display_uz VARCHAR(100) NOT NULL,
  display_ru VARCHAR(100),
  display_en VARCHAR(100),
  aliases TEXT[] NOT NULL DEFAULT '{}',
  year_from INTEGER,
  year_to INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_car_models_aliases 
ON car_models USING GIN(aliases);

CREATE INDEX IF NOT EXISTS idx_car_models_brand 
ON car_models(brand_id) 
WHERE is_active = true;

-- =====================================================
-- INITIAL DATA (Common Brands)
-- =====================================================

-- Clothing Brands
INSERT INTO brands (id, display_uz, display_ru, display_en, aliases, category) VALUES
('brand_001', 'Nike', 'Найк', 'Nike', ARRAY['nike', 'найк', 'nayk', 'niike', 'naik'], 'clothing'),
('brand_002', 'Adidas', 'Адидас', 'Adidas', ARRAY['adidas', 'адидас', 'adidas', 'адидас'], 'clothing'),
('brand_003', 'Puma', 'Пума', 'Puma', ARRAY['puma', 'пума', 'puma'], 'clothing'),
('brand_004', 'Reebok', 'Рибок', 'Reebok', ARRAY['reebok', 'рибок', 'reebok'], 'clothing'),
('brand_005', 'Zara', 'Зара', 'Zara', ARRAY['zara', 'зара', 'zara'], 'clothing'),
('brand_006', 'H&M', 'Х&М', 'H&M', ARRAY['hm', 'h&m', 'х&м', 'h and m'], 'clothing')
ON CONFLICT (id) DO NOTHING;

-- Electronics Brands
INSERT INTO brands (id, display_uz, display_ru, display_en, aliases, category) VALUES
('brand_101', 'Samsung', 'Самсунг', 'Samsung', ARRAY['samsung', 'самсунг', 'samsung'], 'electronics'),
('brand_102', 'Apple', 'Эпл', 'Apple', ARRAY['apple', 'эпл', 'apple', 'iphone'], 'electronics'),
('brand_103', 'Xiaomi', 'Сяоми', 'Xiaomi', ARRAY['xiaomi', 'сяоми', 'xiaomi', 'redmi'], 'electronics'),
('brand_104', 'Huawei', 'Хуавей', 'Huawei', ARRAY['huawei', 'хуавей', 'huawei', 'honor'], 'electronics')
ON CONFLICT (id) DO NOTHING;

-- Car Brands
INSERT INTO car_brands (id, display_uz, display_ru, display_en, aliases, country_id) VALUES
('car_brand_001', 'Toyota', 'Тойота', 'Toyota', ARRAY['toyota', 'тойота', 'toyota'], NULL),
('car_brand_002', 'Honda', 'Хонда', 'Honda', ARRAY['honda', 'хонда', 'honda'], NULL),
('car_brand_003', 'Nissan', 'Ниссан', 'Nissan', ARRAY['nissan', 'ниссан', 'nissan'], NULL),
('car_brand_004', 'Hyundai', 'Хёндэ', 'Hyundai', ARRAY['hyundai', 'хёндэ', 'hyundai'], NULL),
('car_brand_005', 'Kia', 'Киа', 'Kia', ARRAY['kia', 'киа', 'kia'], NULL)
ON CONFLICT (id) DO NOTHING;

-- Countries
INSERT INTO countries (id, display_uz, display_ru, display_en, aliases, code, region) VALUES
('country_001', 'O''zbekiston', 'Узбекистан', 'Uzbekistan', ARRAY['uzbekistan', 'узбекистан', 'ozbekiston', 'uz'], 'UZ', 'asia'),
('country_002', 'Rossiya', 'Россия', 'Russia', ARRAY['russia', 'россия', 'rossiya', 'ru'], 'RU', 'europe'),
('country_003', 'Xitoy', 'Китай', 'China', ARRAY['china', 'китай', 'xitoy', 'cn'], 'CN', 'asia'),
('country_004', 'Turkiya', 'Турция', 'Turkey', ARRAY['turkey', 'турция', 'turkiya', 'tr'], 'TR', 'europe'),
('country_005', 'Koreya', 'Корея', 'Korea', ARRAY['korea', 'корея', 'koreya', 'kr'], 'KR', 'asia'),
('country_006', 'Amerika', 'Америка', 'USA', ARRAY['usa', 'америка', 'amerika', 'america', 'us'], 'US', 'america')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_brands_updated_at
  BEFORE UPDATE ON car_brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_models_updated_at
  BEFORE UPDATE ON car_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE brands IS 'Canonical brand entities for normalization. Used in 3-layer data architecture (RAW, NORMALIZED, CANONICAL).';
COMMENT ON TABLE countries IS 'Canonical country entities for normalization.';
COMMENT ON TABLE car_brands IS 'Canonical car brand entities.';
COMMENT ON TABLE car_models IS 'Canonical car model entities.';

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Find brand by alias:
-- SELECT * FROM brands 
-- WHERE 'nike' = ANY(aliases) 
-- AND is_active = true;

-- Find country by alias:
-- SELECT * FROM countries 
-- WHERE 'россия' = ANY(aliases) 
-- AND is_active = true;

-- Search brands by category:
-- SELECT * FROM brands 
-- WHERE category = 'clothing' 
-- AND is_active = true
-- ORDER BY display_uz;

-- ============================================
-- OLX.uz STYLE COMPREHENSIVE CATEGORY STRUCTURE
-- ============================================
-- 
-- WHAT: Complete category and subcategory tree matching OLX.uz granularity
-- WHY: Enables precise recommendations (e.g., "Kamaz" → "Yuk mashinalari" subcategory)
-- WHEN: Run once after core schema is created
--
-- REQUIRED IN SUPABASE: YES
-- ============================================

-- ============================================
-- STEP 1: ENSURE SUBCATEGORIES TABLE EXISTS
-- ============================================

-- Subcategories table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_category TEXT NOT NULL CHECK (parent_category IN ('electronics', 'furniture', 'clothing', 'baby_kids', 'home_garden', 'games_hobbies', 'books_media', 'sports_outdoors', 'other')),
  name TEXT NOT NULL,
  name_uz TEXT NOT NULL, -- Uzbek name
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_uz TEXT,
  parent_subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_category, slug)
);

-- Add columns if they don't exist (for backward compatibility)
DO $$ 
BEGIN
  -- Add name_uz if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subcategories' 
    AND column_name = 'name_uz'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN name_uz TEXT;
    -- Copy name to name_uz for existing rows
    UPDATE subcategories SET name_uz = name WHERE name_uz IS NULL;
  END IF;
  
  -- Add description_uz if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subcategories' 
    AND column_name = 'description_uz'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN description_uz TEXT;
  END IF;
  
  -- Add display_order if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subcategories' 
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- STEP 2: TRANSPORT (TRANSPORT) - CRITICAL FOR KAMAZ
-- ============================================

-- Main category: Transport (we'll use 'sports_outdoors' or create 'transport' category
-- For now, using 'sports_outdoors' as transport category
-- In production, you might want to add 'transport' to the category enum

-- Yengil mashinalar (Cars)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Yengil mashinalar', 'Yengil mashinalar', 'yengil-mashinalar', 'Barcha turdagi yengil mashinalar', 1)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Yuk mashinalari (Heavy Trucks) - CRITICAL FOR KAMAZ
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Yuk mashinalari', 'Yuk mashinalari', 'yuk-mashinalari', 'Kamaz, Man, Scania va boshqa yuk mashinalari', 2)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Maxsus texnika (Special Equipment)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Maxsus texnika', 'Maxsus texnika', 'maxsus-texnika', 'Ekskavator, buldozer, kran va boshqa maxsus texnika', 3)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Ehtiyot qismlar (Auto Parts)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Ehtiyot qismlar', 'Ehtiyot qismlar', 'ehtiyot-qismlar', 'Mashina ehtiyot qismlari va aksessuarlar', 4)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Mototsikllar (Motorcycles)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Mototsikllar', 'Mototsikllar', 'mototsikllar', 'Mototsikllar va skuterlar', 5)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Velosipedlar (Bicycles)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Velosipedlar', 'Velosipedlar', 'velosipedlar', 'Velosipedlar va boshqa ikki gildirakli transport', 6)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Nested subcategories for Yuk mashinalari (Heavy Trucks)
-- Kamaz
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'Kamaz',
  'Kamaz',
  'kamaz',
  'Kamaz yuk mashinalari',
  1,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Man
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'Man',
  'Man',
  'man',
  'Man yuk mashinalari',
  2,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Scania
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'Scania',
  'Scania',
  'scania',
  'Scania yuk mashinalari',
  3,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Nested subcategories for Yengil mashinalar (Cars)
-- Nexia
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'Nexia',
  'Nexia',
  'nexia',
  'Nexia yengil mashinalari',
  1,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Gazel
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'Gazel',
  'Gazel',
  'gazel',
  'Gazel yengil mashinalari',
  2,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- BMW
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'BMW',
  'BMW',
  'bmw',
  'BMW yengil mashinalari',
  3,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Mercedes
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'sports_outdoors',
  'Mercedes',
  'Mercedes',
  'mercedes',
  'Mercedes yengil mashinalari',
  4,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 3: KO'CHMAS MULK (REAL ESTATE)
-- ============================================

-- Using 'home_garden' as parent category for real estate
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Kvartiralar', 'Kvartiralar', 'kvartiralar', 'Bir xonali, ikki xonali, uch xonali kvartiralar', 1),
('home_garden', 'Hovli uylar', 'Hovli uylar', 'hovli-uylar', 'Hovli uylar va qo\'shni uylar', 2),
('home_garden', 'Yer uchastkalari', 'Yer uchastkalari', 'yer-uchastkalari', 'Yer uchastkalari va qurilish uchun yerlar', 3),
('home_garden', 'Ofislar', 'Ofislar', 'ofislar', 'Ofis binolari va biznes binolari', 4),
('home_garden', 'Magazinlar', 'Magazinlar', 'magazinlar', 'Savdo maydonlari va magazinlar', 5),
('home_garden', 'Ijaraga', 'Ijaraga', 'ijaraga', 'Ijaraga beriladigan ko\'chmas mulk', 6)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 4: ELEKTRONIKA (ELECTRONICS)
-- ============================================

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('electronics', 'Telefonlar', 'Telefonlar', 'telefonlar', 'Smartfonlar va mobil telefonlar', 1),
('electronics', 'Noutbuklar', 'Noutbuklar', 'noutbuklar', 'Portativ kompyuterlar', 2),
('electronics', 'Kompyuterlar', 'Kompyuterlar', 'kompyuterlar', 'Stol kompyuterlari va monobloklar', 3),
('electronics', 'Planshetlar', 'Planshetlar', 'planshetlar', 'Planshetlar va e-readerlar', 4),
('electronics', 'Televizorlar', 'Televizorlar', 'televizorlar', 'TV va monitorlar', 5),
('electronics', 'Maishiy texnika', 'Maishiy texnika', 'maishiy-texnika', 'Muzlatgich, kir yuvish mashinasi va boshqalar', 6),
('electronics', 'Audio va video', 'Audio va video', 'audio-video', 'Kolonkalar, naushniklar, kameralar', 7),
('electronics', 'O\'yin konsollari', 'O\'yin konsollari', 'oyin-konsollari', 'PlayStation, Xbox va boshqalar', 8)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Nested subcategories for Telefonlar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'electronics',
  'iPhone',
  'iPhone',
  'iphone',
  'Apple iPhone telefonlar',
  1,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'electronics',
  'Samsung',
  'Samsung',
  'samsung',
  'Samsung telefonlar',
  2,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 5: ISH (JOBS)
-- ============================================

-- Using 'other' as parent category for jobs
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('other', 'Vakansiyalar', 'Vakansiyalar', 'vakansiyalar', 'Ish o\'rinlari va vakansiyalar', 1),
('other', 'Xizmatlar', 'Xizmatlar', 'xizmatlar', 'Turli xil xizmatlar', 2)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 6: UY VA BOG' (HOME & GARDEN)
-- ============================================

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Mebel', 'Mebel', 'mebel', 'Divanlar, stollar, stullar', 1),
('home_garden', 'Qurilish mollari', 'Qurilish mollari', 'qurilish-mollari', 'Cement, g\'isht, plitka va boshqalar', 2),
('home_garden', 'Bog\' anjomlari', 'Bog\' anjomlari', 'bog-anjomlari', 'Bog\' va hovli uchun asboblar', 3),
('home_garden', 'Uy bezaklari', 'Uy bezaklari', 'uy-bezaklari', 'Interyer bezaklari', 4),
('home_garden', 'Oshxona jihozlari', 'Oshxona jihozlari', 'oshxona-jihozlari', 'Oshxona uchun kerakli jihozlar', 5)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- Nested subcategories for Mebel
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'home_garden',
  'Divanlar',
  'Divanlar',
  'divanlar',
  'Divanlar va kreslolar',
  1,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 
  'home_garden',
  'Stollar',
  'Stollar',
  'stollar',
  'Har xil turdagi stollar',
  2,
  subcategory_id
FROM subcategories 
WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 7: KIYIM-KECHAK (CLOTHING)
-- ============================================

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('clothing', 'Erkaklar kiyimi', 'Erkaklar kiyimi', 'erkaklar-kiyimi', 'Erkaklar uchun kiyim-kechaklar', 1),
('clothing', 'Ayollar kiyimi', 'Ayollar kiyimi', 'ayollar-kiyimi', 'Ayollar uchun kiyim-kechaklar', 2),
('clothing', 'Bolalar kiyimi', 'Bolalar kiyimi', 'bolalar-kiyimi', 'Bolalar uchun kiyim-kechaklar', 3),
('clothing', 'Oyoq kiyim', 'Oyoq kiyim', 'oyoq-kiyim', 'Etik, tufli, krossovkalar', 4),
('clothing', 'Aksessuarlar', 'Aksessuarlar', 'aksessuarlar', 'Sumkalar, soatlar, aksessuarlar', 5)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 8: SPORT VA HOBBY
-- ============================================

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Fitness', 'Fitness', 'fitness', 'Fitness va sport zali uchun uskunalar', 7),
('sports_outdoors', 'Turizm', 'Turizm', 'turizm', 'Sayohat va turizm uchun anjomlar', 8),
('sports_outdoors', 'O\'yinchoqlar', 'O\'yinchoqlar', 'oyinchoqlar', 'Bolalar o\'yinchoqlari', 9)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 9: HAYVONLAR (ANIMALS)
-- ============================================

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('other', 'Hayvonlar', 'Hayvonlar', 'hayvonlar', 'Uy hayvonlari va ularning aksessuarlari', 3)
ON CONFLICT (parent_category, slug) DO UPDATE SET 
  name_uz = EXCLUDED.name_uz,
  description_uz = EXCLUDED.description_uz,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 10: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subcategories_parent_category ON subcategories(parent_category);
CREATE INDEX IF NOT EXISTS idx_subcategories_parent_subcategory ON subcategories(parent_subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(parent_category, display_order);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check total subcategories
SELECT 
  parent_category,
  COUNT(*) as subcategory_count
FROM subcategories
GROUP BY parent_category
ORDER BY parent_category;

-- Check nested subcategories (Kamaz should be under Yuk mashinalari)
SELECT 
  s1.name_uz as parent_subcategory,
  s2.name_uz as nested_subcategory
FROM subcategories s1
JOIN subcategories s2 ON s2.parent_subcategory_id = s1.subcategory_id
WHERE s1.slug = 'yuk-mashinalari'
ORDER BY s2.display_order;

-- ============================================
-- YAKUN
-- ============================================
-- Barcha kategoriyalar va subkategoriyalar yaratildi!
-- Endi recommendation algoritmi subkategoriyalarni prioritizatsiya qiladi.

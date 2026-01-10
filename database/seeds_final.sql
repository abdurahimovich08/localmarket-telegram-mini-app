-- ============================================
-- LOCALMARKET TELEGRAM MINI APP
-- DATABASE SEEDS (DATA ONLY)
-- ============================================
-- 
-- WHAT: Data insertion - OLX.uz style categories and subcategories
-- WHY: Clean separation of data from schema
-- WHEN: Run AFTER schema_final.sql in Supabase SQL Editor
--
-- REQUIRED IN SUPABASE: YES - Run this AFTER schema_final.sql
-- ============================================

-- ============================================
-- OLX.uz STYLE CATEGORIES & SUBCATEGORIES
-- ============================================

-- ============================================
-- TRANSPORT KATEGORIYASI (sports_outdoors)
-- ============================================
-- Transport: Asosiy subkategoriyalar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Yengil mashinalar', 'Yengil mashinalar', 'yengil-mashinalar', 'Barcha turdagi yengil mashinalar', 1),
('sports_outdoors', 'Avto zapchastlar va aksessuarlar', 'Avto zapchastlar va aksessuarlar', 'avto-zapchastlar-aksessuarlar', 'Mashina ehtiyot qismlari, aksessuarlar va qo''shimcha jihozlar', 2),
('sports_outdoors', 'Moto', 'Moto', 'moto', 'Mototsikllar, skuterlar va boshqa ikki gildirakli transport', 3),
('sports_outdoors', 'Yuk mashinalari', 'Yuk mashinalari', 'yuk-mashinalari', 'Kamaz, Man, Scania va boshqa yuk mashinalari', 4),
('sports_outdoors', 'Maxsus texnika', 'Maxsus texnika', 'maxsus-texnika', 'Ekskavator, buldozer, kran va boshqa maxsus texnika', 5),
('sports_outdoors', 'Velosipedlar', 'Velosipedlar', 'velosipedlar', 'Velosipedlar va boshqa ikki gildirakli transport', 6)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- Nested: Kamaz, Man, Scania under Yuk mashinalari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Kamaz', 'Kamaz', 'kamaz', 'Kamaz yuk mashinalari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Man', 'Man', 'man', 'Man yuk mashinalari', 2, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Scania', 'Scania', 'scania', 'Scania yuk mashinalari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yuk-mashinalari'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Nested: Yengil mashinalar brendlari (OLX.uz kabi)
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Nexia', 'Nexia', 'nexia', 'Nexia yengil mashinalari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Gazel', 'Gazel', 'gazel', 'Gazel yengil mashinalari', 2, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'BMW', 'BMW', 'bmw', 'BMW yengil mashinalari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Mercedes', 'Mercedes', 'mercedes', 'Mercedes yengil mashinalari', 4, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Toyota', 'Toyota', 'toyota', 'Toyota yengil mashinalari', 5, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Honda', 'Honda', 'honda', 'Honda yengil mashinalari', 6, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Audi', 'Audi', 'audi', 'Audi yengil mashinalari', 7, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Volkswagen', 'Volkswagen', 'volkswagen', 'Volkswagen yengil mashinalari', 8, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Chevrolet', 'Chevrolet', 'chevrolet', 'Chevrolet yengil mashinalari', 9, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Ford', 'Ford', 'ford', 'Ford yengil mashinalari', 10, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Hyundai', 'Hyundai', 'hyundai', 'Hyundai yengil mashinalari', 11, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Kia', 'Kia', 'kia', 'Kia yengil mashinalari', 12, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Lada', 'Lada', 'lada', 'Lada yengil mashinalari', 13, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Boshqa brendlar', 'Boshqa brendlar', 'boshqa-brendlar', 'Boshqa yengil mashina brendlari', 14, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Nested: Avto zapchastlar va aksessuarlar turlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Ehtiyot qismlar', 'Ehtiyot qismlar', 'ehtiyot-qismlar', 'Mashina ehtiyot qismlari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Aksessuarlar', 'Aksessuarlar', 'avto-aksessuarlar', 'Mashina aksessuarlari va qo''shimcha jihozlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Shinalar va g''ildiraklar', 'Shinalar va g''ildiraklar', 'shinalar-gildiraklar', 'Shinalar, g''ildiraklar va disklar', 3, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Audio va video', 'Audio va video', 'avto-audio-video', 'Mashina uchun audio va video tizimlar', 4, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Nested: Moto turlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Mototsikllar', 'Mototsikllar', 'mototsikllar', 'Mototsikllar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'moto'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Skuterlar', 'Skuterlar', 'skuterlar', 'Skuterlar va mopedlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'moto'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'sports_outdoors', 'Moto ehtiyot qismlari', 'Moto ehtiyot qismlari', 'moto-ehtiyot-qismlari', 'Mototsikl ehtiyot qismlari va aksessuarlari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'sports_outdoors' AND slug = 'moto'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Ko'chmas mulk
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Kvartiralar', 'Kvartiralar', 'kvartiralar', 'Bir xonali, ikki xonali, uch xonali kvartiralar', 1),
('home_garden', 'Hovli uylar', 'Hovli uylar', 'hovli-uylar', 'Hovli uylar va qo''shni uylar', 2),
('home_garden', 'Yer uchastkalari', 'Yer uchastkalari', 'yer-uchastkalari', 'Yer uchastkalari va qurilish uchun yerlar', 3),
('home_garden', 'Ofislar', 'Ofislar', 'ofislar', 'Ofis binolari va biznes binolari', 4),
('home_garden', 'Magazinlar', 'Magazinlar', 'magazinlar', 'Savdo maydonlari va magazinlar', 5),
('home_garden', 'Ijaraga', 'Ijaraga', 'ijaraga', 'Ijaraga beriladigan ko''chmas mulk', 6)
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Elektronika
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('electronics', 'Telefonlar', 'Telefonlar', 'telefonlar', 'Smartfonlar va mobil telefonlar', 1),
('electronics', 'Noutbuklar', 'Noutbuklar', 'noutbuklar', 'Portativ kompyuterlar', 2),
('electronics', 'Kompyuterlar', 'Kompyuterlar', 'kompyuterlar', 'Stol kompyuterlari va monobloklar', 3),
('electronics', 'Planshetlar', 'Planshetlar', 'planshetlar', 'Planshetlar va e-readerlar', 4),
('electronics', 'Televizorlar', 'Televizorlar', 'televizorlar', 'TV va monitorlar', 5),
('electronics', 'Maishiy texnika', 'Maishiy texnika', 'maishiy-texnika', 'Muzlatgich, kir yuvish mashinasi va boshqalar', 6),
('electronics', 'Audio va video', 'Audio va video', 'audio-video', 'Kolonkalar, naushniklar, kameralar', 7),
('electronics', 'O''yin konsollari', 'O''yin konsollari', 'oyin-konsollari', 'PlayStation, Xbox va boshqalar', 8)
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Nested: iPhone, Samsung under Telefonlar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'electronics', 'iPhone', 'iPhone', 'iphone', 'Apple iPhone telefonlar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'electronics', 'Samsung', 'Samsung', 'samsung', 'Samsung telefonlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Kiyim-kechak
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('clothing', 'Erkaklar kiyimi', 'Erkaklar kiyimi', 'erkaklar-kiyimi', 'Erkaklar uchun kiyim-kechaklar', 1),
('clothing', 'Ayollar kiyimi', 'Ayollar kiyimi', 'ayollar-kiyimi', 'Ayollar uchun kiyim-kechaklar', 2),
('clothing', 'Bolalar kiyimi', 'Bolalar kiyimi', 'bolalar-kiyimi', 'Bolalar uchun kiyim-kechaklar', 3),
('clothing', 'Oyoq kiyim', 'Oyoq kiyim', 'oyoq-kiyim', 'Etik, tufli, krossovkalar', 4),
('clothing', 'Aksessuarlar', 'Aksessuarlar', 'aksessuarlar', 'Sumkalar, soatlar, aksessuarlar', 5)
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Uy va Bog'
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Mebel', 'Mebel', 'mebel', 'Divanlar, stollar, stullar', 1),
('home_garden', 'Qurilish mollari', 'Qurilish mollari', 'qurilish-mollari', 'Cement, g''isht, plitka va boshqalar', 2),
('home_garden', 'Bog'' anjomlari', 'Bog'' anjomlari', 'bog-anjomlari', 'Bog'' va hovli uchun asboblar', 3),
('home_garden', 'Uy bezaklari', 'Uy bezaklari', 'uy-bezaklari', 'Interyer bezaklari', 4),
('home_garden', 'Oshxona jihozlari', 'Oshxona jihozlari', 'oshxona-jihozlari', 'Oshxona uchun kerakli jihozlar', 5)
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- Nested: Divanlar, Stollar under Mebel
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'home_garden', 'Divanlar', 'Divanlar', 'divanlar', 'Divanlar va kreslolar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'home_garden', 'Stollar', 'Stollar', 'stollar', 'Har xil turdagi stollar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Sport va Boshqalar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Fitness', 'Fitness', 'fitness', 'Fitness va sport zali uchun uskunalar', 7),
('sports_outdoors', 'Turizm', 'Turizm', 'turizm', 'Sayohat va turizm uchun anjomlar', 8),
('sports_outdoors', 'O''yinchoqlar', 'O''yinchoqlar', 'oyinchoqlar', 'Bolalar o''yinchoqlari', 9),
('other', 'Vakansiyalar', 'Vakansiyalar', 'vakansiyalar', 'Ish o''rinlari va vakansiyalar', 1),
('other', 'Xizmatlar', 'Xizmatlar', 'xizmatlar', 'Turli xil xizmatlar', 2),
('other', 'Hayvonlar', 'Hayvonlar', 'hayvonlar', 'Uy hayvonlari va ularning aksessuarlari', 3)
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- ============================================
-- YAKUN (COMPLETE)
-- ============================================
-- All categories and subcategories have been seeded!
-- Verification queries:
-- SELECT COUNT(*) as total_subcategories FROM subcategories;
-- SELECT parent_category, COUNT(*) as count FROM subcategories GROUP BY parent_category;
-- SELECT * FROM subcategories WHERE slug = 'yuk-mashinalari';
-- SELECT * FROM subcategories WHERE parent_subcategory_id = (SELECT subcategory_id FROM subcategories WHERE slug = 'yuk-mashinalari');

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
-- AVTOMOBIL KATEGORIYASI (automotive)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('automotive', 'Yengil mashinalar', 'Yengil mashinalar', 'yengil-mashinalar', 'Barcha turdagi yengil mashinalar', 1),
('automotive', 'Avto zapchastlar va aksessuarlar', 'Avto zapchastlar va aksessuarlar', 'avto-zapchastlar-aksessuarlar', 'Mashina ehtiyot qismlari, aksessuarlar va qo''shimcha jihozlar', 2),
('automotive', 'Moto', 'Moto', 'moto', 'Mototsikllar, skuterlar va boshqa ikki gildirakli transport', 3),
('automotive', 'Yuk mashinalari', 'Yuk mashinalari', 'yuk-mashinalari', 'Kamaz, Man, Scania va boshqa yuk mashinalari', 4),
('automotive', 'Maxsus texnika', 'Maxsus texnika', 'maxsus-texnika', 'Ekskavator, buldozer, kran va boshqa maxsus texnika', 5),
('automotive', 'Velosipedlar', 'Velosipedlar', 'velosipedlar', 'Velosipedlar va boshqa ikki gildirakli transport', 6)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- Nested: Yengil mashinalar brendlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Nexia', 'Nexia', 'nexia', 'Nexia yengil mashinalari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Gazel', 'Gazel', 'gazel', 'Gazel yengil mashinalari', 2, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'BMW', 'BMW', 'bmw', 'BMW yengil mashinalari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Mercedes', 'Mercedes', 'mercedes', 'Mercedes yengil mashinalari', 4, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Toyota', 'Toyota', 'toyota', 'Toyota yengil mashinalari', 5, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Honda', 'Honda', 'honda', 'Honda yengil mashinalari', 6, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Audi', 'Audi', 'audi', 'Audi yengil mashinalari', 7, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Volkswagen', 'Volkswagen', 'volkswagen', 'Volkswagen yengil mashinalari', 8, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Chevrolet', 'Chevrolet', 'chevrolet', 'Chevrolet yengil mashinalari', 9, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Ford', 'Ford', 'ford', 'Ford yengil mashinalari', 10, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Hyundai', 'Hyundai', 'hyundai', 'Hyundai yengil mashinalari', 11, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Kia', 'Kia', 'kia', 'Kia yengil mashinalari', 12, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Lada', 'Lada', 'lada', 'Lada yengil mashinalari', 13, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Boshqa brendlar', 'Boshqa brendlar', 'boshqa-brendlar', 'Boshqa yengil mashina brendlari', 14, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yengil-mashinalar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Nested: Yuk mashinalari brendlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Kamaz', 'Kamaz', 'kamaz', 'Kamaz yuk mashinalari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yuk-mashinalari'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Man', 'Man', 'man', 'Man yuk mashinalari', 2, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yuk-mashinalari'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Scania', 'Scania', 'scania', 'Scania yuk mashinalari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'yuk-mashinalari'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Nested: Avto zapchastlar va aksessuarlar turlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Ehtiyot qismlar', 'Ehtiyot qismlar', 'ehtiyot-qismlar', 'Mashina ehtiyot qismlari', 1, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Aksessuarlar', 'Aksessuarlar', 'avto-aksessuarlar', 'Mashina aksessuarlari va qo''shimcha jihozlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Shinalar va g''ildiraklar', 'Shinalar va g''ildiraklar', 'shinalar-gildiraklar', 'Shinalar, g''ildiraklar va disklar', 3, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Audio va video', 'Audio va video', 'avto-audio-video', 'Mashina uchun audio va video tizimlar', 4, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'avto-zapchastlar-aksessuarlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- Nested: Moto turlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Mototsikllar', 'Mototsikllar', 'mototsikllar', 'Mototsikllar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'moto'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Skuterlar', 'Skuterlar', 'skuterlar', 'Skuterlar va mopedlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'moto'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'automotive', 'Moto ehtiyot qismlari', 'Moto ehtiyot qismlari', 'moto-ehtiyot-qismlari', 'Mototsikl ehtiyot qismlari va aksessuarlari', 3, subcategory_id
FROM subcategories WHERE parent_category = 'automotive' AND slug = 'moto'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- ============================================
-- SPORT KATEGORIYASI (sports_outdoors)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('sports_outdoors', 'Fitness uskunalari', 'Fitness uskunalari', 'fitness-uskunalari', 'Fitness va sport zali uchun uskunalar', 1),
('sports_outdoors', 'Turizm', 'Turizm', 'turizm', 'Sayohat va turizm uchun anjomlar', 2),
('sports_outdoors', 'Olimpiada sportlari', 'Olimpiada sportlari', 'olimpiada-sportlari', 'Olimpiada va professional sport uskunalari', 3),
('sports_outdoors', 'Baliq ovlash', 'Baliq ovlash', 'baliq-ovlash', 'Baliq ovlash anjomlari va aksessuarlari', 4),
('sports_outdoors', 'Velosipedlar', 'Velosipedlar', 'velosipedlar', 'Velosipedlar va boshqa ikki gildirakli transport', 5),
('sports_outdoors', 'Tennnis va badminton', 'Tennnis va badminton', 'tennis-badminton', 'Tennis va badminton raketkalari va to''plari', 6),
('sports_outdoors', 'Futbol', 'Futbol', 'futbol', 'Futbol to''plari va anjomlari', 7),
('sports_outdoors', 'Basketbol', 'Basketbol', 'basketbol', 'Basketbol to''plari va anjomlari', 8)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- ============================================
-- BOLALAR KATEGORIYASI (baby_kids)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('baby_kids', 'O''yinchoqlar', 'O''yinchoqlar', 'oyinchoqlar', 'Bolalar o''yinchoqlari', 1),
('baby_kids', 'Bolalar kiyimlari', 'Bolalar kiyimlari', 'bolalar-kiyimlari', 'Bolalar uchun kiyim-kechaklar', 2),
('baby_kids', 'Bolalar oyoq kiyimlari', 'Bolalar oyoq kiyimlari', 'bolalar-oyoq-kiyimlari', 'Bolalar uchun oyoq kiyimlar', 3),
('baby_kids', 'Bolalar mebeli', 'Bolalar mebeli', 'bolalar-mebeli', 'Bolalar uchun mebel va jihozlar', 4),
('baby_kids', 'Bolalar avtomobillari', 'Bolalar avtomobillari', 'bolalar-avtomobillari', 'Bolalar uchun avtomobillar va velosipedlar', 5),
('baby_kids', 'Bolalar oshxona anjomlari', 'Bolalar oshxona anjomlari', 'bolalar-oshxona-anjomlari', 'Bolalar uchun idishlar va oshxona anjomlari', 6),
('baby_kids', 'Bog''chalar va chaqaloq jihozlari', 'Bog''chalar va chaqaloq jihozlari', 'bogchalar-chaqaloq-jihozlari', 'Bog''cha, kolyaska va chaqaloq jihozlari', 7),
('baby_kids', 'Kitoblar va o''quv materiallari', 'Kitoblar va o''quv materiallari', 'bolalar-kitoblari', 'Bolalar uchun kitoblar va o''quv materiallari', 8)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- Nested: O''yinchoqlar turlari
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'baby_kids', 'O''yin mashinalari', 'O''yin mashinalari', 'oyin-mashinalari', 'Bolalar uchun o''yin mashinalari va robotlar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'baby_kids' AND slug = 'oyinchoqlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'baby_kids', 'Qo''g''irchoqlar', 'Qo''g''irchoqlar', 'qogirchoqlar', 'Qo''g''irchoqlar va boshqa o''yinchoqlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'baby_kids' AND slug = 'oyinchoqlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'baby_kids', 'Konstruktorlar', 'Konstruktorlar', 'konstruktorlar', 'Lego va boshqa konstruktorlar', 3, subcategory_id
FROM subcategories WHERE parent_category = 'baby_kids' AND slug = 'oyinchoqlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'baby_kids', 'Transport o''yinchoqlari', 'Transport o''yinchoqlari', 'transport-oyinchoqlari', 'Mashinalar, samolyotlar va boshqa transport o''yinchoqlari', 4, subcategory_id
FROM subcategories WHERE parent_category = 'baby_kids' AND slug = 'oyinchoqlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- ============================================
-- KITOBLAR KATEGORIYASI (books_media)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('books_media', 'Badiiy adabiyot', 'Badiiy adabiyot', 'badiiy-adabiyot', 'Romanlar, qissalar va hikoyalar', 1),
('books_media', 'Ilmiy adabiyot', 'Ilmiy adabiyot', 'ilmiy-adabiyot', 'Ilmiy va o''quv adabiyotlari', 2),
('books_media', 'Darsliklar va qo''llanmalar', 'Darsliklar va qo''llanmalar', 'darsliklar-qollanmalar', 'Darsliklar, qo''llanmalar va metodikalar', 3),
('books_media', 'Biznes va iqtisod', 'Biznes va iqtisod', 'biznes-iqtisod', 'Biznes, iqtisod va marketing kitoblari', 4),
('books_media', 'San''at va dizayn', 'San''at va dizayn', 'sanat-dizayn', 'San''at, dizayn va ijodiyot kitoblari', 5),
('books_media', 'Tarix va siyosat', 'Tarix va siyosat', 'tarix-siyosat', 'Tarix, siyosat va jamiyat kitoblari', 6),
('books_media', 'Falsafa va psixologiya', 'Falsafa va psixologiya', 'falsafa-psixologiya', 'Falsafa, psixologiya va shaxsiy rivojlanish', 7),
('books_media', 'Komediya va qiziqarli', 'Komediya va qiziqarli', 'komediya-qiziqarli', 'Komediya, hazil va qiziqarli kitoblar', 8),
('books_media', 'CD va DVD', 'CD va DVD', 'cd-dvd', 'Musiqa, filmlar va dasturlar', 9),
('books_media', 'Jurnallar va gazetalar', 'Jurnallar va gazetalar', 'jurnallar-gazetalar', 'Jurnallar, gazetalar va periodik nashrlar', 10)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- ============================================
-- ELEKTRONIKA KATEGORIYASI (electronics)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('electronics', 'Telefonlar', 'Telefonlar', 'telefonlar', 'Smartfonlar va mobil telefonlar', 1),
('electronics', 'Noutbuklar', 'Noutbuklar', 'noutbuklar', 'Portativ kompyuterlar', 2),
('electronics', 'Kompyuterlar', 'Kompyuterlar', 'kompyuterlar', 'Stol kompyuterlari va monobloklar', 3),
('electronics', 'Planshetlar', 'Planshetlar', 'planshetlar', 'Planshetlar va e-readerlar', 4),
('electronics', 'Televizorlar', 'Televizorlar', 'televizorlar', 'TV va monitorlar', 5),
('electronics', 'Maishiy texnika', 'Maishiy texnika', 'maishiy-texnika', 'Muzlatgich, kir yuvish mashinasi va boshqalar', 6),
('electronics', 'Audio va video', 'Audio va video', 'audio-video', 'Kolonkalar, naushniklar, kameralar', 7),
('electronics', 'O''yin konsollari', 'O''yin konsollari', 'oyin-konsollari', 'PlayStation, Xbox va boshqalar', 8)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- Nested: iPhone, Samsung under Telefonlar
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'electronics', 'iPhone', 'iPhone', 'iphone', 'Apple iPhone telefonlar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'electronics', 'Samsung', 'Samsung', 'samsung', 'Samsung telefonlar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'electronics' AND slug = 'telefonlar'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- ============================================
-- KIYIM-KECHAK KATEGORIYASI (clothing)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('clothing', 'Erkaklar kiyimi', 'Erkaklar kiyimi', 'erkaklar-kiyimi', 'Erkaklar uchun kiyim-kechaklar', 1),
('clothing', 'Ayollar kiyimi', 'Ayollar kiyimi', 'ayollar-kiyimi', 'Ayollar uchun kiyim-kechaklar', 2),
('clothing', 'Bolalar kiyimi', 'Bolalar kiyimi', 'bolalar-kiyimi', 'Bolalar uchun kiyim-kechaklar', 3),
('clothing', 'Oyoq kiyim', 'Oyoq kiyim', 'oyoq-kiyim', 'Etik, tufli, krossovkalar', 4),
('clothing', 'Aksessuarlar', 'Aksessuarlar', 'aksessuarlar', 'Sumkalar, soatlar, aksessuarlar', 5)
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz, description_uz = EXCLUDED.description_uz;

-- ============================================
-- UY VA BOG' KATEGORIYASI (home_garden)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
('home_garden', 'Kvartiralar', 'Kvartiralar', 'kvartiralar', 'Bir xonali, ikki xonali, uch xonali kvartiralar', 1),
('home_garden', 'Hovli uylar', 'Hovli uylar', 'hovli-uylar', 'Hovli uylar va qo''shni uylar', 2),
('home_garden', 'Yer uchastkalari', 'Yer uchastkalari', 'yer-uchastkalari', 'Yer uchastkalari va qurilish uchun yerlar', 3),
('home_garden', 'Ofislar', 'Ofislar', 'ofislar', 'Ofis binolari va biznes binolari', 4),
('home_garden', 'Magazinlar', 'Magazinlar', 'magazinlar', 'Savdo maydonlari va magazinlar', 5),
('home_garden', 'Ijaraga', 'Ijaraga', 'ijaraga', 'Ijaraga beriladigan ko''chmas mulk', 6),
('home_garden', 'Mebel', 'Mebel', 'mebel', 'Divanlar, stollar, stullar', 7),
('home_garden', 'Qurilish mollari', 'Qurilish mollari', 'qurilish-mollari', 'Cement, g''isht, plitka va boshqalar', 8),
('home_garden', 'Bog'' anjomlari', 'Bog'' anjomlari', 'bog-anjomlari', 'Bog'' va hovli uchun asboblar', 9),
('home_garden', 'Uy bezaklari', 'Uy bezaklari', 'uy-bezaklari', 'Interyer bezaklari', 10),
('home_garden', 'Oshxona jihozlari', 'Oshxona jihozlari', 'oshxona-jihozlari', 'Oshxona uchun kerakli jihozlar', 11)
ON CONFLICT (slug) DO UPDATE SET 
  name_uz = COALESCE(EXCLUDED.name_uz, subcategories.name_uz),
  description_uz = COALESCE(EXCLUDED.description_uz, subcategories.description_uz),
  display_order = COALESCE(EXCLUDED.display_order, subcategories.display_order),
  name = COALESCE(EXCLUDED.name, subcategories.name),
  description = COALESCE(EXCLUDED.description, subcategories.description);

-- Nested: Divanlar, Stollar under Mebel
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'home_garden', 'Divanlar', 'Divanlar', 'divanlar', 'Divanlar va kreslolar', 1, subcategory_id
FROM subcategories WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order, parent_subcategory_id)
SELECT 'home_garden', 'Stollar', 'Stollar', 'stollar', 'Har xil turdagi stollar', 2, subcategory_id
FROM subcategories WHERE parent_category = 'home_garden' AND slug = 'mebel'
ON CONFLICT (slug) DO UPDATE SET name_uz = EXCLUDED.name_uz;

-- ============================================
-- BOSHQALAR KATEGORIYASI (other)
-- ============================================
INSERT INTO subcategories (parent_category, name, name_uz, slug, description_uz, display_order) VALUES
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
-- SELECT * FROM subcategories WHERE parent_category = 'automotive';
-- SELECT * FROM subcategories WHERE parent_category = 'baby_kids';
-- SELECT * FROM subcategories WHERE parent_category = 'books_media';

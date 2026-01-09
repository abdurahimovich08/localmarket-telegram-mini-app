-- ============================================
-- TEZKOR TEKSHIRUV - Barcha narsa to'g'rimi?
-- ============================================

-- Jadvallar soni (3 ta bo'lishi kerak)
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_searches', 'user_listing_interactions', 'user_category_preferences');

-- Indexes soni (6 ta bo'lishi kerak)
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_searches', 'user_listing_interactions', 'user_category_preferences');

-- Funksiyalar soni (2 ta bo'lishi kerak)
SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_user_category_preference', 'get_user_category_score');

-- Trigger soni (1 ta bo'lishi kerak)
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_update_category_preference';

-- ✅ Agar barcha natijalar to'g'ri bo'lsa:
-- total_tables = 3
-- total_indexes = 6 (yoki ko'proq - PostgreSQL ba'zi indexlarni avtomatik yaratadi)
-- total_functions = 2
-- total_triggers = 1

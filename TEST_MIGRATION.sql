-- ============================================
-- MIGRATION TEKSHIRUVI
-- Bu kodlarni Supabase SQL Editor'da run qiling
-- ============================================

-- 1. JADVALLAR MAVJUDLIGINI TEKSHIRISH
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'user_searches' THEN '✅ Search tracking'
    WHEN table_name = 'user_listing_interactions' THEN '✅ Interaction tracking'
    WHEN table_name = 'user_category_preferences' THEN '✅ Preferences storage'
    ELSE table_name
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')
ORDER BY table_name;

-- 2. INDEXES TEKSHIRISH
SELECT 
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE 'idx_user_searches%' THEN '✅ Search indexes'
    WHEN indexname LIKE 'idx_interactions%' THEN '✅ Interaction indexes'
    WHEN indexname LIKE 'idx_preferences%' THEN '✅ Preference indexes'
    ELSE indexname
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')
    OR indexname LIKE 'idx_%'
  )
ORDER BY tablename, indexname;

-- 3. FUNKSIYALAR TEKSHIRISH
SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'update_user_category_preference' THEN '✅ Auto-update preferences'
    WHEN routine_name = 'get_user_category_score' THEN '✅ Get category score'
    ELSE routine_name
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_user_category_preference', 'get_user_category_score')
ORDER BY routine_name;

-- 4. TRIGGER TEKSHIRISH
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  CASE 
    WHEN trigger_name = 'trigger_update_category_preference' THEN '✅ Auto preference update'
    ELSE trigger_name
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_update_category_preference';

-- 5. TEST QILISH - Jadval strukturasini ko'rish
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_category_preferences'
ORDER BY ordinal_position;

-- ============================================
-- ✅ BARCHASI TO'G'RI BO'LSA, QUYIDAGI NATIJALARNI KO'RSATING:
-- ============================================
-- 1. 3 ta jadval ko'rsatilishi kerak
-- 2. 6 ta index ko'rsatilishi kerak
-- 3. 2 ta funksiya ko'rsatilishi kerak
-- 4. 1 ta trigger ko'rsatilishi kerak
-- ============================================

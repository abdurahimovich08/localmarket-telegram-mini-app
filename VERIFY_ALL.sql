-- ============================================
-- BARCHA QISMLARNI BATAFSIL TEKSHIRISH
-- ============================================

-- 1. JADVALLAR (3 ta bo'lishi kerak)
SELECT 
  '=== JADVALLAR ===' as section;
  
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'user_searches' THEN '✅ Search tracking jadvali'
    WHEN table_name = 'user_listing_interactions' THEN '✅ Interaction tracking jadvali'
    WHEN table_name = 'user_category_preferences' THEN '✅ Preferences jadvali'
  END as description
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')
ORDER BY table_name;

-- 2. INDEXES (6+ bo'lishi kerak)
SELECT 
  '=== INDEXES ===' as section;
  
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')
ORDER BY tablename, indexname;

-- 3. FUNKSIYALAR (2 ta bo'lishi kerak)
SELECT 
  '=== FUNKSIYALAR ===' as section;
  
SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'update_user_category_preference' THEN '✅ Auto-update preferences'
    WHEN routine_name = 'get_user_category_score' THEN '✅ Get category score'
  END as description
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_user_category_preference', 'get_user_category_score')
ORDER BY routine_name;

-- 4. TRIGGER (1 ta bo'lishi kerak)
SELECT 
  '=== TRIGGER ===' as section;
  
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  '✅ Auto preference update' as description
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_update_category_preference';

-- 5. SUMMARY (Xulosa)
SELECT 
  '=== XULOSA ===' as section;
  
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')) as jadvallar_soni,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')) as indexes_soni,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('update_user_category_preference', 'get_user_category_score')) as funksiyalar_soni,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_schema = 'public' 
   AND trigger_name = 'trigger_update_category_preference') as trigger_soni;

-- ============================================
-- TEZKOR TEKSHIRUV - Barcha narsa to'g'rimi?
-- ============================================

-- BARCHA NATIJALARNI BIRGA KO'RISH UCHUN:
SELECT 
  'Jadvallar' as type,
  COUNT(*)::text as count,
  CASE WHEN COUNT(*) = 3 THEN '✅ TO''G''RI' ELSE '❌ XATO' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')

UNION ALL

SELECT 
  'Indexes' as type,
  COUNT(*)::text as count,
  CASE WHEN COUNT(*) >= 6 THEN '✅ TO''G''RI' ELSE '❌ XATO' END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_searches', 'user_listing_interactions', 'user_category_preferences')

UNION ALL

SELECT 
  'Funksiyalar' as type,
  COUNT(*)::text as count,
  CASE WHEN COUNT(*) = 2 THEN '✅ TO''G''RI' ELSE '❌ XATO' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_user_category_preference', 'get_user_category_score')

UNION ALL

SELECT 
  'Trigger' as type,
  COUNT(*)::text as count,
  CASE WHEN COUNT(*) = 1 THEN '✅ TO''G''RI' ELSE '❌ XATO' END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_update_category_preference';

-- ============================================
-- ✅ KUTILGAN NATIJALAR:
-- ============================================
-- Jadvallar: 3 ✅
-- Indexes: 6 yoki ko'proq ✅
-- Funksiyalar: 2 ✅
-- Trigger: 1 ✅
-- ============================================

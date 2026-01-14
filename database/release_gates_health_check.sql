-- Release Gates: Supabase VIEW Health Check
-- Migration boshlashdan oldin barcha so'rovlar muvaffaqiyatli bo'lishi kerak

-- 1. VIEW mavjudligini tekshirish
SELECT 
  'VIEW mavjudligi' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname = 'unified_items'
    ) THEN '✅ VIEW mavjud'
    ELSE '❌ VIEW topilmadi'
  END as result;

-- 2. Umumiy itemlar soni
SELECT 
  'Umumiy itemlar soni' as test_name,
  COUNT(*)::text as result
FROM unified_items;

-- 3. Entity type bo'yicha taqsimot
SELECT 
  'Entity type taqsimoti' as test_name,
  entity_type,
  COUNT(*) as count
FROM unified_items
GROUP BY entity_type
ORDER BY count DESC;

-- 4. Eng so'nggi 20 ta item (created_at tekshiruvi)
SELECT 
  'Eng so\'nggi itemlar' as test_name,
  item_id,
  entity_type,
  title,
  created_at
FROM unified_items
ORDER BY created_at DESC
LIMIT 20;

-- 5. NULL fieldlar tekshiruvi
SELECT 
  'NULL fieldlar tekshiruvi' as test_name,
  COUNT(*) as total_items,
  COUNT(image_url) as items_with_image,
  COUNT(price) as items_with_price,
  COUNT(store_id) as items_with_store,
  COUNT(owner_id) as items_with_owner
FROM unified_items;

-- 6. Stable ID format tekshiruvi
SELECT 
  'Stable ID format' as test_name,
  item_id,
  entity_type,
  CONCAT(entity_type, ':', item_id) as stable_id,
  CASE 
    WHEN item_id IS NULL THEN '❌ item_id NULL'
    WHEN entity_type IS NULL THEN '❌ entity_type NULL'
    ELSE '✅ To\'g\'ri format'
  END as result
FROM unified_items
LIMIT 10;

-- 7. Search function mavjudligi
SELECT 
  'Search function mavjudligi' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'search_unified_items'
    ) THEN '✅ Function mavjud'
    ELSE '❌ Function topilmadi'
  END as result;

-- 8. Search function test
SELECT 
  'Search function test' as test_name,
  COUNT(*)::text as result_count
FROM search_unified_items(
  search_query := NULL,
  item_type_filter := NULL,
  category_filter := NULL,
  min_price := NULL,
  max_price := NULL,
  owner_id_filter := NULL,
  store_id_filter := NULL,
  limit_count := 10
);

-- 9. RLS Policies tekshiruvi (listings)
SELECT 
  'RLS Policies (listings)' as test_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'listings'
ORDER BY policyname;

-- 10. RLS Policies tekshiruvi (stores)
SELECT 
  'RLS Policies (stores)' as test_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'stores'
ORDER BY policyname;

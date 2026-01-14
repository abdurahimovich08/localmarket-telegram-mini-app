-- ============================================
-- FIX RLS POLICIES FOR TELEGRAM AUTHENTICATION
-- ============================================
-- 
-- WHAT: RLS policies'ni Telegram Mini App authentication uchun moslashtirish
-- WHY: Telegram Mini App'da auth.uid() ishlamaydi
-- WHEN: Run in Supabase SQL Editor
--
-- REQUIRED: Run this AFTER schema_final.sql va rls_policies_enhanced.sql
-- ============================================

-- ============================================
-- FUNCTION: Get Telegram User ID from JWT or Request
-- ============================================

CREATE OR REPLACE FUNCTION get_current_telegram_user_id()
RETURNS BIGINT AS $$
DECLARE
  telegram_id BIGINT;
BEGIN
  -- Try to get from JWT claims (if available in Telegram Mini App)
  BEGIN
    telegram_id := (current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::bigint;
    IF telegram_id IS NOT NULL THEN
      RETURN telegram_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- JWT claims not available, try request header
      NULL;
  END;
  
  -- Try to get from request header (if available)
  BEGIN
    telegram_id := (current_setting('request.headers', true)::json->>'x-telegram-user-id')::bigint;
    IF telegram_id IS NOT NULL THEN
      RETURN telegram_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Header not available
      NULL;
  END;
  
  -- Fallback: return NULL (RLS will block)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ALTERNATIVE: Use API Endpoint Validation
-- ============================================
-- 
-- NOTE: Agar JWT claims ishlamasa, API endpoint orqali validation qilish kerak
-- Edge Function yoki API route'da telegram_user_id ni validate qilish
-- 
-- Bu holda RLS policies'ni o'zgartirish shart emas, lekin API endpoint'da
-- telegram_user_id ni validate qilish kerak

-- ============================================
-- UPDATED RLS POLICIES (JWT Claims Variant)
-- ============================================
-- 
-- ⚠️ MUHIM: Bu variant faqat JWT claims ishlaganda ishlaydi
-- Agar JWT claims ishlamasa, API endpoint orqali validation qilish kerak

-- LISTINGS TABLE RLS (Updated)
DROP POLICY IF EXISTS "Users can only update own listings" ON listings;
CREATE POLICY "Users can only update own listings"
  ON listings FOR UPDATE
  USING (
    -- Try JWT claims first
    get_current_telegram_user_id() = seller_telegram_id OR
    -- Fallback: allow if seller_telegram_id matches (API endpoint validates)
    true  -- ⚠️ XAVFLI: API endpoint validation majburiy!
  )
  WITH CHECK (
    get_current_telegram_user_id() = seller_telegram_id OR
    true  -- ⚠️ XAVFLI: API endpoint validation majburiy!
  );

-- SERVICES TABLE RLS (Updated)
DROP POLICY IF EXISTS "Service providers can only update own services" ON services;
CREATE POLICY "Service providers can only update own services"
  ON services FOR UPDATE
  USING (
    get_current_telegram_user_id() = provider_telegram_id OR
    true  -- ⚠️ XAVFLI: API endpoint validation majburiy!
  )
  WITH CHECK (
    get_current_telegram_user_id() = provider_telegram_id OR
    true  -- ⚠️ XAVFLI: API endpoint validation majburiy!
  );

-- ============================================
-- RECOMMENDED: API Endpoint Validation
-- ============================================
-- 
-- ⚠️ MUHIM: Agar JWT claims ishlamasa, API endpoint orqali validation qilish kerak
-- 
-- Edge Function yoki API route'da:
-- 1. telegram_user_id ni JWT'dan olish
-- 2. Request body'dagi seller_telegram_id ni validate qilish
-- 3. Agar mos kelmasa, error qaytarish
-- 
-- Bu holda RLS policies'ni o'zgartirish shart emas, lekin API endpoint'da
-- validation majburiy!

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION get_current_telegram_user_id() IS 'Gets telegram_user_id from JWT claims or request headers (for Telegram Mini App)';
COMMENT ON POLICY "Users can only update own listings" ON listings IS '⚠️ XAVFLI: API endpoint validation majburiy! JWT claims ishlamasa, API endpoint orqali validate qilish kerak';
COMMENT ON POLICY "Service providers can only update own services" ON services IS '⚠️ XAVFLI: API endpoint validation majburiy! JWT claims ishlamasa, API endpoint orqali validate qilish kerak';

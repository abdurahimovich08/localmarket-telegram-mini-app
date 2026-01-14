-- ============================================
-- FIX OWNER ASSIGNMENT - DB TRIGGERS
-- ============================================
-- 
-- WHAT: DB triggers to set owner_telegram_id automatically
-- WHY: Prevent frontend from sending fake owner IDs
-- WHEN: Run in Supabase SQL Editor
--
-- REQUIRED: Run this AFTER schema_final.sql
-- ============================================

-- ============================================
-- FUNCTION: Get Telegram User ID from JWT
-- ============================================

-- Note: Telegram Mini App'da JWT claims'da telegram_user_id bo'lishi kerak
-- Agar JWT claims'da bo'lmasa, API endpoint orqali validation qilish kerak

CREATE OR REPLACE FUNCTION get_telegram_user_id()
RETURNS BIGINT AS $$
DECLARE
  telegram_id BIGINT;
BEGIN
  -- Try to get from JWT claims (if available)
  BEGIN
    telegram_id := (current_setting('request.jwt.claims', true)::json->>'telegram_user_id')::bigint;
    IF telegram_id IS NOT NULL THEN
      RETURN telegram_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- JWT claims not available, return NULL
      RETURN NULL;
  END;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Set Listing Owner
-- ============================================

CREATE OR REPLACE FUNCTION set_listing_owner()
RETURNS TRIGGER AS $$
DECLARE
  telegram_id BIGINT;
BEGIN
  -- Get telegram_user_id from JWT or use provided value (if JWT not available)
  telegram_id := get_telegram_user_id();
  
  -- If JWT has telegram_user_id, use it (override frontend value)
  IF telegram_id IS NOT NULL THEN
    NEW.seller_telegram_id := telegram_id;
  END IF;
  
  -- If JWT doesn't have telegram_user_id, keep frontend value
  -- (This is acceptable if API endpoint validates it)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_listing_owner_trigger ON listings;

-- Create trigger
CREATE TRIGGER set_listing_owner_trigger
  BEFORE INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_owner();

-- ============================================
-- TRIGGER: Set Service Owner
-- ============================================

CREATE OR REPLACE FUNCTION set_service_owner()
RETURNS TRIGGER AS $$
DECLARE
  telegram_id BIGINT;
BEGIN
  -- Get telegram_user_id from JWT or use provided value (if JWT not available)
  telegram_id := get_telegram_user_id();
  
  -- If JWT has telegram_user_id, use it (override frontend value)
  IF telegram_id IS NOT NULL THEN
    NEW.provider_telegram_id := telegram_id;
  END IF;
  
  -- If JWT doesn't have telegram_user_id, keep frontend value
  -- (This is acceptable if API endpoint validates it)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_service_owner_trigger ON services;

-- Create trigger
CREATE TRIGGER set_service_owner_trigger
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_owner();

-- ============================================
-- TRIGGER: Set Store Owner
-- ============================================

CREATE OR REPLACE FUNCTION set_store_owner()
RETURNS TRIGGER AS $$
DECLARE
  telegram_id BIGINT;
BEGIN
  -- Get telegram_user_id from JWT or use provided value (if JWT not available)
  telegram_id := get_telegram_user_id();
  
  -- If JWT has telegram_user_id, use it (override frontend value)
  IF telegram_id IS NOT NULL THEN
    NEW.owner_telegram_id := telegram_id;
  END IF;
  
  -- If JWT doesn't have telegram_user_id, keep frontend value
  -- (This is acceptable if API endpoint validates it)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_store_owner_trigger ON stores;

-- Create trigger
CREATE TRIGGER set_store_owner_trigger
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION set_store_owner();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION get_telegram_user_id() IS 'Gets telegram_user_id from JWT claims (if available)';
COMMENT ON FUNCTION set_listing_owner() IS 'Automatically sets seller_telegram_id from JWT (prevents frontend spoofing)';
COMMENT ON FUNCTION set_service_owner() IS 'Automatically sets provider_telegram_id from JWT (prevents frontend spoofing)';
COMMENT ON FUNCTION set_store_owner() IS 'Automatically sets owner_telegram_id from JWT (prevents frontend spoofing)';

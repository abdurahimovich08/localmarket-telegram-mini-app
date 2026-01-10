-- ============================================
-- USER_LAST_SEEN JADVALINI YANGILASH
-- ============================================
-- 
-- MUAMMO: Eski jadvalda last_seen_at bor, yangisida last_seen_listing_id kerak
-- 
-- FOYDALANISH:
-- 1. Bu faylni Supabase SQL Editor'da bajarish
-- 2. Eski jadvalni yangilaydi
-- ============================================

-- 1. Agar last_seen_at ustuni mavjud bo'lsa, uni olib tashlash
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_last_seen' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE user_last_seen DROP COLUMN last_seen_at;
    RAISE NOTICE 'last_seen_at ustuni olib tashlandi';
  ELSE
    RAISE NOTICE 'last_seen_at ustuni mavjud emas';
  END IF;
END $$;

-- 2. Agar last_seen_listing_id ustuni yo'q bo'lsa, qo'shish
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_last_seen' 
    AND column_name = 'last_seen_listing_id'
  ) THEN
    ALTER TABLE user_last_seen 
    ADD COLUMN last_seen_listing_id UUID REFERENCES listings(listing_id) ON DELETE SET NULL;
    RAISE NOTICE 'last_seen_listing_id ustuni qo''shildi';
  ELSE
    RAISE NOTICE 'last_seen_listing_id ustuni allaqachon mavjud';
  END IF;
END $$;

-- 3. updated_at ni TIMESTAMPTZ ga o'zgartirish (agar TIMESTAMP bo'lsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_last_seen' 
    AND column_name = 'updated_at'
    AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE user_last_seen 
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ;
    RAISE NOTICE 'updated_at TIMESTAMPTZ ga o''zgartirildi';
  ELSE
    RAISE NOTICE 'updated_at allaqachon TIMESTAMPTZ yoki mavjud emas';
  END IF;
END $$;

-- 4. updated_at ni DEFAULT now() qilish (agar yo'q bo'lsa)
DO $$ 
BEGIN
  ALTER TABLE user_last_seen 
  ALTER COLUMN updated_at SET DEFAULT now();
  RAISE NOTICE 'updated_at DEFAULT now() qilindi';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'updated_at DEFAULT qo''shishda xatolik: %', SQLERRM;
END $$;

-- 5. Indexlarni yangilash
DROP INDEX IF EXISTS idx_user_last_seen_at;
CREATE INDEX IF NOT EXISTS idx_user_last_seen_listing ON user_last_seen(last_seen_listing_id);
CREATE INDEX IF NOT EXISTS idx_user_last_seen_updated ON user_last_seen(updated_at);

-- 6. Funksiyani yangilash
CREATE OR REPLACE FUNCTION update_user_last_seen(user_id BIGINT, listing_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF listing_id IS NOT NULL THEN
    -- Agar listing_id berilgan bo'lsa, uni saqlaydi
    INSERT INTO user_last_seen (user_telegram_id, last_seen_listing_id, updated_at)
    VALUES (user_id, listing_id, now())
    ON CONFLICT (user_telegram_id) 
    DO UPDATE SET 
      last_seen_listing_id = listing_id,
      updated_at = now();
  ELSE
    -- Agar listing_id berilmagan bo'lsa, faqat updated_at ni yangilaydi
    INSERT INTO user_last_seen (user_telegram_id, updated_at)
    VALUES (user_id, now())
    ON CONFLICT (user_telegram_id) 
    DO UPDATE SET updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 7. Jadval strukturasini tekshirish
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_last_seen'
ORDER BY ordinal_position;

-- ============================================
-- YAKUN
-- ============================================
-- Jadval yangilandi! Endi last_seen_listing_id ishlaydi.

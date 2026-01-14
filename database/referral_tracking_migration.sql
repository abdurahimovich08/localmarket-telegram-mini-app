-- ============================================
-- REFERRAL TRACKING SYSTEM MIGRATION
-- ============================================
-- 
-- Muammo: Bot va WebApp orasida referral tracking yo'q
-- Yechim: Database'ga referral_code va tracking qo'shish
--
-- QADAMLAR:
-- 1. Stores jadvaliga referral_code qo'shish
-- 2. User referrals jadvali yaratish
-- 3. Indexes qo'shish
-- ============================================

-- ============================================
-- STEP 1: Stores jadvaliga referral_code qo'shish
-- ============================================

-- Referral code maydonini qo'shish (unique, 8-12 belgi)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Mavjud stores uchun referral_code generate qilish
UPDATE stores 
SET referral_code = LOWER(SUBSTRING(MD5(store_id::TEXT || name || created_at::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Index qo'shish (tez qidirish uchun)
CREATE INDEX IF NOT EXISTS idx_stores_referral_code ON stores(referral_code);

-- ============================================
-- STEP 2: User Referrals jadvali yaratish
-- ============================================
-- Bu jadval user qaysi shop orqali kelganini saqlaydi

CREATE TABLE IF NOT EXISTS user_referrals (
  referral_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referred_at TIMESTAMPTZ DEFAULT now(),
  -- User bir necha marta bir xil shop'ga kelishi mumkin, lekin birinchi marta qayd qilamiz
  UNIQUE(user_telegram_id, store_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_referrals_user ON user_referrals(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_store ON user_referrals(store_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);

-- ============================================
-- STEP 3: Function - Referral code generate qilish
-- ============================================

CREATE OR REPLACE FUNCTION generate_referral_code(store_name TEXT, store_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  -- 8 belgili unique code generate qilish
  code := LOWER(SUBSTRING(MD5(store_id::TEXT || store_name || now()::TEXT) FROM 1 FOR 8));
  
  -- Unique ekanligini tekshirish
  SELECT EXISTS(SELECT 1 FROM stores WHERE referral_code = code) INTO exists_check;
  
  -- Agar mavjud bo'lsa, qo'shimcha belgi qo'shish
  WHILE exists_check LOOP
    code := LOWER(SUBSTRING(MD5(store_id::TEXT || store_name || now()::TEXT || random()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM stores WHERE referral_code = code) INTO exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Trigger - Store yaratilganda referral_code avtomatik generate qilish
-- ============================================

CREATE OR REPLACE FUNCTION set_store_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code(NEW.name, NEW.store_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_store_referral_code ON stores;
CREATE TRIGGER trigger_set_store_referral_code
BEFORE INSERT ON stores
FOR EACH ROW
EXECUTE FUNCTION set_store_referral_code();

-- ============================================
-- STEP 5: Function - Referral tracking (user'ni shop'ga bog'lash)
-- ============================================

CREATE OR REPLACE FUNCTION track_referral(
  p_user_telegram_id BIGINT,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_store_id UUID;
  v_store_name TEXT;
  v_result JSONB;
BEGIN
  -- Referral code orqali shop topish
  SELECT store_id, name INTO v_store_id, v_store_name
  FROM stores
  WHERE referral_code = p_referral_code
  LIMIT 1;
  
  -- Agar shop topilmasa
  IF v_store_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid referral code'
    );
  END IF;
  
  -- User'ni shop'ga bog'lash (agar allaqachon bog'lanmagan bo'lsa)
  INSERT INTO user_referrals (user_telegram_id, store_id, referral_code)
  VALUES (p_user_telegram_id, v_store_id, p_referral_code)
  ON CONFLICT (user_telegram_id, store_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'store_id', v_store_id,
    'store_name', v_store_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Function - User'ning shop'ini olish
-- ============================================

CREATE OR REPLACE FUNCTION get_user_store(p_user_telegram_id BIGINT)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  referral_code TEXT,
  referred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.store_id,
    s.name,
    ur.referral_code,
    ur.referred_at
  FROM user_referrals ur
  JOIN stores s ON s.store_id = ur.store_id
  WHERE ur.user_telegram_id = p_user_telegram_id
  ORDER BY ur.referred_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: RLS Policies (Agar RLS yoqilgan bo'lsa)
-- ============================================

-- User referrals jadvali uchun RLS
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

-- Users o'z referral ma'lumotlarini ko'ra oladi
CREATE POLICY "Users can view their own referrals"
ON user_referrals FOR SELECT
USING (auth.uid()::text = user_telegram_id::text OR true); -- Temporary: allow all reads

-- Store owners o'z store'lariga kelgan referral'larni ko'ra oladi
CREATE POLICY "Store owners can view their store referrals"
ON user_referrals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores s
    WHERE s.store_id = user_referrals.store_id
    AND s.owner_telegram_id::text = auth.uid()::text
  )
);

-- ============================================
-- ✅ MIGRATION TUGADI
-- ============================================
-- 
-- Endi quyidagilar ishlaydi:
-- 1. Store yaratilganda avtomatik referral_code generate qilinadi
-- 2. Bot /start REF_CODE orqali user'ni shop'ga bog'laydi
-- 3. WebApp user'ning shop'ini database'dan o'qiy oladi
-- ============================================

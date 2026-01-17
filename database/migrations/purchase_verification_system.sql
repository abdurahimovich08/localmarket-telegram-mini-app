-- ============================================
-- PURCHASE VERIFICATION SYSTEM
-- Sharx yozish faqat tasdiqlangan xaridlar uchun
-- ============================================

-- 1. Purchase Claims Table (Xarid da'volari)
-- Xaridor "Sotib oldim" deganda yaratiladi
CREATE TABLE IF NOT EXISTS purchase_claims (
  claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  buyer_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  seller_telegram_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  
  -- Variant tanlagan bo'lsa
  selected_size TEXT,
  selected_color TEXT,
  
  -- Status: pending → approved/rejected
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Sotuvchi javobi
  seller_response_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Xarid turi (offline/online)
  purchase_type TEXT DEFAULT 'offline' CHECK (purchase_type IN ('offline', 'online', 'delivery')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Bir xaridor bir elonga faqat bir marta claim qilishi mumkin
  UNIQUE(buyer_telegram_id, listing_id)
);

-- 2. Reviews jadvaliga yangi ustunlar qo'shish
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS purchase_claim_id UUID REFERENCES purchase_claims(claim_id);

-- Sharx rasmlari (5 tagacha)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Qaysi variant (size/color) haqida sharx
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS purchased_size TEXT;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS purchased_color TEXT;

-- Sharx foydali bo'ldimi? (like/dislike count)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Sotuvchi javobi
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS seller_reply TEXT;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS seller_reply_at TIMESTAMPTZ;

-- 3. Indekslar
CREATE INDEX IF NOT EXISTS idx_purchase_claims_seller ON purchase_claims(seller_telegram_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_claims_buyer ON purchase_claims(buyer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_purchase_claims_listing ON purchase_claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(is_verified_purchase) WHERE is_verified_purchase = TRUE;

-- 4. RLS Policies
ALTER TABLE purchase_claims ENABLE ROW LEVEL SECURITY;

-- Hamma o'qiy oladi
CREATE POLICY "purchase_claims_read_all" ON purchase_claims
  FOR SELECT USING (true);

-- Faqat xaridor yaratadi
CREATE POLICY "purchase_claims_insert_buyer" ON purchase_claims
  FOR INSERT WITH CHECK (buyer_telegram_id = current_setting('app.current_user_id', true)::BIGINT);

-- Faqat sotuvchi yangilaydi (tasdiqlash/rad etish)
CREATE POLICY "purchase_claims_update_seller" ON purchase_claims
  FOR UPDATE USING (seller_telegram_id = current_setting('app.current_user_id', true)::BIGINT);

-- 5. View: Sotuvchi uchun tasdiqlanmagan xaridlar
CREATE OR REPLACE VIEW pending_purchase_claims AS
SELECT 
  pc.*,
  l.title AS listing_title,
  l.photos AS listing_photos,
  l.price AS listing_price,
  u.first_name AS buyer_first_name,
  u.username AS buyer_username
FROM purchase_claims pc
JOIN listings l ON pc.listing_id = l.listing_id
JOIN users u ON pc.buyer_telegram_id = u.telegram_user_id
WHERE pc.status = 'pending'
ORDER BY pc.created_at DESC;

-- 6. Function: Xarid claim yaratish
CREATE OR REPLACE FUNCTION create_purchase_claim(
  p_listing_id UUID,
  p_buyer_telegram_id BIGINT,
  p_selected_size TEXT DEFAULT NULL,
  p_selected_color TEXT DEFAULT NULL,
  p_purchase_type TEXT DEFAULT 'offline'
) RETURNS UUID AS $$
DECLARE
  v_seller_id BIGINT;
  v_claim_id UUID;
BEGIN
  -- Sotuvchi ID ni olish
  SELECT seller_telegram_id INTO v_seller_id 
  FROM listings WHERE listing_id = p_listing_id;
  
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Listing topilmadi';
  END IF;
  
  -- O'zining eloniga claim qilish mumkin emas
  IF v_seller_id = p_buyer_telegram_id THEN
    RAISE EXCEPTION 'O''zingizning eloningizga xarid qila olmaysiz';
  END IF;
  
  -- Claim yaratish
  INSERT INTO purchase_claims (
    listing_id, buyer_telegram_id, seller_telegram_id,
    selected_size, selected_color, purchase_type
  ) VALUES (
    p_listing_id, p_buyer_telegram_id, v_seller_id,
    p_selected_size, p_selected_color, p_purchase_type
  )
  RETURNING claim_id INTO v_claim_id;
  
  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: Sotuvchi tasdiqlashi
CREATE OR REPLACE FUNCTION approve_purchase_claim(
  p_claim_id UUID,
  p_seller_telegram_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
  v_claim purchase_claims%ROWTYPE;
BEGIN
  -- Claimni olish
  SELECT * INTO v_claim FROM purchase_claims WHERE claim_id = p_claim_id;
  
  IF v_claim.claim_id IS NULL THEN
    RAISE EXCEPTION 'Claim topilmadi';
  END IF;
  
  -- Faqat sotuvchi tasdiqlashi mumkin
  IF v_claim.seller_telegram_id != p_seller_telegram_id THEN
    RAISE EXCEPTION 'Faqat sotuvchi tasdiqlashi mumkin';
  END IF;
  
  -- Allaqachon processed bo'lsa
  IF v_claim.status != 'pending' THEN
    RAISE EXCEPTION 'Bu claim allaqachon ko''rib chiqilgan';
  END IF;
  
  -- Tasdiqlash
  UPDATE purchase_claims 
  SET status = 'approved', seller_response_at = now()
  WHERE claim_id = p_claim_id;
  
  -- Transaction yaratish (completed)
  INSERT INTO transactions (
    listing_id, buyer_telegram_id, seller_telegram_id, status, completed_at
  ) VALUES (
    v_claim.listing_id, v_claim.buyer_telegram_id, v_claim.seller_telegram_id,
    'completed', now()
  ) ON CONFLICT DO NOTHING;
  
  -- Sotuvchi sales count ni oshirish
  UPDATE users SET total_sales = COALESCE(total_sales, 0) + 1
  WHERE telegram_user_id = p_seller_telegram_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function: Sotuvchi rad etishi
CREATE OR REPLACE FUNCTION reject_purchase_claim(
  p_claim_id UUID,
  p_seller_telegram_id BIGINT,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE purchase_claims 
  SET 
    status = 'rejected', 
    seller_response_at = now(),
    rejection_reason = p_reason
  WHERE claim_id = p_claim_id 
    AND seller_telegram_id = p_seller_telegram_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function: Xaridor sharx yoza oladimi tekshirish
CREATE OR REPLACE FUNCTION can_write_review(
  p_listing_id UUID,
  p_user_telegram_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Tasdiqlangan xarid bormi?
  RETURN EXISTS (
    SELECT 1 FROM purchase_claims 
    WHERE listing_id = p_listing_id 
      AND buyer_telegram_id = p_user_telegram_id 
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function: Verified sharx yaratish
CREATE OR REPLACE FUNCTION create_verified_review(
  p_listing_id UUID,
  p_reviewer_telegram_id BIGINT,
  p_rating INTEGER,
  p_review_text TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_claim purchase_claims%ROWTYPE;
  v_seller_id BIGINT;
  v_review_id UUID;
BEGIN
  -- Tasdiqlangan claim bormi?
  SELECT * INTO v_claim FROM purchase_claims 
  WHERE listing_id = p_listing_id 
    AND buyer_telegram_id = p_reviewer_telegram_id 
    AND status = 'approved';
  
  IF v_claim.claim_id IS NULL THEN
    RAISE EXCEPTION 'Sharx yozish uchun avval xaridni tasdiqlating';
  END IF;
  
  -- Sotuvchi ID
  SELECT seller_telegram_id INTO v_seller_id FROM listings WHERE listing_id = p_listing_id;
  
  -- Sharx yaratish
  INSERT INTO reviews (
    reviewer_telegram_id, reviewed_telegram_id, listing_id,
    rating, review_text, tags, is_verified_purchase, purchase_claim_id
  ) VALUES (
    p_reviewer_telegram_id, v_seller_id, p_listing_id,
    p_rating, p_review_text, p_tags, TRUE, v_claim.claim_id
  )
  RETURNING review_id INTO v_review_id;
  
  -- Sotuvchi ratingini yangilash
  UPDATE users SET 
    rating_average = (
      SELECT AVG(rating)::NUMERIC(2,1) FROM reviews 
      WHERE reviewed_telegram_id = v_seller_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM reviews 
      WHERE reviewed_telegram_id = v_seller_id
    )
  WHERE telegram_user_id = v_seller_id;
  
  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

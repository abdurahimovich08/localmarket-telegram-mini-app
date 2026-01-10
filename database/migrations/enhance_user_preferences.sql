-- ============================================
-- ENHANCE USER PREFERENCES FOR SUBCATEGORY TRACKING
-- ============================================
-- 
-- WHAT: Add subcategory_id tracking to user_category_preferences
-- WHY: Enable granular recommendations (Kamaz → Yuk mashinalari subcategory)
-- WHEN: Run after add_user_tracking.sql
--
-- REQUIRED IN SUPABASE: YES
-- ============================================

-- Add subcategory_id column to user_category_preferences if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_category_preferences' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE user_category_preferences 
    ADD COLUMN subcategory_id UUID REFERENCES subcategories(subcategory_id) ON DELETE CASCADE;
    
    RAISE NOTICE 'subcategory_id ustuni qo''shildi';
  ELSE
    RAISE NOTICE 'subcategory_id ustuni allaqachon mavjud';
  END IF;
END $$;

-- Update unique constraint to include subcategory_id
-- Allow same category with different subcategories
DO $$
BEGIN
  -- Drop old unique constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_category_preferences_user_telegram_id_category_key'
  ) THEN
    ALTER TABLE user_category_preferences 
    DROP CONSTRAINT user_category_preferences_user_telegram_id_category_key;
    RAISE NOTICE 'Eski unique constraint olib tashlandi';
  END IF;
  
  -- Add new unique constraint with subcategory_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_category_preferences_user_category_subcategory_key'
  ) THEN
    ALTER TABLE user_category_preferences 
    ADD CONSTRAINT user_category_preferences_user_category_subcategory_key 
    UNIQUE(user_telegram_id, category, subcategory_id);
    RAISE NOTICE 'Yangi unique constraint qo''shildi (category + subcategory_id)';
  END IF;
END $$;

-- Create index for subcategory lookups
CREATE INDEX IF NOT EXISTS idx_user_category_preferences_subcategory 
ON user_category_preferences(user_telegram_id, subcategory_id) 
WHERE subcategory_id IS NOT NULL;

-- Update the preference update function to handle subcategories
CREATE OR REPLACE FUNCTION update_user_category_preference()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
  v_subcategory_id UUID;
BEGIN
  -- Only process if interaction involves a listing with category
  IF NEW.interaction_type IN ('view', 'click', 'favorite', 'search_match') THEN
    -- Get listing category and subcategory
    SELECT l.category, l.subcategory_id
    INTO v_category, v_subcategory_id
    FROM listings l
    WHERE l.listing_id = NEW.listing_id;
    
    IF v_category IS NOT NULL THEN
      -- Update category-level preference
      INSERT INTO user_category_preferences (
        user_telegram_id, 
        category, 
        subcategory_id,
        score, 
        last_interaction
      )
      VALUES (
        NEW.user_telegram_id,
        v_category,
        NULL, -- Category-level (no subcategory)
        CASE NEW.interaction_type
          WHEN 'favorite' THEN 5.0
          WHEN 'click' THEN 3.0
          WHEN 'view' THEN 1.0
          WHEN 'search_match' THEN 2.0
          ELSE 0.5
        END,
        NEW.created_at
      )
      ON CONFLICT (user_telegram_id, category, subcategory_id)
      DO UPDATE SET
        score = user_category_preferences.score + EXCLUDED.score,
        last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
        updated_at = now();
      
      -- Update subcategory-level preference (if subcategory exists)
      IF v_subcategory_id IS NOT NULL THEN
        INSERT INTO user_category_preferences (
          user_telegram_id, 
          category, 
          subcategory_id,
          score, 
          last_interaction
        )
        VALUES (
          NEW.user_telegram_id,
          v_category,
          v_subcategory_id, -- Subcategory-level
          CASE NEW.interaction_type
            WHEN 'favorite' THEN 10.0  -- Higher weight for subcategory
            WHEN 'click' THEN 6.0
            WHEN 'view' THEN 2.0
            WHEN 'search_match' THEN 4.0
            ELSE 1.0
          END,
          NEW.created_at
        )
        ON CONFLICT (user_telegram_id, category, subcategory_id)
        DO UPDATE SET
          score = user_category_preferences.score + EXCLUDED.score,
          last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
          updated_at = now();
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_category_preference ON user_listing_interactions;
CREATE TRIGGER trigger_update_category_preference
  AFTER INSERT ON user_listing_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_category_preference();

-- Function to update preferences from listing_views (new tracking table)
CREATE OR REPLACE FUNCTION update_preferences_from_view()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
  v_subcategory_id UUID;
BEGIN
  -- Get listing category and subcategory
  SELECT l.category, l.subcategory_id
  INTO v_category, v_subcategory_id
  FROM listings l
  WHERE l.listing_id = NEW.listing_id;
  
  IF v_category IS NOT NULL THEN
    -- Update category-level preference
    INSERT INTO user_category_preferences (
      user_telegram_id, 
      category, 
      subcategory_id,
      score, 
      last_interaction
    )
    VALUES (
      NEW.user_telegram_id,
      v_category,
      NULL,
      1.0, -- View = 1 point at category level
      NEW.viewed_at
    )
    ON CONFLICT (user_telegram_id, category, subcategory_id)
    DO UPDATE SET
      score = user_category_preferences.score + 1.0,
      last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
      updated_at = now();
    
    -- Update subcategory-level preference (if subcategory exists) - HIGHER WEIGHT
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO user_category_preferences (
        user_telegram_id, 
        category, 
        subcategory_id,
        score, 
        last_interaction
      )
      VALUES (
        NEW.user_telegram_id,
        v_category,
        v_subcategory_id,
        2.0, -- View = 2 points at subcategory level (double weight)
        NEW.viewed_at
      )
      ON CONFLICT (user_telegram_id, category, subcategory_id)
      DO UPDATE SET
        score = user_category_preferences.score + 2.0,
        last_interaction = GREATEST(user_category_preferences.last_interaction, EXCLUDED.last_interaction),
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Trigger on listing_views to update preferences
DROP TRIGGER IF EXISTS trigger_update_preferences_from_view ON listing_views;
CREATE TRIGGER trigger_update_preferences_from_view
  AFTER INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION update_preferences_from_view();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if subcategory_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_category_preferences' 
  AND column_name = 'subcategory_id';

-- Check unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_category_preferences'
  AND constraint_type = 'UNIQUE';

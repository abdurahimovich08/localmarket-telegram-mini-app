-- Add user_last_seen table for tracking when user last viewed listings
-- This allows showing "Yangi" badge for listings created after user's last visit

-- User Last Seen Table
CREATE TABLE IF NOT EXISTS user_last_seen (
  user_telegram_id BIGINT PRIMARY KEY REFERENCES users(telegram_user_id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_last_seen_at ON user_last_seen(last_seen_at);

-- Function to update user last seen timestamp
CREATE OR REPLACE FUNCTION update_user_last_seen(user_id BIGINT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_last_seen (user_telegram_id, last_seen_at)
  VALUES (user_id, NOW())
  ON CONFLICT (user_telegram_id) 
  DO UPDATE SET 
    last_seen_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- RLS Policy: Users can read their own last_seen record
ALTER TABLE user_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own last_seen"
  ON user_last_seen FOR SELECT
  USING (auth.uid()::bigint = user_telegram_id);

CREATE POLICY "Users can update their own last_seen"
  ON user_last_seen FOR UPDATE
  USING (auth.uid()::bigint = user_telegram_id);

CREATE POLICY "Users can insert their own last_seen"
  ON user_last_seen FOR INSERT
  WITH CHECK (auth.uid()::bigint = user_telegram_id);

-- For service role (backend)
CREATE POLICY "Service role can manage all last_seen"
  ON user_last_seen FOR ALL
  USING (auth.role() = 'service_role');

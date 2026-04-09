
ALTER TABLE t_p25996638_discord_like_app.dm_messages
  ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(32);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user ON t_p25996638_discord_like_app.friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON t_p25996638_discord_like_app.friends(friend_id, status);


CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.messages (
  id BIGSERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(64) NOT NULL,
  avatar_color VARCHAR(16) NOT NULL DEFAULT '#00ff88',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON t_p25996638_discord_like_app.messages(server_id, channel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.dm_messages (
  id BIGSERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_pair ON t_p25996638_discord_like_app.dm_messages(
  LEAST(from_user_id, to_user_id),
  GREATEST(from_user_id, to_user_id),
  created_at DESC
);

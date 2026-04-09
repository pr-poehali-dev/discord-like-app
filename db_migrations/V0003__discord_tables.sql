
CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.message_reactions (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL,
  user_id INTEGER NOT NULL,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_msg ON t_p25996638_discord_like_app.message_reactions(message_id);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  abbr VARCHAR(8) NOT NULL,
  color VARCHAR(16) NOT NULL DEFAULT '#00ff88',
  owner_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.channels (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  name VARCHAR(64) NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'text',
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_server ON t_p25996638_discord_like_app.channels(server_id);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.server_members (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_server_members ON t_p25996638_discord_like_app.server_members(server_id, user_id);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.online_presence (
  user_id INTEGER PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(16) NOT NULL DEFAULT 'online'
);

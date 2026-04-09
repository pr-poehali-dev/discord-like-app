
CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.voice_sessions (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(64) NOT NULL,
  avatar_color VARCHAR(16) NOT NULL DEFAULT '#00ff88',
  muted BOOLEAN NOT NULL DEFAULT FALSE,
  deafened BOOLEAN NOT NULL DEFAULT FALSE,
  streaming BOOLEAN NOT NULL DEFAULT FALSE,
  video BOOLEAN NOT NULL DEFAULT FALSE,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(server_id, channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_channel ON t_p25996638_discord_like_app.voice_sessions(server_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_voice_user ON t_p25996638_discord_like_app.voice_sessions(user_id);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.forum_threads (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_name VARCHAR(64) NOT NULL,
  avatar_color VARCHAR(16) NOT NULL DEFAULT '#00ff88',
  title VARCHAR(256) NOT NULL,
  content TEXT NOT NULL,
  tags VARCHAR(256),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reply_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_channel ON t_p25996638_discord_like_app.forum_threads(server_id, channel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.forum_replies (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_name VARCHAR(64) NOT NULL,
  avatar_color VARCHAR(16) NOT NULL DEFAULT '#00ff88',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies ON t_p25996638_discord_like_app.forum_replies(thread_id, created_at ASC);

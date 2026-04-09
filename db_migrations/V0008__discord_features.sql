
-- Закреплённые сообщения
CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.pinned_messages (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  pinned_by INTEGER NOT NULL,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

-- Typing indicators
CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.typing_indicators (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(64) NOT NULL,
  last_typed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Инвайт-ссылки
CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.server_invites (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  code VARCHAR(16) NOT NULL UNIQUE,
  created_by INTEGER NOT NULL,
  uses INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ответы на сообщения (reply-to)
ALTER TABLE t_p25996638_discord_like_app.messages
  ADD COLUMN IF NOT EXISTS reply_to_id INTEGER,
  ADD COLUMN IF NOT EXISTS reply_to_text TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_user VARCHAR(64),
  ADD COLUMN IF NOT EXISTS mentions TEXT;

-- Категории каналов
CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.channel_categories (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL,
  name VARCHAR(64) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  collapsed BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE t_p25996638_discord_like_app.channels
  ADD COLUMN IF NOT EXISTS category_id INTEGER,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS slowmode INTEGER DEFAULT 0;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_pinned_channel ON t_p25996638_discord_like_app.pinned_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_channel ON t_p25996638_discord_like_app.typing_indicators(channel_id, last_typed);
CREATE INDEX IF NOT EXISTS idx_invite_code ON t_p25996638_discord_like_app.server_invites(code);

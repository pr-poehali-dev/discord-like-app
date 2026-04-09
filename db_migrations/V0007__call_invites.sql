CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.call_invites (
  id SERIAL PRIMARY KEY,
  caller_id INTEGER NOT NULL,
  caller_name VARCHAR(64) NOT NULL,
  caller_color VARCHAR(16) NOT NULL DEFAULT '#00ff88',
  callee_id INTEGER NOT NULL,
  call_type VARCHAR(8) NOT NULL DEFAULT 'audio',
  status VARCHAR(16) NOT NULL DEFAULT 'ringing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_invites_callee ON t_p25996638_discord_like_app.call_invites(callee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_invites_caller ON t_p25996638_discord_like_app.call_invites(caller_id, status, created_at DESC);

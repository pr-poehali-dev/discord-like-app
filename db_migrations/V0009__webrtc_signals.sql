CREATE TABLE IF NOT EXISTS t_p25996638_discord_like_app.webrtc_signals (
  id SERIAL PRIMARY KEY,
  call_id INTEGER NOT NULL,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  type VARCHAR(16) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_webrtc_to ON t_p25996638_discord_like_app.webrtc_signals(to_user_id, call_id, consumed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webrtc_call ON t_p25996638_discord_like_app.webrtc_signals(call_id);

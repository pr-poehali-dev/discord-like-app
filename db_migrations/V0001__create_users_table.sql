CREATE TABLE t_p25996638_discord_like_app.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_color VARCHAR(16) DEFAULT '#00ff88',
    status VARCHAR(16) DEFAULT 'online',
    created_at TIMESTAMP DEFAULT NOW()
);
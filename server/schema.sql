-- Runway Rascals — Neon / Postgres schema
-- Applied automatically by db.ensureStore() when DATABASE_URL is set.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    character_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL UNIQUE,
    unlocked_levels TEXT[] NOT NULL DEFAULT ARRAY['newyork']::TEXT[],
    owned_items TEXT[] NOT NULL DEFAULT ARRAY['street-basics']::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    stripe_session_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);

CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
